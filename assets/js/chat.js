/* Ocean Lounge DC — chat assistant (static, display only)
   Answers common questions from the site's own FAQ content using keyword matching.
   NOTE: swap answer() for a call to your AI backend when one is ready.
*/
(function () {
  "use strict";

  var PHONE = '<a href="tel:+12024950920">202-495-0920</a>';
  var INTENTS = [
    { id: "hours", label: "Opening hours", keys: ["hour", "open", "close", "closing", "time", "tonight", "today", "when", "schedule", "late"],
      reply: function () {
        var s = document.querySelector("[data-status-text]");
        return (s ? "<strong>" + s.textContent + ".</strong><br>" : "") +
          "Tuesday & Wednesday: 6 PM – 12 AM<br>Thursday: 9 PM – 12 AM<br>Friday & Saturday: 9 PM – 3 AM<br>Sunday brunch is coming soon. Special events can run different times, see <a href=\"events.html\">events</a>.";
      } },
    { id: "reserve", label: "Book a table", keys: ["reserv", "book", "table", "section", "bottle", "vip", "package", "price", "cost", "deposit", "platinum"],
      reply: "You can pick a section package and request your date online on the <a href=\"reservations.html\">reservations page</a>. Packages include bottle service, and Platinum is our VIP section. A 25% non-refundable deposit secures your booking. Prefer to talk? Call " + PHONE + "." },
    { id: "birthday", label: "Birthday party", keys: ["birthday", "bday", "celebrat", "party", "anniversary"],
      reply: "Happy early birthday! 🎉 We have dedicated <a href=\"birthday-package.html\">birthday packages</a> with a reserved section and bottles. Book online or call " + PHONE + " and we'll help you plan it." },
    { id: "events", label: "This week's events", keys: ["event", "karaoke", "thursday", "friday", "saturday", "sunday", "nfl", "football", "music", "dj", "live", "theme", "lineup", "new year"],
      reply: "Our weekly lineup: <strong>Karaoke Thursdays</strong>, <strong>Friday Vibrations</strong>, <strong>Sexy Saturdays</strong> and <strong>NFL Day Parties</strong> on Sundays, plus special events like New Year's Eve. See the <a href=\"daily-events.html\">weekly lineup</a> or <a href=\"events.html\">all events</a>." },
    { id: "location", label: "Location & parking", keys: ["where", "address", "location", "located", "direction", "find", "map", "park", "uber", "lyft", "metro"],
      reply: "We're at <strong>1220 H St NE, Washington, DC 20002</strong>, on H Street NE in Capitol Hill. <a href=\"https://www.google.com/maps/search/?api=1&query=Ocean+Lounge+DC+1220+H+St+NE+Washington+DC+20002\" target=\"_blank\" rel=\"noopener\">Open in Maps</a>.<br>There's street parking nearby, but we recommend ride-sharing." },
    { id: "dress", label: "Dress code", keys: ["dress", "wear", "outfit", "attire", "sneaker", "shoe", "cloth"],
      reply: "Smart casual. Please dress to match the upscale lounge atmosphere. Some special events ask for upscale attire with no athletic wear or sneakers." },
    { id: "id", keys: ["id", "age", "21", "old", "minor", "under"],
      reply: "All guests must be <strong>21 or older</strong> with a valid photo ID." },
    { id: "private", label: "Private events", keys: ["private", "rent", "buyout", "corporate", "group", "space", "venue", "vault", "rooftop", "terrace", "signature"],
      reply: "Yes! We have three levels for private events: the <strong>Signature Level</strong>, the <strong>VIP & Rooftop Terrace</strong> and <strong>The Vault</strong>. See them on the <a href=\"experiences.html\">private spaces page</a> or ask about <a href=\"groups.html\">groups</a>." },
    { id: "menu", label: "Menu & hookah", keys: ["menu", "food", "eat", "drink", "cocktail", "hookah", "shisha", "happy", "wing", "kitchen", "brunch"],
      reply: "Check our <a href=\"menu.html\">menu</a> for food, cocktails, bottles and premium hookah, plus happy hour pricing." },
    { id: "cancel", keys: ["cancel", "refund", "late", "grace", "change", "reschedul"],
      reply: "The 25% deposit is non-refundable. Your reservation starts at the booked time: Friday and Saturday have a 2-hour grace period, Sunday to Thursday 1.5 hours. Running late or need to change? Call " + PHONE + "." },
    { id: "contact", keys: ["contact", "phone", "call", "email", "human", "person", "staff", "talk", "speak"],
      reply: "Call or text us at " + PHONE + ", email <a href=\"mailto:info@oceanloungedc.com\">info@oceanloungedc.com</a>, or use the <a href=\"contact.html\">contact page</a>." },
    { id: "hi", keys: ["hi", "hello", "hey", "yo", "sup", "good evening", "good morning"],
      reply: "Hey! 👋 What can I help you with tonight?" },
    { id: "thanks", keys: ["thank", "thx", "appreciate", "great", "awesome", "cool"],
      reply: "Anytime! See you at Ocean Lounge. 🌊" }
  ];
  var FALLBACK = "I'm not sure about that one. Try one of the topics below, or reach the team directly at " + PHONE + ".";
  var CHIPS = INTENTS.filter(function (i) { return i.label; });

  function answer(text) {
    var q = " " + text.toLowerCase().replace(/[^a-z0-9 ]/g, " ") + " ";
    var best = null, score = 0;
    INTENTS.forEach(function (it) {
      var s = 0;
      it.keys.forEach(function (k) {
        // short keys must match a whole word; longer keys can match a word start ("reserv" → "reservation")
        if (k.length <= 3 ? q.indexOf(" " + k + " ") > -1 : q.indexOf(" " + k) > -1) s += k.length > 3 ? 2 : 1;
      });
      if (s > score) { score = s; best = it; }
    });
    if (!best) return FALLBACK;
    return typeof best.reply === "function" ? best.reply() : best.reply;
  }

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';

  function build() {
    var wrap = document.createElement("div");
    wrap.className = "chat";
    wrap.innerHTML =
      '<button class="chat__fab" type="button" aria-expanded="false" aria-controls="chat-panel" aria-label="Chat with us">' + ICON_CHAT + '<span class="chat__fab-close">' + ICON_CLOSE + "</span></button>" +
      '<section class="chat__panel" id="chat-panel" role="dialog" aria-label="Ocean Lounge assistant" hidden>' +
        '<header class="chat__head"><img src="assets/img/favicon-180.png" alt="" width="40" height="40">' +
          '<div><strong>Ocean Lounge Assistant</strong><span><i></i>Online · replies instantly</span></div>' +
          '<button class="chat__x" type="button" aria-label="Close chat">' + ICON_CLOSE + "</button></header>" +
        '<div class="chat__log" aria-live="polite"></div>' +
        '<div class="chat__chips"></div>' +
        '<form class="chat__form" autocomplete="off"><label class="sr-only" for="chat-input">Your question</label>' +
          '<input id="chat-input" type="text" placeholder="Ask about hours, tables, events…" maxlength="300">' +
          '<button type="submit" aria-label="Send">' + ICON_SEND + "</button></form>" +
        '<p class="chat__note">Automated answers. For bookings call ' + PHONE + ".</p>" +
      "</section>";
    document.body.appendChild(wrap);
    return wrap;
  }

  function init() {
    var root = build();
    var fab = root.querySelector(".chat__fab"), panel = root.querySelector(".chat__panel");
    var log = root.querySelector(".chat__log"), chips = root.querySelector(".chat__chips");
    var form = root.querySelector(".chat__form"), input = root.querySelector("#chat-input");
    var started = false;

    function add(who, html) {
      var m = document.createElement("div");
      m.className = "chat__msg chat__msg--" + who;
      if (who === "user") m.textContent = html; else m.innerHTML = html;
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }
    function botSay(html) {
      var t = add("bot", "<span class=\"chat__typing\"><i></i><i></i><i></i></span>");
      setTimeout(function () { t.innerHTML = html; log.scrollTop = log.scrollHeight; }, 550 + Math.random() * 400);
    }
    function ask(text) {
      text = text.trim(); if (!text) return;
      add("user", text);
      botSay(answer(text));
    }
    chips.innerHTML = CHIPS.map(function (c) { return '<button type="button">' + c.label + "</button>"; }).join("");
    chips.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) ask(b.textContent); });
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; });

    function setOpen(open) {
      panel.hidden = !open;
      root.classList.toggle("is-open", open);
      fab.setAttribute("aria-expanded", String(open));
      fab.setAttribute("aria-label", open ? "Close chat" : "Chat with us");
      if (open && !started) { started = true; botSay("Hi there! 👋 I'm the Ocean Lounge assistant. Ask me about hours, reservations, birthdays, events or anything else."); }
      if (open && window.matchMedia("(min-width: 721px)").matches) input.focus();
      if (!open) fab.focus();
    }
    fab.addEventListener("click", function () { setOpen(panel.hidden); });
    root.querySelector(".chat__x").addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
