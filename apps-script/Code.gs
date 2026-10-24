/**
 * Caravan waitlist: Google Apps Script web app.
 *
 * Appends one row per signup to the "Waitlist" sheet:
 *   timestamp | email | role | city | make
 *
 * Deploy as a web app (Execute as: Me, Who has access: Anyone).
 * Full steps are in README.md. This file is NOT uploaded to your static host.
 */

var SHEET_NAME = 'Waitlist';
var HEADERS = ['timestamp', 'email', 'role', 'city', 'make'];

// Must match the limits in js/form.js
var LIMITS = { email: 254, city: 60, make: 60 };
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var MAX_BODY_CHARS = 2000; // a real signup is far smaller than this
var ROLES = ['buyer', 'dealer'];

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > MAX_BODY_CHARS) return reply_({ ok: false, code: 'invalid' });

    var data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      return reply_({ ok: false, code: 'invalid' });
    }

    // Honeypot: report success so bots learn nothing, but store nothing.
    if (str_(data.company)) return reply_({ ok: true });

    var email = str_(data.email).toLowerCase();
    var role = str_(data.role).toLowerCase();
    var city = str_(data.city);
    var make = str_(data.make);

    // ---- server-side validation (never trust the browser) ----
    if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) {
      return invalid_('email', "That email doesn't look right.");
    }
    if (ROLES.indexOf(role) === -1) {
      return invalid_('role', 'Please choose buyer or dealer.');
    }
    if (city.length > LIMITS.city) {
      return invalid_('city', 'Please keep the city under ' + LIMITS.city + ' characters.');
    }
    if (make.length > LIMITS.make) {
      return invalid_('make', 'Please keep this under ' + LIMITS.make + ' characters.');
    }

    // ---- duplicate check + append, under a lock ----
    // Without the lock, two near-simultaneous posts with the same email could both
    // pass the duplicate check before either row is written.
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return reply_({ ok: false, code: 'server' });

    try {
      var sheet = getSheet_();
      if (emailExists_(sheet, email)) return reply_({ ok: false, code: 'duplicate' });

      sheet.appendRow([
        new Date(),
        safeCell_(email),
        role,
        safeCell_(city),
        safeCell_(make)
      ]);
    } finally {
      lock.releaseLock();
    }

    return reply_({ ok: true });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, code: 'server' });
  }
}

// Visiting the URL in a browser shows this instead of an error page.
function doGet() {
  return reply_({ ok: true, message: 'Caravan waitlist endpoint. POST only.' });
}

/* ---------------- helpers ---------------- */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function emailExists_(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  // Column B holds emails (stored lowercased). Exact, whole-cell match.
  var found = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .createTextFinder(email)
    .matchEntireCell(true)
    .matchCase(false)
    .findNext();
  return found !== null;
}

// Coerce to a trimmed string with control characters removed.
function str_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

// Stop "formula injection": text starting with = + - @ would run as a formula
// when someone opens or exports the sheet. A leading apostrophe forces plain text.
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function invalid_(field, message) {
  return reply_({ ok: false, code: 'invalid', field: field, message: message });
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
