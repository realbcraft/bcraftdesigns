/* ==========================================================
   companion.js : the Bcraft companion for every page.

   - The round profile picture is always in the corner (it slides over when the back-to-top button shows).
   - Scroll, and a speech bubble pops up next to it with a comment on the section you are in.
   - The bubble hides by itself after 5 seconds of no activity (the picture stays).
   - Hover the picture (or tap it) for a small menu bubble. Click it to keep it open.
     (Hovering the comment bubble does nothing; clicking it opens the menu.)

   Self-contained: it injects its own CSS and HTML, so a page only needs
       <script src="companion.js" defer></script>

   TO EDIT A COMMENT: change the text in LINES below.
   TO ADD ONE: add  [ "css selector of the section", "what Bcraft says" ]  to that page.
   A line can also be a list of texts; the bubble rotates through them.
   TO EDIT THE MENU: change MENU below.
   ========================================================== */
(function () {
  "use strict";
  if (document.getElementById("sx-pal")) return;          // never build it twice

  /* ---------- SETTINGS ---------- */
  var AFK_MS = 5000;                                       // no activity for this long = the bubble hides
  var ROTATE_SCREENS = 1.4;                                // in a long section with several lines (gallery, reviews): next line every this many screens of scrolling
  var IMG_PFP = "/images/socials-pfp";                      // the .webp file is used
  var DECO_KEY = "sx-deco";                                // same avatar decoration the socials page remembers
  var MUTE_KEY = "sx-pal-mute";                            // "Mute comments" is remembered on this device
  var SEASON_DECO = { 9: "halloween-ghosts", 11: "christmas-aurora" };   // first-visit decoration when nothing is saved (month 0-11)

  // The menu. Pages link to themselves are skipped automatically.
  //   { label, href }                   opens a page on this site
  //   { label, href, external: true }   opens in a new tab
  //   { label, act: "quip" | "mute" }   built-in actions
  var MENU = [
    { label: "Commission me", href: "/pricing/" },
    { label: "See my work", href: "/work/" },
    { label: "Contact me", href: "/contact/" },
    { label: "Say something", act: "quip" },
    { label: "Mute comments", act: "mute" }
  ];

  // What "Say something" picks from
  var QUIPS = [
    "Hey! Careful with the pixels.",
    "Sparkles? Say less.",
    "Okay okay, that tickles.",
    "Hmm... which thumbnail next?",
    "One more layer. Just one.",
    "Is that 1px off, or is it me?",
    "More glow. Okay, a bit more.",
    "Ctrl+Z is my best friend."
  ];

  var FOOTER = [".site-footer", "Leaving already? Commission me first."];

  var LINES = {
    index: [
      ["#work", "Fresh off the layer stack."],
      ["#reviews", "Don't take my word for it. Take theirs."],
      ["#perks", "Perks! Everybody loves perks."],
      ["[data-news-strip]", "Hot off the press."],
      ["#x-posts", "Sneak peeks land here first."],
      ["#socials", "Find me anywhere. Except under my desk."],
      ["#faq", "Got questions? I might have answers."],
      [".tos-teaser", "Quick read before we start."],
      FOOTER
    ],
    about: [
      [".about-stats", "The numbers so far."],
      [".about-journey", "The origin story. Cue dramatic music."],
      [".about-glimpse", "A little peek at the good stuff."],
      [".page-cta", "Ready when you are."],
      FOOTER
    ],
    work: [
      [".portfolio", ["Take your time. Zoom in. Admire the glow.", "Every pixel here was nudged by hand.", "Is that 1px off, or is it me?", "Spot a favourite yet?", "That one took more layers than it looks.", "More glow? Always more glow."]],
      [".page-cta", "Like what you see? Let's talk."],
      FOOTER
    ],
    pricing: [
      [".pc-status-strip", "Psst, check if slots are open."],
      ["#catalogue", ["Pick your favourite. No wrong answers.", "More glow? Okay, a bit more."]],
      [".tos-teaser", "Read before ordering. Future you says thanks."],
      ["#payments", "Payments: the least fun part."],
      [".pc-custom", "Don't see it? Ask anyway."],
      [".process", "Here's how it all goes down."],
      ["#faq", "Got questions? I might have answers."],
      [".page-cta:not(.tos-teaser)", "Let's make something great."],
      FOOTER
    ],
    reviews: [
      [".review-archive", ["Straight from the people I've worked with.", "I'm not blushing. You're blushing.", "Wow, these are kind.", "Kind words fuel the next render.", "Okay, I'm officially blushing.", "Reading these never gets old."]],
      [".page-cta", "Your review could be next."],
      FOOTER
    ],
    contact: [
      [".contact-trust", "I reply as fast as I render."],
      [".contact-collab", "Let's team up."],
      ["#payments", "Payments: the least fun part."],
      ["#faq", "Got questions? I might have answers."],
      [".contact-bottom", "Still looking around?"],
      [".site-footer", "Don't ghost me. Say hi first!"]
    ],
    news: [
      [".news", "Fresh from the desk."],
      ["#x-posts", "Same sneak peeks, straight from X."],
      FOOTER
    ],
    privacy: [
      ["#who", "Hi, that's me. Nice to meet you."],
      ["#storage", "Boring but important. Worth a skim."],
      ["#messages", "Questions about any of this? Just ask."],
      ["#changes", "Fine print finished. You're a legend."],
      FOOTER
    ],
    socials: [
      ["[aria-labelledby='h-work']", "Need a thumbnail? You're in the right place."],
      ["[aria-labelledby='h-yt']", "Subscribe so I can pretend I'm consistent."],
      ["[aria-labelledby='h-x']", "Sneak peeks land here first."],
      ["[aria-labelledby='h-rbx']", "Join a community. We're friendly, promise."],
      ["[aria-labelledby='h-more']", "Say hi on Discord. I reply faster than I render."],
      [".site-footer", "Leaving already? Commission me first."]
    ],
    tos: [
      ["#payment", "Fair warning: this part matters."],
      ["#respect", "Be kind, get great work. Simple."],
      ["#cancellation", "Nearly there. Fine print is nobody's favourite."],
      FOOTER
    ]
  };

  /* ---------- Which page is this? (works with and without .html) ---------- */
  var page = (location.pathname.replace(/\/+$/, "").split("/").pop() || "index").replace(/\.html?$/i, "") || "index";
  var lines = LINES[page] || [];
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Styles (everything starts with "sx-pal", nothing else on the site is touched) ----------
     No fades and no blur on purpose: the bubble just appears and disappears (with a tiny scale pop),
     so there is nothing that can leave it half-painted or empty. */
  var css = [
    ".sx-pal{--pal-left:1.25rem;position:fixed;z-index:80;left:var(--pal-left);bottom:1.25rem;display:flex;align-items:flex-end;gap:0.6rem;pointer-events:none;transition:left .25s ease}",
    ".sx-pal>*{pointer-events:auto}",
    /* the round back-to-top button takes this corner while it is showing; the companion steps aside, then slides back */
    ".sx-pal.has-totop{--pal-left:5.25rem}",
    ".sx-pal-av{position:relative;flex:none;width:2.6rem;height:2.6rem;margin:0.3rem;padding:0;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s var(--spring,ease)}",
    ".sx-pal-av:hover{transform:scale(1.07)}",
    ".sx-pal-av:focus-visible{outline:3px solid var(--color-accent-bright,#86c5ff);outline-offset:4px}",
    ".sx-pal-avatar{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;border:2px solid rgba(var(--rgb-blue,74,163,255),0.55);border-radius:50%;background:var(--color-surface-raised,#0f1833);color:var(--color-accent-bright,#86c5ff);font:800 1rem var(--font-display,system-ui,sans-serif)}",
    ".sx-pal-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
    ".sx-pal .sx-deco-img{position:absolute;top:50%;left:50%;width:136%;height:136%;max-width:none;object-fit:contain;transform:translate(-50%,-50%);pointer-events:none}",
    ".sx-pal-bubble{max-width:min(18rem,calc(100vw - var(--pal-left) - 5rem));padding:0.65rem 0.95rem 0.7rem;border:1px solid rgba(var(--rgb-blue,74,163,255),0.45);border-radius:16px 16px 16px 4px;background:rgb(15,24,51);box-shadow:0 16px 34px -16px #000,0 0 40px -22px rgba(var(--rgb-blue,74,163,255),0.9);color:#fff;font:600 0.88rem/1.35 var(--font-display,system-ui,sans-serif);cursor:pointer;transform-origin:0 100%}",
    ".sx-pal-bubble[hidden]{display:none}",
    ".sx-pal-bubble.is-pop,.sx-pal-menu.is-pop{animation:sx-pal-pop .3s var(--spring,ease-out)}",
    "@keyframes sx-pal-pop{from{transform:translateX(-6px) scale(0.94)}to{transform:none}}",
    ".sx-pal-text{display:block;overflow-wrap:anywhere}",
    /* the menu is a bubble too: same look as the comment bubble, same spot next to the picture */
    ".sx-pal-menu{display:grid;gap:0.3rem;min-width:min(12.5rem,calc(100vw - var(--pal-left) - 5rem));max-width:min(18rem,calc(100vw - var(--pal-left) - 5rem));padding:0.55rem;border:1px solid rgba(var(--rgb-blue,74,163,255),0.45);border-radius:16px 16px 16px 4px;background:rgb(15,24,51);box-shadow:0 16px 34px -16px #000,0 0 40px -22px rgba(var(--rgb-blue,74,163,255),0.9);transform-origin:0 100%}",
    ".sx-pal-menu[hidden],.sx-pal-menu [hidden]{display:none}",
    ".sx-pal-menu-t{padding:0.2rem 0.5rem 0.15rem;color:#fff;font:700 0.95rem/1.3 var(--font-display,system-ui,sans-serif)}",
    ".sx-pal-menu a,.sx-pal-menu button{display:block;width:100%;padding:0.5rem 0.9rem;border:1px solid rgba(var(--rgb-blue,74,163,255),0.25);border-radius:999px;background:rgba(var(--rgb-blue,74,163,255),0.1);color:var(--color-text,#fff);font:600 0.9rem var(--font-main,system-ui,sans-serif);text-align:left;text-decoration:none;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,color .15s ease}",
    ".sx-pal-menu a:hover,.sx-pal-menu button:hover,.sx-pal-menu a:focus-visible,.sx-pal-menu button:focus-visible{border-color:rgba(var(--rgb-blue,74,163,255),0.7);background:rgba(var(--rgb-blue,74,163,255),0.24);color:var(--color-accent-bright,#86c5ff);outline:0}",
    "@media (prefers-reduced-motion:reduce){.sx-pal,.sx-pal-av{transition:none}.sx-pal-bubble.is-pop,.sx-pal-menu.is-pop{animation:none}}",
    "@media print{.sx-pal{display:none}}"
  ].join("\n");
  var style = document.createElement("style");
  style.id = "sx-pal-css";
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Build it ---------- */
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  var pal = make("div", "sx-pal");
  pal.id = "sx-pal";

  var btn = make("button", "sx-pal-av");
  btn.type = "button";
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "sx-pal-menu");
  btn.setAttribute("aria-label", "Bcraft's menu");
  var avatar = make("span", "sx-pal-avatar");
  var letter = make("span", "", "B");
  letter.setAttribute("aria-hidden", "true");
  var pic = document.createElement("img");
  pic.alt = "";
  pic.hidden = true;
  avatar.appendChild(letter);
  avatar.appendChild(pic);
  var deco = document.createElement("img");
  deco.className = "sx-deco-img";
  deco.alt = "";
  deco.setAttribute("aria-hidden", "true");
  deco.hidden = true;
  btn.appendChild(avatar);
  btn.appendChild(deco);

  var bubble = make("div", "sx-pal-bubble");
  bubble.hidden = true;
  var text = make("span", "sx-pal-text");
  bubble.appendChild(text);

  var menu = make("div", "sx-pal-menu");
  menu.id = "sx-pal-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Bcraft's menu");
  menu.hidden = true;
  menu.appendChild(make("p", "sx-pal-menu-t", "Need something?"));
  var muteBtn = null, quipBtn = null, items = [];
  MENU.forEach(function (it) {
    var el;
    if (it.href) {
      if (!it.external && it.href.replace(/\/+$/, "").replace(/\.html?$/i, "").split("/").pop() === page) return;      // no link to the page you are on
      el = make("a", "", it.label);
      el.href = it.href;
      if (it.external) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
    } else {
      el = make("button", "", it.label);
      el.type = "button";
      el.dataset.act = it.act;
      if (it.act === "mute") muteBtn = el;
      if (it.act === "quip") quipBtn = el;
    }
    el.setAttribute("role", "menuitem");
    menu.appendChild(el);
    items.push(el);
  });

  pal.appendChild(btn);
  pal.appendChild(bubble);
  pal.appendChild(menu);
  document.body.appendChild(pal);

  /* ---------- Images without a known extension ---------- */
  function probe(bases, exts, done) {
    var list = [];
    bases.forEach(function (b) { exts.forEach(function (e) { list.push(b + "." + e); }); });
    var i = 0;
    (function next() {
      if (i >= list.length) return done(null);
      var src = list[i++], im = new Image();
      im.onload = function () { done(src); };
      im.onerror = next;
      im.src = src;
    })();
  }
  probe([IMG_PFP], ["webp"], function (src) {
    if (src) { pic.src = src; pic.hidden = false; }
  });

  // Same avatar decoration the visitor picked on the socials page (or the seasonal one on a first visit)
  var saved = null;
  try { saved = localStorage.getItem(DECO_KEY); } catch (e) { /* storage blocked */ }
  var decoId = saved === "none" ? null : (saved || SEASON_DECO[new Date().getMonth()] || null);
  var decoSet = false;                                     // true once the socials picker has told us what is active
  if (decoId && /^[a-z0-9-]+$/i.test(decoId)) {
    probe(["/images/decorations/socials-deco-" + decoId], ["webp", "gif"], function (src) {
      if (src && !decoSet) { deco.src = src; deco.hidden = false; }
    });
  }
  // On the socials page the picker announces every change, so the picture follows it live
  window.addEventListener("sx-deco-change", function (e) {
    var d = (e && e.detail) || {};
    decoSet = true;
    if (d.src) { deco.src = d.src; deco.hidden = false; } else deco.hidden = true;
  });

  /* ---------- Back-to-top button: it takes the corner while it is showing; the companion steps aside, then slides back ---------- */
  var toTop = null;
  function syncTotop() {
    if (!toTop) {
      toTop = document.querySelector(".to-top");           // built by script.js, so it may appear a moment after this script runs
      if (toTop && window.MutationObserver) new MutationObserver(syncTotop).observe(toTop, { attributes: true, attributeFilter: ["class"] });
    }
    pal.classList.toggle("has-totop", !!toTop && toTop.classList.contains("is-visible"));
  }
  syncTotop();
  window.addEventListener("scroll", syncTotop, { passive: true });
  window.addEventListener("resize", syncTotop);
  window.addEventListener("load", syncTotop);

  /* ---------- State ---------- */
  var muted = false, menuOpen = false, heroSeen = true;
  var current = "", lastAct = Date.now(), afkTimer = null, step = {}, quipAt = -1, shownY = 0;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { /* storage blocked */ }

  function refreshMenu() {
    if (muteBtn) muteBtn.textContent = muted ? "Unmute comments" : "Mute comments";
    if (quipBtn) quipBtn.hidden = muted;
  }
  refreshMenu();

  /* ---------- The bubble: shows a line, hides itself after AFK_MS without activity ---------- */
  function hideBubble() { bubble.hidden = true; }
  function showBubble(t, force) {
    if (!t) return;
    if (!force && (muted || heroSeen || menuOpen)) return;
    text.textContent = t;                                   // the text is in place before the bubble is shown
    bubble.hidden = false;
    if (!reduced) {                                         // restart the little pop
      bubble.classList.remove("is-pop");
      void bubble.offsetWidth;
      bubble.classList.add("is-pop");
    }
    lastAct = Date.now();
    shownY = window.pageYOffset || 0;                       // where on the page he last spoke (for long sections)
    armAfk();
  }
  function armAfk() {
    if (afkTimer) return;
    afkTimer = setTimeout(checkAfk, AFK_MS);
  }
  function checkAfk() {
    afkTimer = null;
    if (bubble.hidden) return;
    var left = AFK_MS - (Date.now() - lastAct);
    if (left > 0) afkTimer = setTimeout(checkAfk, left);    // they were active meanwhile: wait the rest
    else hideBubble();
  }
  function active() { return Date.now() - lastAct < AFK_MS; }
  function noteActivity() { lastAct = Date.now(); }
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "touchmove", "scroll"].forEach(function (ev) {
    window.addEventListener(ev, noteActivity, { passive: true, capture: true });
  });

  /* ---------- The menu: opens on hover (mouse) or tap/keyboard; a click keeps it open ---------- */
  var fine = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : { matches: false };
  var pinned = false, leaveTimer = null;
  function pop(el) {
    if (reduced) return;
    el.classList.remove("is-pop");
    void el.offsetWidth;
    el.classList.add("is-pop");
  }
  function openMenu(focusFirst) {
    clearTimeout(leaveTimer);
    if (!menuOpen) {
      menuOpen = true;
      hideBubble();
      refreshMenu();
      menu.hidden = false;
      pop(menu);
      btn.setAttribute("aria-expanded", "true");
    }
    if (focusFirst) {
      var first = items.filter(function (el) { return !el.hidden; })[0];
      if (first) first.focus();
    }
  }
  function closeMenu(refocus) {
    clearTimeout(leaveTimer);
    menuOpen = false;
    pinned = false;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (refocus) btn.focus();
  }
  btn.addEventListener("click", function (e) {
    var byKeyboard = e.detail === 0;
    if (menuOpen && pinned) closeMenu(byKeyboard);          // open and kept: this click closes it
    else if (menuOpen) pinned = true;                       // opened by hovering: this click keeps it open
    else { openMenu(byKeyboard); pinned = true; }
  });
  bubble.addEventListener("click", function () { openMenu(false); pinned = true; });
  btn.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); openMenu(true); pinned = true; }
  });
  // Hover: the picture opens it (the comment bubble does not); leaving the picture or the menu closes it after a short grace period
  function hoverIn() { if (!fine.matches) return; clearTimeout(leaveTimer); if (!menuOpen) openMenu(false); }
  function hoverOut() {
    if (!fine.matches || !menuOpen || pinned) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(function () { if (!pinned) closeMenu(false); }, 300);
  }
  [btn, menu].forEach(function (el) {
    el.addEventListener("mouseenter", hoverIn);
    el.addEventListener("mouseleave", hoverOut);
  });
  menu.addEventListener("keydown", function (e) {
    var list = items.filter(function (el) { return !el.hidden; }), i = list.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); closeMenu(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); list[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); list[list.length - 1].focus(); }
  });
  document.addEventListener("click", function (e) { if (menuOpen && !pal.contains(e.target)) closeMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) closeMenu(true); });
  pal.addEventListener("focusout", function (e) { if (menuOpen && e.relatedTarget && !pal.contains(e.relatedTarget)) closeMenu(false); });

  menu.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[role='menuitem']") : null;
    if (!el) return;
    var act = el.dataset.act, byKeyboard = e.detail === 0;
    if (!act) { closeMenu(false); return; }                  // a link: let it open
    if (act === "mute") {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (err) { /* storage blocked */ }
      refreshMenu();
      closeMenu(byKeyboard);
      if (muted) hideBubble(); else showBubble("Okay, I'm back!", true);
    } else if (act === "quip") {
      closeMenu(byKeyboard);
      quipAt = (quipAt + 1 + Math.floor(Math.random() * (QUIPS.length - 1))) % QUIPS.length;   // never the same one twice in a row
      showBubble(QUIPS[quipAt], true);
    }
  });

  // Safety net: if the browser ever drops the painted text, writing it again forces a repaint
  document.addEventListener("visibilitychange", function () {
    if (document.hidden || bubble.hidden) return;
    var t = text.textContent;
    text.textContent = "";
    text.textContent = t;
  });

  /* ---------- Follow the page ---------- */
  if (!("IntersectionObserver" in window)) return;

  var map = [];          // the sections that have a comment: { el, line }
  var inBand = [];       // the ones crossing the middle of the screen right now (latest last)

  // A section's line. A list of lines gives the next one each time you ask for "next".
  function lineFor(i, next) {
    var l = map[i].line;
    if (!Array.isArray(l)) return l;
    if (step[i] === undefined) step[i] = 0;
    else if (next) step[i] = (step[i] + 1) % l.length;
    return l[step[i]];
  }
  function speak(i, next) {
    var l = lineFor(i, next), same = l === current;
    current = l;
    // Show it when it is new (or the bubble was hidden), and only if the visitor is actually here
    if (active() && (!same || bubble.hidden)) showBubble(l, false);
  }
  // Whatever he could not say earlier (the top of the page was still on screen), he says now
  function catchUp() {
    if (!inBand.length || heroSeen || muted || menuOpen || !active()) return;
    var l = lineFor(inBand[inBand.length - 1], false);
    current = l;
    if (bubble.hidden || text.textContent !== l) showBubble(l, false);
  }

  // The bubble stays hidden while the top of the page (hero, or the profile picture on the socials page) is on screen.
  // For a hero that counts only while most of the screen is still hero, so a short hero never blocks the first section.
  var hero = document.getElementById("sx-pfpwrap") || document.querySelector("main > section, main > div");
  if (hero) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        heroSeen = en.isIntersecting;
        if (heroSeen) hideBubble(); else catchUp();
      });
    }, hero.id === "sx-pfpwrap" ? {} : { rootMargin: "-55% 0px 0px 0px" }).observe(hero);
  } else heroSeen = false;

  // One comment per section: whichever one crosses the middle of the screen
  var io = new IntersectionObserver(function (es) {
    var entered = -1;
    es.forEach(function (en) {
      var i = -1, at;
      for (var k = 0; k < map.length; k++) if (map[k].el === en.target) { i = k; break; }
      if (i < 0) return;
      at = inBand.indexOf(i);
      if (en.isIntersecting) { if (at > -1) inBand.splice(at, 1); inBand.push(i); entered = i; }   // the one entered last counts as current
      else if (at > -1) inBand.splice(at, 1);
    });
    if (entered > -1) speak(entered, true);
  }, { rootMargin: "-45% 0px -50% 0px" });
  lines.forEach(function (pair) {
    var el = document.querySelector(pair[0]);
    if (!el) return;
    map.push({ el: el, line: pair[1] });
    io.observe(el);
  });

  // Long sections with several lines (gallery, reviews): keep talking as you scroll through them
  window.addEventListener("scroll", function () {
    if (!inBand.length || heroSeen || muted || menuOpen || !active()) return;
    var i = inBand[inBand.length - 1];
    if (!Array.isArray(map[i].line)) return;
    if (Math.abs((window.pageYOffset || 0) - shownY) >= ROTATE_SCREENS * (window.innerHeight || 800)) speak(i, true);
  }, { passive: true });
})();