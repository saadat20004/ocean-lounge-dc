/* Ocean Lounge DC — shared site script */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Opening hours (DC time) ---------- */
  // day index: 0 Sun ... 6 Sat. Close hours past 24 run into the next morning.
  var HOURS = { 2: [18, 24], 3: [18, 24], 4: [21, 24], 5: [21, 27], 6: [21, 27] };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmtHour(h) {
    h = h % 24;
    var suffix = h >= 12 ? "PM" : "AM";
    var x = h % 12 === 0 ? 12 : h % 12;
    return x + " " + suffix;
  }
  function dcNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
      var dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      var h = parseInt(map.hour, 10) % 24;
      return { dow: dow, h: h + parseInt(map.minute, 10) / 60 };
    } catch (e) {
      var d = new Date(); return { dow: d.getDay(), h: d.getHours() + d.getMinutes() / 60 };
    }
  }
  function openStatus() {
    var n = dcNow();
    var today = HOURS[n.dow];
    var yday = HOURS[(n.dow + 6) % 7];
    if (yday && yday[1] > 24 && n.h < yday[1] - 24) return { open: true, text: "Open now · until " + fmtHour(yday[1]) };
    if (today && n.h >= today[0] && n.h < today[1]) return { open: true, text: "Open now · until " + fmtHour(today[1]) };
    if (today && n.h < today[0]) return { open: false, text: "Opens tonight at " + fmtHour(today[0]) };
    for (var i = 1; i <= 7; i++) {
      var d = (n.dow + i) % 7;
      if (HOURS[d]) return { open: false, text: "Closed now · Opens " + (i === 1 ? "tomorrow" : DAY_NAMES[d]) + " " + fmtHour(HOURS[d][0]) };
    }
    return { open: false, text: "Closed now" };
  }
  function applyStatus() {
    var s = openStatus();
    $$("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", s.open);
      var t = $("[data-status-text]", el); if (t) t.textContent = s.text;
    });
    var n = dcNow();
    var dow = n.dow;
    // before 4 AM counts as the previous night
    if (n.h < 4) dow = (dow + 6) % 7;
    $$("[data-day]").forEach(function (el) {
      if (parseInt(el.getAttribute("data-day"), 10) === dow) el.classList.add(el.tagName === "TR" ? "is-today" : "is-tonight");
    });
  }

  /* ---------- Header ---------- */
  function initHeader() {
    var header = $(".site-header");
    var toTop = $(".to-top");
    var onScroll = function () {
      var y = window.scrollY || 0;
      if (header) header.classList.toggle("is-scrolled", y > 10);
      if (toTop) toTop.classList.toggle("is-visible", y > 700);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

    var burger = $(".burger");
    var drawer = $(".drawer");
    function setMenu(open) {
      document.body.classList.toggle("menu-open", open);
      if (burger) burger.setAttribute("aria-expanded", String(open));
      if (drawer) drawer.setAttribute("aria-hidden", String(!open));
      if (open) { var c = $(".drawer__close"); if (c) c.focus(); } else if (burger) burger.focus();
    }
    if (burger) burger.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    if (drawer) {
      drawer.addEventListener("click", function (e) { if (e.target === drawer) setMenu(false); });
      var close = $(".drawer__close", drawer); if (close) close.addEventListener("click", function () { setMenu(false); });
      $$(".drawer__group > button", drawer).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var g = btn.parentElement; var open = !g.classList.contains("is-open");
          g.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open));
        });
      });
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    // anything already on screen shows immediately
    requestAnimationFrame(function () {
      items.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("is-in"); });
    });
  }

  /* ---------- Page transitions ---------- */
  function initTransitions() {
    if (reduceMotion) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target === "_blank" || /^(mailto:|tel:|sms:|https?:)/i.test(href) || a.hasAttribute("download")) return;
      e.preventDefault();
      document.documentElement.classList.add("is-leaving");
      setTimeout(function () { window.location.href = href; }, 280);
    });
    window.addEventListener("pageshow", function () { document.documentElement.classList.remove("is-leaving"); });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    var triggers = $$("[data-lightbox]");
    if (!triggers.length) return;
    var box = document.createElement("div");
    box.className = "lightbox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Image viewer");
    box.innerHTML = '<img alt="">' +
      '<button class="icon-btn lightbox__close" type="button" aria-label="Close">' + ICON.close + '</button>' +
      '<button class="icon-btn lightbox__prev" type="button" aria-label="Previous image">' + ICON.left + '</button>' +
      '<button class="icon-btn lightbox__next" type="button" aria-label="Next image">' + ICON.right + '</button>' +
      '<div class="lightbox__count"></div>';
    document.body.appendChild(box);
    var img = $("img", box), count = $(".lightbox__count", box);
    var group = [], idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + group.length) % group.length;
      var t = group[idx];
      img.src = t.getAttribute("data-full");
      img.alt = t.getAttribute("data-alt") || "";
      count.textContent = (idx + 1) + " / " + group.length;
      var multi = group.length > 1;
      $(".lightbox__prev", box).hidden = !multi; $(".lightbox__next", box).hidden = !multi; count.hidden = !multi;
    }
    function open(t) {
      var name = t.getAttribute("data-lightbox");
      group = triggers.filter(function (x) { return x.getAttribute("data-lightbox") === name && !x.closest(".is-filtered-out"); });
      lastFocus = t; show(group.indexOf(t));
      box.classList.add("is-open"); document.body.style.overflow = "hidden";
      $(".lightbox__close", box).focus();
    }
    function close() { box.classList.remove("is-open"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    triggers.forEach(function (t) { t.addEventListener("click", function (e) { e.preventDefault(); open(t); }); });
    $(".lightbox__close", box).addEventListener("click", close);
    $(".lightbox__prev", box).addEventListener("click", function () { show(idx - 1); });
    $(".lightbox__next", box).addEventListener("click", function () { show(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    var sx = 0;
    box.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- Rails ---------- */
  function initRails() {
    $$("[data-rail]").forEach(function (rail) {
      var id = rail.id;
      var step = function () { var c = rail.firstElementChild; return c ? c.getBoundingClientRect().width + 18 : 300; };
      $$('[data-rail-prev="' + id + '"]').forEach(function (b) { b.addEventListener("click", function () { rail.scrollBy({ left: -step() * 2, behavior: "smooth" }); }); });
      $$('[data-rail-next="' + id + '"]').forEach(function (b) { b.addEventListener("click", function () { rail.scrollBy({ left: step() * 2, behavior: "smooth" }); }); });
    });
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    $$(".acc__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".acc__item");
        var open = !item.classList.contains("is-open");
        item.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ---------- Filter tabs ---------- */
  function initTabs() {
    $$("[data-filter-group]").forEach(function (bar) {
      var target = $(bar.getAttribute("data-filter-group"));
      if (!target) return;
      var tabs = $$("[data-filter]", bar);
      function apply(f) {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-filter") === f)); });
        $$("[data-cat]", target).forEach(function (it) {
          var show = f === "all" || it.getAttribute("data-cat").split(" ").indexOf(f) > -1;
          it.classList.toggle("is-filtered-out", !show);
          if (show) { it.classList.remove("fade-in"); void it.offsetWidth; it.classList.add("fade-in"); }
        });
      }
      tabs.forEach(function (t) { t.addEventListener("click", function () { apply(t.getAttribute("data-filter")); }); });
      var hash = (location.hash || "").replace("#", "");
      if (hash && tabs.some(function (t) { return t.getAttribute("data-filter") === hash; })) apply(hash);
    });
  }

  /* ---------- Forms (front-end validation + confirmation) ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validate(form) {
    var ok = true, first = null;
    $$(".field", form).forEach(function (f) { f.classList.remove("has-error"); });
    $$("[required]", form).forEach(function (input) {
      var field = input.closest(".field"); var bad = false;
      if (input.type === "radio") { bad = !$('input[name="' + input.name + '"]:checked', form); }
      else if (input.type === "checkbox") { bad = !input.checked; }
      else if (!input.value.trim()) { bad = true; }
      else if (input.type === "email" && !EMAIL.test(input.value.trim())) { bad = true; }
      else if (input.type === "tel" && input.value.replace(/\D/g, "").length < 10) { bad = true; }
      if (bad) { ok = false; if (field) field.classList.add("has-error"); if (!first) first = input; }
    });
    if (first) first.focus();
    return ok;
  }
  function successHTML(title, text) {
    return '<div class="success" role="status"><div class="success__icon">' + ICON.check + '</div><h3>' + title + '</h3><p class="muted">' + text + '</p></div>';
  }
  function initForms() {
    $$("form[data-form]").forEach(function (form) {
      form.setAttribute("novalidate", "");
      $$("input, select, textarea", form).forEach(function (el) {
        el.addEventListener("input", function () { var f = el.closest(".field"); if (f) f.classList.remove("has-error"); });
        el.addEventListener("change", function () { var f = el.closest(".field"); if (f) f.classList.remove("has-error"); });
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate(form)) return;
        // NOTE: connect this form to your form handler (Formspree, Netlify Forms, your API) here.
        var name = (form.querySelector('[name="first_name"]') || {}).value || "";
        var title = form.getAttribute("data-success-title") || "Thank you!";
        var text = form.getAttribute("data-success-text") || "We received your message.";
        var wrap = document.createElement("div");
        wrap.innerHTML = successHTML(title.replace("{name}", name.trim()).replace(/,\s*!/, "!").replace(/\s+!/, "!"), text);
        form.replaceWith(wrap.firstChild);
      });
    });
  }

  /* ---------- Star rating ---------- */
  function initRating() {
    $$(".rating").forEach(function (r) {
      var labels = $$("label", r);
      var out = r.parentElement.querySelector(".rating__text");
      function paint(n) { labels.forEach(function (l, i) { $("svg", l).classList.toggle("is-on", i < n); }); }
      labels.forEach(function (l, i) {
        var input = $("input", l);
        l.addEventListener("mouseenter", function () { labels.forEach(function (x, j) { x.classList.toggle("is-hover", j <= i); }); });
        l.addEventListener("mouseleave", function () { labels.forEach(function (x) { x.classList.remove("is-hover"); }); });
        input.addEventListener("change", function () { r.classList.add("has-value"); paint(i + 1); if (out) out.textContent = input.getAttribute("data-label"); });
      });
    });
  }

  /* ---------- Copy buttons ---------- */
  function initCopy() {
    $$("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = b.getAttribute("data-copy"); var label = b.textContent;
        var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = label; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      });
    });
  }

  /* ---------- Booking page ---------- */
  function money(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function initBooking() {
    var root = $("#booking");
    if (!root || !window.OL_PACKAGES) return;
    var P = window.OL_PACKAGES;
    var key = new URLSearchParams(location.search).get("pkg");
    var pkg = P.filter(function (p) { return p.id === key; })[0] || P[0];
    document.title = pkg.name + " | Ocean Lounge DC";

    // Fill package info
    $$("[data-pkg]").forEach(function (el) {
      var f = el.getAttribute("data-pkg");
      if (f === "img") { el.src = pkg.hero; el.alt = el.closest(".page-hero") ? "" : pkg.name; }
      else if (f === "includes") { el.innerHTML = pkg.includes.map(function (x) { return "<li>" + x + "</li>"; }).join(""); }
      else if (f === "price") { el.textContent = pkg.price ? money(pkg.price) : "Call for quote"; }
      else if (f === "duration") { el.textContent = pkg.duration; }
      else if (pkg[f] != null) { el.textContent = pkg[f]; }
    });
    var gallery = $("[data-pkg-gallery]");
    if (gallery) {
      gallery.innerHTML = pkg.gallery.map(function (g, i) {
        return '<button type="button" data-lightbox="pkg" data-full="' + g.full + '" data-alt="' + pkg.name + ' photo ' + (i + 1) + '"><img src="' + g.thumb + '" alt="' + pkg.name + ' photo ' + (i + 1) + '" loading="lazy"></button>';
      }).join("");
    }
    var crumb = $("[data-pkg-crumb]"); if (crumb) crumb.textContent = pkg.name;

    // State
    var state = { date: null, slot: null, guests: Math.min(pkg.baseGuests, pkg.cat === "venue" ? 20 : pkg.baseGuests) };
    if (pkg.cat === "venue") state.guests = 20;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var view = new Date(now.getFullYear(), now.getMonth(), 1);
    var maxView = new Date(now.getFullYear(), now.getMonth() + 5, 1);
    var monthEl = $(".cal__month", root), grid = $(".cal__grid", root), slotsEl = $(".slots", root);
    var prev = $("[data-cal-prev]", root), next = $("[data-cal-next]", root);

    function allowed(d) { return pkg.days.indexOf(d.getDay()) > -1; }
    function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }
    function renderCal() {
      monthEl.textContent = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      var html = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(function (d) { return '<div class="cal__dow" aria-hidden="true">' + d + "</div>"; }).join("");
      var first = view.getDay();
      var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < first; i++) html += '<button class="cal__day is-blank" tabindex="-1" aria-hidden="true" disabled></button>';
      for (var d = 1; d <= days; d++) {
        var date = new Date(view.getFullYear(), view.getMonth(), d);
        var dis = date < now || !allowed(date);
        var label = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + (dis ? ", unavailable" : "");
        html += '<button type="button" class="cal__day' + (sameDay(date, now) ? " is-today" : "") + '" data-ts="' + date.getTime() + '" aria-label="' + label + '" aria-pressed="' + sameDay(date, state.date) + '"' + (dis ? " disabled" : "") + ">" + d + "</button>";
      }
      grid.innerHTML = html;
      prev.disabled = view <= new Date(now.getFullYear(), now.getMonth(), 1);
      next.disabled = view >= maxView;
    }
    function renderSlots() {
      if (!state.date) { slotsEl.innerHTML = '<p class="muted">Pick a date to see the session times.</p>'; return; }
      var list = pkg.slots[state.date.getDay()] || pkg.slots.all || [];
      slotsEl.innerHTML = list.map(function (s) { return '<button type="button" class="slot" aria-pressed="' + (state.slot === s) + '">' + s + "</button>"; }).join("");
      if (list.length === 1 && !state.slot) { state.slot = list[0]; renderSlots(); }
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".cal__day"); if (!b || b.disabled) return;
      state.date = new Date(parseInt(b.getAttribute("data-ts"), 10)); state.slot = null;
      renderCal(); renderSlots(); update();
      var f = $('.cal__day[aria-pressed="true"]', grid); if (f) f.focus();
    });
    slotsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".slot"); if (!b) return;
      state.slot = b.textContent; renderSlots(); update();
    });
    prev.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
    next.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });

    // Guests
    var out = $("[data-guests]", root), minus = $("[data-guests-minus]", root), plus = $("[data-guests-plus]", root);
    var guestHint = $("[data-guest-hint]", root);
    if (guestHint) guestHint.textContent = pkg.guestNote;
    function setGuests(n) {
      state.guests = Math.max(1, Math.min(pkg.maxGuests, n));
      out.textContent = state.guests; minus.disabled = state.guests <= 1; plus.disabled = state.guests >= pkg.maxGuests; update();
    }
    minus.addEventListener("click", function () { setGuests(state.guests - 1); });
    plus.addEventListener("click", function () { setGuests(state.guests + 1); });

    // Summary + totals
    var step1 = $("[data-step='1']", root), step2 = $("[data-step='2']", root), step3 = $("[data-step='3']", root);
    var cont = $("[data-continue]", root), back = $("[data-back]", root);
    var progress = $$(".progress li", root);
    function extras() { return pkg.extraFee ? Math.max(0, state.guests - pkg.baseGuests) * pkg.extraFee : 0; }
    function update() {
      var sd = $("[data-sum='date']"), ss = $("[data-sum='slot']"), sg = $("[data-sum='guests']"), sx = $("[data-sum='extra']"), st = $("[data-sum='total']"), sp = $("[data-sum='deposit']");
      if (sd) sd.textContent = state.date ? state.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Not chosen";
      if (ss) ss.textContent = state.slot || "Not chosen";
      if (sg) sg.textContent = state.guests + (state.guests === 1 ? " guest" : " guests");
      var ex = extras();
      if (sx) { sx.textContent = money(ex); sx.closest("div").hidden = !pkg.extraFee; }
      if (pkg.price) {
        var total = pkg.price + ex;
        if (st) st.textContent = money(total);
        if (sp) sp.textContent = money(Math.round(total * 25) / 100);
      } else {
        if (st) st.textContent = "Call for quote";
        if (sp) sp.closest("div").hidden = true;
      }
      cont.disabled = !(state.date && state.slot);
    }
    function go(step) {
      step1.hidden = step !== 1; step2.hidden = step !== 2; if (step3) step3.hidden = step !== 3;
      progress.forEach(function (li, i) {
        li.classList.toggle("is-active", i === step - 1); li.classList.toggle("is-done", i < step - 1);
        if (i === step - 1) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
      var top = root.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }
    cont.addEventListener("click", function () { if (!cont.disabled) go(2); });
    back.addEventListener("click", function () { go(1); });

    var form = $("#booking-form");
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      // NOTE: send the booking request to your backend / booking system here.
      step3.innerHTML = confirmHTML();
      var ics = $("[data-ics]", step3);
      if (ics) ics.addEventListener("click", downloadICS);
      go(3);
      progress[2].classList.remove("is-active"); progress[2].classList.add("is-done");
    });

    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function field(n) { var el = form.querySelector("[name='" + n + "']"); return el ? el.value.trim() : ""; }
    function row(dt, dd, cls) { return "<div" + (cls ? ' class="' + cls + '"' : "") + "><dt>" + dt + "</dt><dd>" + dd + "</dd></div>"; }

    function confirmHTML() {
      var when = state.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      var ex = extras(), total = pkg.price ? pkg.price + ex : 0;
      var booking = row("Package", esc(pkg.name)) + row("Date", when) + row("Time", esc(state.slot)) +
        row("Guests", state.guests + (state.guests === 1 ? " guest" : " guests")) +
        (pkg.extraFee && ex ? row("Extra guests", money(ex)) : "") +
        (pkg.price ? row("Total", money(total), "total") + row("Deposit due (25%)", money(Math.round(total * 25) / 100)) : row("Total", "Custom quote", "total"));
      var contact = row("Name", esc(field("first_name") + " " + field("last_name"))) + row("Email", esc(field("email"))) + row("Phone", esc(field("phone"))) +
        (field("notes") ? row("Notes", esc(field("notes"))) : "");
      var next = pkg.price ? [
        "Watch your inbox at <strong>" + esc(field("email")) + "</strong> for the 25% deposit invoice.",
        "Your section is locked in once the deposit is paid. We’ll send a confirmation email.",
        "Arrive on time. Your reservation starts at the booked time, with a grace period for late arrivals.",
        "Bring a valid ID (21+) and dress smart casual."
      ] : [
        "Our events team will call <strong>" + esc(field("phone")) + "</strong> within one business day with a custom quote.",
        "Once you approve the quote, we’ll email your deposit invoice and confirm your date.",
        "Bring a valid ID (21+) and dress smart casual."
      ];
      return successHTML("You're on the list, " + esc(field("first_name")) + "!",
          "We’ve received your request for <strong>" + esc(pkg.name) + "</strong>. Nothing has been charged yet.") +
        '<div class="confirm">' +
          '<div class="confirm__block"><h3>Booking</h3><dl>' + booking + "</dl></div>" +
          '<div class="confirm__block"><h3>Your details</h3><dl>' + contact + "</dl></div>" +
          '<div class="confirm__block"><h3>What happens next</h3><ol class="confirm__next">' + next.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol></div>" +
          '<p class="muted confirm__where">Ocean Lounge DC · 1220 H St NE, Washington, DC 20002 · <a class="link" href="tel:+12024950920">202-495-0920</a></p>' +
          '<div class="row">' +
            (slotTimes() ? '<button class="btn btn--gold" type="button" data-ics>Add to calendar</button>' : "") +
            '<a class="btn btn--ghost" href="reservations.html">See other packages</a><a class="btn btn--ghost" href="index.html">Back to home</a>' +
          "</div>" +
        "</div>";
    }

    // Parse "9:00 PM – 12:00 AM" (or a lone start like "2:00 PM", treated as the 4-hour minimum)
    // into start/end Dates on the chosen day; the end rolls past midnight when needed.
    function slotTimes() {
      var m = (state.slot || "").match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)(?:\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*([AP]M))?/i);
      if (!m) return null;
      function at(h, mi, ap) { var d = new Date(state.date); h = parseInt(h, 10) % 12 + (/p/i.test(ap) ? 12 : 0); d.setHours(h, parseInt(mi || "0", 10), 0, 0); return d; }
      var s = at(m[1], m[2], m[3]);
      var e = m[4] ? at(m[4], m[5], m[6]) : new Date(s.getTime() + 4 * 3600 * 1000);
      if (e <= s) e.setDate(e.getDate() + 1);
      return { start: s, end: e };
    }
    function downloadICS() {
      var t = slotTimes(); if (!t) return;
      function f(d) { var p = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00"; }
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ocean Lounge DC//Booking//EN", "BEGIN:VEVENT",
        "UID:" + Date.now() + "@oceanloungedc", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(t.start), "DTEND:" + f(t.end),
        "SUMMARY:" + pkg.name + " at Ocean Lounge DC", "LOCATION:1220 H St NE\\, Washington\\, DC 20002",
        "DESCRIPTION:" + state.guests + " guests. Booking request pending confirmation.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "ocean-lounge-booking.ics";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }

    renderCal(); renderSlots(); setGuests(state.guests); go(1);
    window.scrollTo(0, 0);
  }

  /* ---------- Icons used by JS ---------- */
  var ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyStatus();
    initHeader();
    initBooking();
    initReveal();
    initTransitions();
    initLightbox();
    initRails();
    initAccordion();
    initTabs();
    initForms();
    initRating();
    initCopy();
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });
})();
