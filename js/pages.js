// BEEONIA - behaviour used only on the sub-pages
// (the shared header, basket and product pop-up live in script_*.js).
document.addEventListener("DOMContentLoaded", function () {
  var lang = document.documentElement.lang === "en" ? "en" : "tr";

  // Mark the current page in the menus.
  var here = window.location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav-link").forEach(function (a) {
    var path = new URL(a.href, window.location.origin).pathname;
    if (path === here && path !== "/" && path !== "/en/") {
      a.classList.add("is-current");
      a.setAttribute("aria-current", "page");
    }
  });

  // Translated placeholders.
  document.querySelectorAll("[data-placeholder-" + lang + "]").forEach(function (el) {
    el.placeholder = el.getAttribute("data-placeholder-" + lang);
  });

  // ---------- Galeri: lightbox ----------
  (function () {
    var box = document.getElementById("lightbox");
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    if (!box || !items.length) return;
    var img = document.getElementById("lightboxImg");
    var cap = document.getElementById("lightboxCaption");
    var index = 0;
    var opener = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var src = items[index].querySelector("img");
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.innerHTML = items[index].querySelector("figcaption").innerHTML;
    }

    function open(i, from) {
      opener = from;
      show(i);
      box.classList.add("active");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      document.getElementById("lightboxClose").focus();
    }

    function close() {
      box.classList.remove("active");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (opener) opener.focus();
    }

    items.forEach(function (it, i) {
      var btn = it.querySelector(".gallery-open");
      btn.addEventListener("click", function () { open(i, btn); });
    });
    document.getElementById("lightboxClose").addEventListener("click", close);
    document.getElementById("lightboxPrev").addEventListener("click", function () { show(index - 1); });
    document.getElementById("lightboxNext").addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("active")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    // Swipe left / right on touch screens.
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });
  })();

  // ---------- İletişim: message that opens in WhatsApp ----------
  (function () {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var name = document.getElementById("contactName");
    var msg = document.getElementById("contactMessage");
    var send = document.getElementById("contactSend");
    var hint = document.getElementById("contactHint");
    var T = lang === "tr"
      ? { hello: "Merhaba BEEONIA,", from: "Gönderen: ", need: "Göndermek için mesajınızı yazın.", ready: "Buton WhatsApp'ı mesajınız hazır şekilde açar." }
      : { hello: "Hello BEEONIA,", from: "From: ", need: "Write your message to send it.", ready: "The button opens WhatsApp with your message ready." };

    function update() {
      var text = msg.value.trim();
      var ok = text.length > 0;
      var body = T.hello + "\n\n" + text + (name.value.trim() ? "\n\n" + T.from + name.value.trim() : "");
      send.href = "https://wa.me/905444601822?text=" + encodeURIComponent(body);
      send.setAttribute("aria-disabled", String(!ok));
      hint.textContent = ok ? T.ready : T.need;
      hint.classList.toggle("ready", ok);
    }

    name.addEventListener("input", update);
    msg.addEventListener("input", update);
    send.addEventListener("click", function (e) {
      if (send.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        msg.focus();
      }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    update();
  })();
});
