/* ==========================================================
   Caravan waitlist form
   ========================================================== */

/* ---- CONFIG: the ONLY thing you need to change ----
   Paste your Google Apps Script web app URL here (it ends in /exec).
   See README.md → "Set up the Google Sheet and Apps Script".          */
var WAITLIST_ENDPOINT = "";

(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;

  // Must match the limits in apps-script/Code.gs
  var LIMITS = { email: 254, city: 60, make: 60 };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var TIMEOUT_MS = 15000;

  var statusEl = document.getElementById("form-status");
  var button = form.querySelector('button[type="submit"]');
  var buttonLabel = button.querySelector(".btn__label");
  var defaultLabel = buttonLabel.textContent;
  var sending = false;

  var MESSAGES = {
    success: "You're on the list. Shukriya! We'll email you when there's news.",
    duplicate: "This email is already on the list. Nothing more to do.",
    offline: "You seem to be offline. Check your connection and try again.",
    timeout: "That took too long. Please try again in a minute.",
    server: "Something went wrong on our side. Please try again in a minute.",
    invalid: "Some details didn't look right. Please check the form and try again.",
    notConfigured: "The waitlist isn't connected yet. Please check back soon."
  };

  /* ---------- helpers ---------- */

  function setFieldError(name, message) {
    var errEl = document.getElementById("f-" + name + "-err");
    var inputs = form.querySelectorAll('[name="' + name + '"]');
    for (var i = 0; i < inputs.length; i++) {
      if (message) inputs[i].setAttribute("aria-invalid", "true");
      else inputs[i].removeAttribute("aria-invalid");
    }
    if (!errEl) return;
    errEl.textContent = message || "";
    errEl.hidden = !message;
  }

  function showStatus(kind, message) {
    statusEl.className = "form-status form-status--" + kind;
    statusEl.textContent = message;
    statusEl.hidden = false;
  }

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.textContent = "";
  }

  function setSending(isSending) {
    sending = isSending;
    button.disabled = isSending;
    buttonLabel.textContent = isSending ? "Adding you..." : defaultLabel;
  }

  function readForm() {
    var role = form.querySelector('input[name="role"]:checked');
    return {
      email: form.email.value.trim().toLowerCase(),
      role: role ? role.value : "",
      city: form.city.value.trim(),
      make: form.make.value.trim(),
      company: form.company.value // honeypot
    };
  }

  // Returns the name of the first invalid field, or "" when everything is fine.
  function validate(data) {
    var firstBad = "";
    function fail(name, msg) {
      setFieldError(name, msg);
      if (!firstBad) firstBad = name;
    }

    ["email", "role", "city", "make"].forEach(function (n) { setFieldError(n, ""); });

    if (!data.email) fail("email", "Please enter your email.");
    else if (data.email.length > LIMITS.email || !EMAIL_RE.test(data.email))
      fail("email", "That email doesn't look right. Try something like name@example.com.");

    if (data.role !== "buyer" && data.role !== "dealer")
      fail("role", "Please choose buyer or dealer.");

    if (data.city.length > LIMITS.city) fail("city", "Please keep the city under " + LIMITS.city + " characters.");
    if (data.make.length > LIMITS.make) fail("make", "Please keep this under " + LIMITS.make + " characters.");

    return firstBad;
  }

  function focusField(name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (el) el.focus();
  }

  /* ---------- submit ---------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (sending) return; // no double submits

    clearStatus();
    var data = readForm();

    var bad = validate(data);
    if (bad) {
      focusField(bad);
      return;
    }

    // Honeypot filled: almost certainly a bot. Pretend it worked, send nothing.
    if (data.company) {
      form.reset();
      showStatus("success", MESSAGES.success);
      return;
    }

    if (!WAITLIST_ENDPOINT) {
      showStatus("info", MESSAGES.notConfigured);
      if (window.console) console.warn("Caravan: set WAITLIST_ENDPOINT in js/form.js");
      return;
    }

    if ("onLine" in navigator && !navigator.onLine) {
      showStatus("error", MESSAGES.offline);
      return;
    }

    setSending(true);

    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = window.setTimeout(function () {
      if (controller) controller.abort();
    }, TIMEOUT_MS);

    // text/plain keeps this a "simple" CORS request. Apps Script can't answer a
    // preflight, so sending application/json would fail before reaching the script.
    fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        email: data.email,
        role: data.role,
        city: data.city,
        make: data.make,
        company: data.company
      }),
      redirect: "follow",
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (result) {
        if (result && result.ok) {
          form.reset();
          showStatus("success", MESSAGES.success);
        } else if (result && result.code === "duplicate") {
          showStatus("info", MESSAGES.duplicate);
        } else if (result && result.code === "invalid") {
          if (result.field) {
            setFieldError(result.field, result.message || "Please check this field.");
            focusField(result.field);
          }
          showStatus("error", MESSAGES.invalid);
        } else {
          showStatus("error", MESSAGES.server);
        }
      })
      .catch(function (err) {
        var aborted = err && err.name === "AbortError";
        showStatus("error", aborted ? MESSAGES.timeout : MESSAGES.server);
      })
      .then(function () {
        window.clearTimeout(timer);
        setSending(false);
        statusEl.focus();
      });
  });

  // Clear a field's error as soon as the person edits it
  form.addEventListener("input", function (e) {
    if (e.target && e.target.name) setFieldError(e.target.name, "");
  });
})();
