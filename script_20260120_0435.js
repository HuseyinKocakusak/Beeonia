// ========================================
// BEEONIA - JavaScript
// Interactive Features & Responsive Behavior
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // ========================================
  // Language Switching
  // ========================================
  // The Turkish site lives at "/" and the English one at "/en/". The page
  // language comes from the URL; the visitor's explicit choice is stored so
  // later visits to "/" open the English page (see the inline script in the
  // <head> of index.html).
  const LANG_STORAGE_KEY = "beeonia-lang";
  const pageLang = /^\/en(\/|$)/.test(window.location.pathname) ? "en" : "tr";
  let currentLang = pageLang;
  const langBtns = document.querySelectorAll(".lang-btn");

  // Replace an element's text with the translation while keeping child
  // elements such as icons (<svg>), <strong> or <em> in place. Each child's
  // text is located inside the translated string; if that fails the element
  // falls back to plain text.
  function setLocalizedText(el, text, lang) {
    const kids = Array.from(el.children);
    if (!kids.length) {
      el.textContent = text;
      return;
    }
    const nodes = [];
    let rest = text;
    for (const kid of kids) {
      if (kid.tagName.toLowerCase() === "svg") {
        nodes.push(kid);
        continue;
      }
      const kidText = kid.getAttribute(`data-${lang}`) || kid.textContent;
      const idx = rest.indexOf(kidText);
      if (!kidText || idx < 0) {
        el.textContent = text;
        return;
      }
      if (idx > 0) nodes.push(document.createTextNode(rest.slice(0, idx)));
      if (kid.hasAttribute(`data-${lang}`)) kid.textContent = kidText;
      nodes.push(kid);
      rest = rest.slice(idx + kidText.length);
    }
    if (rest) nodes.push(document.createTextNode(rest));
    el.replaceChildren(...nodes);
  }

  function updateLanguage(lang) {
    currentLang = lang;

    // Update all elements with data-tr and data-en attributes
    document.querySelectorAll("[data-tr][data-en]").forEach((el) => {
      setLocalizedText(el, el.getAttribute(`data-${lang}`), lang);
    });

    // Update active button
    langBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang === "tr" ? "tr" : "en";

    // Dispatch language change event for reviews section
    document.dispatchEvent(
      new CustomEvent("languageChanged", { detail: { lang: lang } }),
    );
  }

  function rememberLanguage(lang) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {
      /* storage blocked: the choice simply is not remembered */
    }
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      rememberLanguage(lang);
      if (lang === pageLang) return;
      // Switch to the other language's address, keeping the section anchor.
      // Every page names its counterpart in a <link rel="alternate">.
      const alt = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      const target = alt
        ? new URL(alt.href).pathname
        : lang === "en" ? "/en/" : "/";
      window.location.href = target + window.location.hash;
    });
  });

  // ========================================
  // Mobile Menu
  // ========================================
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileNav = document.getElementById("mobileNav");

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active");
    });

    // Close menu when clicking a link
    mobileNav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("active");
        mobileMenuBtn.classList.remove("active");
      });
    });
  }

  // ========================================
  // Carousel Functionality
  // ========================================
  class Carousel {
    constructor(trackId, prevBtnId, nextBtnId, options = {}) {
      this.track = document.getElementById(trackId);
      this.prevBtn = document.getElementById(prevBtnId);
      this.nextBtn = document.getElementById(nextBtnId);

      if (!this.track) return;

      this.slides = Array.from(this.track.children).filter(
        (el) => el.style.display !== "none",
      );
      this.currentIndex = 0;
      this.slidesToShow = options.slidesToShow || 1;
      this.gap = options.gap || 24;
      this.autoplay = options.autoplay || false;
      this.autoplayInterval = options.autoplayInterval || 5000;
      this.autoplayTimer = null;

      this.init();
    }

    init() {
      this.updateSlidesToShow();
      this.setupButtons();
      this.setupTouchEvents();
      this.setupResizeHandler();

      if (this.autoplay) {
        this.startAutoplay();
      }
    }

    updateSlidesToShow() {
      const width = window.innerWidth;
      if (width <= 480) {
        this.currentSlidesToShow = 1;
      } else if (width <= 768) {
        this.currentSlidesToShow = Math.min(this.slidesToShow, 1);
      } else if (width <= 1024) {
        this.currentSlidesToShow = Math.min(this.slidesToShow, 2);
      } else {
        this.currentSlidesToShow = this.slidesToShow;
      }
    }

    setupButtons() {
      if (this.prevBtn) {
        this.prevBtn.addEventListener("click", () => this.prev());
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener("click", () => this.next());
      }
    }

    setupTouchEvents() {
      // A gesture only counts as a swipe when it moves clearly sideways
      // (more than SWIPE_MIN px, and more horizontal than vertical). Taps
      // and vertical page scrolls never move the carousel, and a click
      // right after a real swipe is swallowed so it does not open a card.
      const SWIPE_MIN = 50;
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastY = 0;
      let isDragging = false;
      let suppressClick = false;

      const finish = () => {
        const dx = startX - lastX;
        const dy = startY - lastY;
        if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.2) {
          if (dx > 0) this.next();
          else this.prev();
          suppressClick = true;
          setTimeout(() => {
            suppressClick = false;
          }, 350);
        }
      };

      this.track.addEventListener(
        "click",
        (e) => {
          if (suppressClick) {
            e.stopPropagation();
            e.preventDefault();
            suppressClick = false;
          }
        },
        true,
      );

      this.track.addEventListener(
        "touchstart",
        (e) => {
          startX = lastX = e.touches[0].clientX;
          startY = lastY = e.touches[0].clientY;
          isDragging = true;
          if (this.autoplay) this.stopAutoplay();
        },
        { passive: true },
      );

      this.track.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging) return;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        },
        { passive: true },
      );

      this.track.addEventListener("touchend", () => {
        if (!isDragging) return;
        isDragging = false;
        finish();
        if (this.autoplay) this.startAutoplay();
      });

      this.track.addEventListener("touchcancel", () => {
        isDragging = false;
      });

      // Mouse drag support for desktop
      let isMouseDragging = false;

      this.track.addEventListener("mousedown", (e) => {
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        isMouseDragging = true;
        this.track.style.cursor = "grabbing";
      });

      document.addEventListener("mousemove", (e) => {
        if (!isMouseDragging) return;
        lastX = e.clientX;
        lastY = e.clientY;
      });

      document.addEventListener("mouseup", () => {
        if (!isMouseDragging) return;
        isMouseDragging = false;
        this.track.style.cursor = "grab";
        finish();
      });

      this.track.style.cursor = "grab";
    }

    setupResizeHandler() {
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.updateSlidesToShow();
          this.goTo(this.currentIndex);
        }, 100);
      });
    }

    getMaxIndex() {
      return Math.max(0, this.slides.length - this.currentSlidesToShow);
    }

    next() {
      const maxIndex = this.getMaxIndex();
      this.currentIndex =
        this.currentIndex >= maxIndex ? 0 : this.currentIndex + 1;
      this.updatePosition();
    }

    prev() {
      const maxIndex = this.getMaxIndex();
      this.currentIndex =
        this.currentIndex <= 0 ? maxIndex : this.currentIndex - 1;
      this.updatePosition();
    }

    goTo(index) {
      const maxIndex = this.getMaxIndex();
      this.currentIndex = Math.max(0, Math.min(index, maxIndex));
      this.updatePosition();
    }

    updatePosition() {
      const slideWidth = this.slides[0].offsetWidth + this.gap;
      const offset = -this.currentIndex * slideWidth;
      this.track.style.transform = `translateX(${offset}px)`;
    }

    startAutoplay() {
      this.stopAutoplay();
      this.autoplayTimer = setInterval(
        () => this.next(),
        this.autoplayInterval,
      );
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }
  }

  // ========================================
  // Clothesline Gallery (Polaroid Scroll)
  // ========================================
  (function initClotheslineGallery() {
    const viewport = document.getElementById("clotheslineViewport");
    const track = document.getElementById("clotheslineTrack");
    const leftBtn = document.getElementById("clotheslineLeft");
    const rightBtn = document.getElementById("clotheslineRight");

    if (!viewport || !track) return;

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    function getMaxTranslate() {
      const trackWidth = track.scrollWidth;
      const viewportWidth = viewport.offsetWidth;
      return Math.min(0, -(trackWidth - viewportWidth));
    }

    function clampTranslate(val) {
      return Math.max(getMaxTranslate(), Math.min(0, val));
    }

    function setTranslate(val) {
      currentTranslate = clampTranslate(val);
      track.style.transform = "translateX(" + currentTranslate + "px)";
      updateArrowVisibility();
    }

    function updateArrowVisibility() {
      if (leftBtn) {
        leftBtn.style.opacity = currentTranslate >= 0 ? "0.3" : "1";
        leftBtn.style.pointerEvents = currentTranslate >= 0 ? "none" : "auto";
      }
      if (rightBtn) {
        var maxT = getMaxTranslate();
        rightBtn.style.opacity = currentTranslate <= maxT + 2 ? "0.3" : "1";
        rightBtn.style.pointerEvents = currentTranslate <= maxT + 2 ? "none" : "auto";
      }
    }

    // Arrow click scroll
    var scrollStep = 300;

    if (leftBtn) {
      leftBtn.addEventListener("click", function () {
        stopGlide();
        track.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        setTranslate(currentTranslate + scrollStep);
        prevTranslate = currentTranslate;
        setTimeout(function () { track.style.transition = "none"; }, 400);
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener("click", function () {
        stopGlide();
        track.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        setTranslate(currentTranslate - scrollStep);
        prevTranslate = currentTranslate;
        setTimeout(function () { track.style.transition = "none"; }, 400);
      });
    }

    // Drag with the finger or mouse: the strip follows the pointer 1:1,
    // then glides on with a short, gradually slowing momentum. A short swipe
    // moves it a little, a fast flick moves it further.
    var glideId = null;
    var samples = [];
    var touchAxis = null; // null until decided, then "x" or "y"
    var touchStartY = 0;

    function stopGlide() {
      if (glideId) cancelAnimationFrame(glideId);
      glideId = null;
    }

    function recordSample(x) {
      var now = performance.now();
      samples.push({ x: x, t: now });
      while (samples.length > 2 && now - samples[0].t > 100) samples.shift();
    }

    function releaseVelocity() {
      if (samples.length < 2) return 0;
      var a = samples[0], b = samples[samples.length - 1];
      if (performance.now() - b.t > 80) return 0; // finger rested before lifting
      var dt = b.t - a.t;
      if (dt <= 0) return 0;
      var v = (b.x - a.x) / dt; // px per ms
      return Math.max(-2.5, Math.min(2.5, v));
    }

    function glide(v) {
      stopGlide();
      var last = performance.now();
      function step(now) {
        var dt = Math.min(32, now - last);
        last = now;
        v *= Math.pow(0.95, dt / 16);
        var before = currentTranslate;
        setTranslate(currentTranslate + v * dt);
        prevTranslate = currentTranslate;
        if (Math.abs(v) < 0.02 || currentTranslate === before) {
          glideId = null;
          return;
        }
        glideId = requestAnimationFrame(step);
      }
      if (Math.abs(v) > 0.05) glideId = requestAnimationFrame(step);
    }

    function beginDrag(x) {
      stopGlide();
      isDragging = true;
      startX = x;
      prevTranslate = currentTranslate;
      samples = [];
      recordSample(x);
      track.style.transition = "none";
    }

    function moveDrag(x) {
      recordSample(x);
      setTranslate(prevTranslate + (x - startX));
    }

    function endDrag() {
      isDragging = false;
      prevTranslate = currentTranslate;
      glide(releaseVelocity());
    }

    // Touch: decide the direction from the first few pixels. Vertical
    // gestures are left to the page so scrolling down never drags the strip.
    viewport.addEventListener("touchstart", function (e) {
      touchAxis = null;
      touchStartY = e.touches[0].clientY;
      beginDrag(e.touches[0].clientX);
    }, { passive: true });

    viewport.addEventListener("touchmove", function (e) {
      if (!isDragging) return;
      var x = e.touches[0].clientX;
      var y = e.touches[0].clientY;
      if (!touchAxis) {
        var dx = Math.abs(x - startX), dy = Math.abs(y - touchStartY);
        if (dx < 6 && dy < 6) return;
        touchAxis = dx > dy ? "x" : "y";
      }
      if (touchAxis === "y") return;
      if (e.cancelable) e.preventDefault();
      moveDrag(x);
    }, { passive: false });

    viewport.addEventListener("touchend", function () {
      if (!isDragging) return;
      if (touchAxis === "x") endDrag();
      else isDragging = false;
    });

    viewport.addEventListener("touchcancel", function () {
      isDragging = false;
    });

    // Mouse drag
    viewport.addEventListener("mousedown", function (e) {
      beginDrag(e.clientX);
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      moveDrag(e.clientX);
    });

    document.addEventListener("mouseup", function () {
      if (!isDragging) return;
      endDrag();
    });

    // Mouse wheel horizontal scroll
    viewport.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
        stopGlide();
        var delta = e.deltaX || e.deltaY;
        track.style.transition = "transform 0.15s ease-out";
        setTranslate(currentTranslate - delta);
        prevTranslate = currentTranslate;
        setTimeout(function () { track.style.transition = "none"; }, 150);
      }
    }, { passive: false });

    // Initialize
    updateArrowVisibility();

    // Recalculate on resize
    window.addEventListener("resize", function () {
      setTranslate(clampTranslate(currentTranslate));
    });
  })();

  // Initialize carousels
  const productsCarousel = new Carousel(
    "productsTrack",
    "productsPrev",
    "productsNext",
    {
      slidesToShow: 3,
      gap: 24,
    },
  );

  // ========================================
  // Product Modal
  // ========================================
  const modal = document.getElementById("productModal");
  const modalClose = document.getElementById("modalClose");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalOrigin = document.getElementById("modalOrigin");
  const modalDescription = document.getElementById("modalDescription");
  const modalDetails = document.getElementById("modalDetails");
  const modalHarvest = document.getElementById("modalHarvest");
  const modalAnalyses = document.getElementById("modalAnalyses");
  const modalAnalysesLinks = document.getElementById("modalAnalysesLinks");
  const modalBackdrop = document.querySelector(".modal-backdrop");
  const modalImgPrev = document.getElementById("modalImgPrev");
  const modalImgNext = document.getElementById("modalImgNext");
  const modalImgCounter = document.getElementById("modalImgCounter");
  let currentModalCard = null;
  let _modalImages = [];
  let _modalImgIndex = 0;

  function _showModalImage(index) {
    _modalImgIndex = ((index % _modalImages.length) + _modalImages.length) % _modalImages.length;
    const entry = _modalImages[_modalImgIndex];
    modalImage.src = typeof entry === "string" ? entry : (entry.src || entry);
    modalImage.alt = (typeof entry === "object" && entry.alt) ? entry.alt : "Ürün";
    if (_modalImages.length > 1) {
      modalImgPrev.style.display = "";
      modalImgNext.style.display = "";
      modalImgCounter.textContent = (_modalImgIndex + 1) + " / " + _modalImages.length;
      modalImgCounter.style.display = "";
    } else {
      modalImgPrev.style.display = "none";
      modalImgNext.style.display = "none";
      modalImgCounter.style.display = "none";
    }
  }

  if (modalImgPrev) {
    modalImgPrev.addEventListener("click", function (e) {
      e.stopPropagation();
      _showModalImage(_modalImgIndex - 1);
    });
  }
  if (modalImgNext) {
    modalImgNext.addEventListener("click", function (e) {
      e.stopPropagation();
      _showModalImage(_modalImgIndex + 1);
    });
  }

  // Size and quantity chosen in the open modal for "Sepete ekle".
  let _modalVariants = [];
  let _selectedVariant = 0;
  let _modalQty = 1;

  function getCardVariants(card) {
    let variants = [];
    if (card.dataset.variants) {
      try {
        variants = JSON.parse(card.dataset.variants);
      } catch (e) {
        variants = [];
      }
    }
    if (!variants.length) {
      variants = [{ weight: card.dataset.weight, price: card.dataset.price }];
    }
    return variants.filter((v) => v.weight || v.price);
  }

  function renderModalVariants() {
    const selectable = _modalVariants.length > 1;
    modalDetails.innerHTML = _modalVariants
      .map((v, i) => {
        const weight = v.weight
          ? `<span class="modal-weight">${v.weight}</span>`
          : "";
        const price = v.price
          ? `<span class="modal-price">${v.price}</span>`
          : "";
        if (!selectable) {
          return `<div class="modal-variant">${weight}${price}</div>`;
        }
        const on = i === _selectedVariant;
        return `<button type="button" class="modal-variant selectable${on ? " selected" : ""}" data-index="${i}" aria-pressed="${on}"><span class="variant-radio" aria-hidden="true"></span>${weight}${price}</button>`;
      })
      .join("");
    modalDetails.querySelectorAll(".modal-variant.selectable").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        _selectedVariant = parseInt(btn.dataset.index, 10) || 0;
        renderModalVariants();
      });
    });
  }

  function openModal(card) {
    const reopening = currentModalCard === card && modal.classList.contains("active");
    currentModalCard = card;
    if (!reopening) {
      _selectedVariant = 0;
      _modalQty = 1;
      hideOrderFeedback();
    }
    const img = card.querySelector(".product-image img");

    // Build image list from data-images (JSON array) or fall back to card thumbnail
    _modalImages = [];
    _modalImgIndex = 0;
    if (card.dataset.images) {
      try { _modalImages = JSON.parse(card.dataset.images); } catch (e) {}
    }
    if (!_modalImages.length) {
      _modalImages = [{ src: img.src, alt: img.alt || "Ürün" }];
    }
    _showModalImage(0);
    // Title may hold both languages as "TR | EN"; show the active one.
    const titleParts = (card.dataset.title || "").split(" | ");
    modalTitle.textContent =
      currentLang === "en" && titleParts.length > 1
        ? titleParts[titleParts.length - 1]
        : titleParts[0];
    // Optional series label (e.g. "Koleksiyon Serisi") for limited products.
    const modalSeries = document.getElementById("modalSeries");
    if (modalSeries) {
      const series =
        currentLang === "tr" ? card.dataset.seriesTr : card.dataset.seriesEn;
      modalSeries.textContent = series || "";
      modalSeries.hidden = !series;
    }
    modalOrigin.textContent =
      currentLang === "tr"
        ? card.dataset.originTr || card.dataset.origin
        : card.dataset.originEn || card.dataset.origin;
    modalDescription.textContent =
      currentLang === "tr"
        ? card.dataset.descriptionTr
        : card.dataset.descriptionEn;
    // Build weight/price rows. Products with multiple grammages use
    // data-variants (JSON array of {weight, price}); others fall back to a
    // single data-weight/data-price. With several sizes the rows double as
    // the size picker for the basket.
    _modalVariants = getCardVariants(card);
    if (_selectedVariant >= _modalVariants.length) _selectedVariant = 0;
    renderModalVariants();
    updateModalQty();

    modalHarvest.textContent =
      currentLang === "tr" ? card.dataset.harvestTr : card.dataset.harvestEn;

    // Analyses section — shown only for cards that declare data-analyses
    if (modalAnalyses && modalAnalysesLinks) {
      let analyses = [];
      if (card.dataset.analyses) {
        try { analyses = JSON.parse(card.dataset.analyses); } catch (e) {}
      }
      const analysesNote =
        currentLang === "en"
          ? card.dataset.analysesNoteEn || card.dataset.analysesNoteTr
          : card.dataset.analysesNoteTr || card.dataset.analysesNoteEn;
      if (analyses.length || analysesNote) {
        const titleEl = modalAnalyses.querySelector(".modal-analyses-title");
        if (titleEl) {
          titleEl.textContent = currentLang === "en" ? "Analyses" : "Analizler";
        }
        const noteHtml = analysesNote
          ? `<p class="modal-analyses-note">${analysesNote}</p>`
          : "";
        modalAnalysesLinks.innerHTML = noteHtml + analyses.map((a) => {
          const label = currentLang === "en" ? (a.labelEn || a.labelTr) : (a.labelTr || a.labelEn);
          return `<a class="modal-analysis-link" href="${a.file}" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${label}</span>
          </a>`;
        }).join("");
        modalAnalyses.style.display = "";
      } else {
        modalAnalyses.style.display = "none";
      }
    }

    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.classList.remove("active");
    if (!document.getElementById("cartDrawer").classList.contains("active")) {
      document.body.classList.remove("modal-open");
    }
  }

  // ----- Quantity + "Sepete ekle" inside the modal -----
  const modalQtyEl = document.getElementById("modalQty");
  const modalOrderFeedback = document.getElementById("modalOrderFeedback");
  const modalOrderFeedbackText = document.getElementById("modalOrderFeedbackText");

  function updateModalQty() {
    if (modalQtyEl) modalQtyEl.textContent = String(_modalQty);
  }

  function hideOrderFeedback() {
    if (modalOrderFeedback) modalOrderFeedback.hidden = true;
  }

  document.getElementById("modalQtyMinus").addEventListener("click", (e) => {
    e.stopPropagation();
    _modalQty = Math.max(1, _modalQty - 1);
    updateModalQty();
  });
  document.getElementById("modalQtyPlus").addEventListener("click", (e) => {
    e.stopPropagation();
    _modalQty = Math.min(99, _modalQty + 1);
    updateModalQty();
  });
  // Last item added from the pop-up, so the confirmation panel can be
  // redrawn in the other language if the visitor switches.
  let _lastAdded = null;
  const modalAddBtn = document.getElementById("modalAddToCart");
  let _addedTimer = null;

  function renderOrderFeedback() {
    if (!_lastAdded || !modalOrderFeedback) return;
    const cart = window.beeoniaCart;
    const name = cart.productName(_lastAdded.card);
    modalOrderFeedbackText.textContent =
      `${name} · ${_lastAdded.weight} × ${_lastAdded.qty}`;
    const thumb = document.getElementById("cartToastThumb");
    if (thumb) {
      thumb.src = _lastAdded.img || "";
      thumb.alt = name;
    }
    const sum = cart.summary();
    const summaryEl = document.getElementById("cartToastSummary");
    if (summaryEl) {
      const countText =
        currentLang === "tr"
          ? `Sepetinizde <strong>${sum.count}</strong> ürün`
          : `<strong>${sum.count}</strong> item${sum.count === 1 ? "" : "s"} in your basket`;
      const totalText = sum.total
        ? (currentLang === "tr" ? "Ara toplam " : "Subtotal ") +
          `<strong>${cart.formatPrice(sum.total)}</strong>`
        : "";
      summaryEl.innerHTML = `<span>${countText}</span><span>${totalText}</span>`;
    }
  }

  modalAddBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentModalCard || !_modalVariants.length) return;
    const variant = _modalVariants[_selectedVariant] || _modalVariants[0];
    window.beeoniaCart.add(currentModalCard, variant, _modalQty);
    _lastAdded = {
      card: currentModalCard,
      weight: variant.weight,
      qty: _modalQty,
      img: modalImage.getAttribute("src"),
    };
    renderOrderFeedback();
    // Re-run the entrance animation even if the panel is already showing.
    modalOrderFeedback.hidden = true;
    void modalOrderFeedback.offsetWidth;
    modalOrderFeedback.hidden = false;
    modalOrderFeedback.scrollIntoView({ block: "nearest", behavior: "smooth" });

    // Briefly turn the button itself into a confirmation.
    clearTimeout(_addedTimer);
    modalAddBtn.classList.add("is-added");
    modalAddBtn.textContent = currentLang === "tr" ? "✓ Eklendi" : "✓ Added";
    _addedTimer = setTimeout(() => {
      modalAddBtn.classList.remove("is-added");
      modalAddBtn.textContent = modalAddBtn.getAttribute(`data-${currentLang}`);
    }, 1400);
  });

  document.getElementById("modalContinue").addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
  });
  document.getElementById("modalGoToCart").addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
    window.beeoniaCart.open();
  });

  // Product card click handlers
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card));
  });

  // Re-render the open modal in the newly selected language.
  document.addEventListener("languageChanged", () => {
    if (currentModalCard && modal.classList.contains("active")) {
      openModal(currentModalCard);
    }
  });

  // Close modal handlers
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeModal);
  }

  // Close on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });

  // ========================================
  // Basket + WhatsApp Order
  // ========================================
  // The basket lives in localStorage so it survives page reloads and the
  // TR/EN page switch. Nothing is sent anywhere: the final step only opens
  // WhatsApp with a ready-made message the customer still has to send.
  (function initCart() {
    const WHATSAPP_NUMBER = "905444601822";
    const STORAGE_KEY = "beeonia-cart-v1";

    const drawer = document.getElementById("cartDrawer");
    const cartBtn = document.getElementById("cartBtn");
    const cartCount = document.getElementById("cartCount");
    const itemsEl = document.getElementById("cartItems");
    const emptyEl = document.getElementById("cartEmpty");
    const subtotalRow = document.getElementById("cartSubtotalRow");
    const subtotalEl = document.getElementById("cartSubtotal");
    const previewEl = document.getElementById("cartPreview");
    const hintEl = document.getElementById("cartHint");
    const waBtn = document.getElementById("cartWhatsApp");
    const fields = {
      name: document.getElementById("cartName"),
      phone: document.getElementById("cartPhone"),
      address: document.getElementById("cartAddress"),
      note: document.getElementById("cartNote"),
    };
    if (!drawer || !cartBtn) return;

    const T = {
      tr: {
        greeting: "Merhaba BEEONIA, sipariş vermek istiyorum.",
        order: "Sipariş:",
        subtotal: "Ara toplam",
        name: "Ad Soyad",
        phone: "Telefon",
        address: "Adres",
        note: "Not",
        remove: "Kaldır",
        decrease: "Azalt",
        increase: "Artır",
        basket: "Sepet",
        close: "Kapat",
        placeholders: {
          name: "Adınız ve soyadınız",
          phone: "05xx xxx xx xx",
          address: "Mahalle, sokak, no, ilçe / il",
          note: "Teslimat zamanı veya petek bal gramajı gibi notlar",
        },
        missing: "WhatsApp'a göndermek için doldurun: ",
        emptyHint: "Sepetinize en az bir ürün ekleyin.",
        ready: "Buton WhatsApp'ı mesajınız hazır şekilde açar; göndermek için WhatsApp'ta Gönder'e basmanız yeterli.",
        phoneInvalid: "geçerli bir telefon numarası",
      },
      en: {
        greeting: "Hello BEEONIA, I would like to place an order.",
        order: "Order:",
        subtotal: "Subtotal",
        name: "Full name",
        phone: "Phone",
        address: "Address",
        note: "Note",
        remove: "Remove",
        decrease: "Decrease",
        increase: "Increase",
        basket: "Basket",
        close: "Close",
        placeholders: {
          name: "Your full name",
          phone: "+90 5xx xxx xx xx",
          address: "Street, number, district, city",
          note: "Delivery time, comb honey weight, etc.",
        },
        missing: "To send via WhatsApp, please fill in: ",
        emptyHint: "Add at least one product to your basket.",
        ready: "The button opens WhatsApp with your message ready; just press Send in WhatsApp.",
        phoneInvalid: "a valid phone number",
      },
    };

    function lang() {
      return document.documentElement.lang === "en" ? "en" : "tr";
    }

    // ----- State -----
    let state = { items: [], customer: { name: "", phone: "", address: "", note: "" } };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && Array.isArray(saved.items)) {
        state.items = saved.items.filter((it) => it && it.id && it.qty > 0);
        state.customer = Object.assign(state.customer, saved.customer || {});
      }
    } catch (e) {
      /* storage unavailable or corrupt: start empty */
    }

    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        /* private mode etc. The basket still works for this visit. */
      }
    }

    // ----- Product helpers -----
    function findCard(id) {
      return document.querySelector(`.product-card[data-product-id="${id}"]`);
    }

    function productName(card, l) {
      const h = card.querySelector(".product-info h3");
      const key = l || lang();
      return (h && h.getAttribute(`data-${key}`)) || card.dataset.title || "";
    }

    // "1100₺" -> 1100, "2.000₺" -> 2000
    function parsePrice(str) {
      const digits = String(str || "").replace(/[^\d]/g, "");
      return digits ? parseInt(digits, 10) : 0;
    }

    function formatPrice(n) {
      return n.toLocaleString("tr-TR") + "₺";
    }

    // Refresh names/prices from the page so a stored basket never shows
    // outdated prices; drop items whose product or size no longer exists.
    function syncWithPage() {
      // Pages without product cards (gallery, about, ...) keep the stored
      // basket as it is.
      if (!document.querySelector(".product-card[data-product-id]")) return;
      state.items = state.items.filter((it) => {
        const card = findCard(it.id);
        if (!card) return false;
        const variants = getCardVariants(card);
        const v = variants.find((x) => x.weight === it.weight);
        if (!v) return false;
        it.price = v.price;
        it.nameTr = productName(card, "tr");
        it.nameEn = productName(card, "en");
        return true;
      });
    }

    function itemName(it) {
      return lang() === "en" ? it.nameEn || it.nameTr : it.nameTr || it.nameEn;
    }

    function add(card, variant, qty) {
      const id = card.dataset.productId;
      if (!id) return;
      const existing = state.items.find((it) => it.id === id && it.weight === variant.weight);
      if (existing) {
        existing.qty = Math.min(99, existing.qty + qty);
      } else {
        state.items.push({
          id: id,
          weight: variant.weight,
          price: variant.price,
          qty: qty,
          nameTr: productName(card, "tr"),
          nameEn: productName(card, "en"),
        });
      }
      save();
      render();
      cartBtn.classList.remove("bump");
      void cartBtn.offsetWidth; // restart the animation
      cartBtn.classList.add("bump");
    }

    // ----- Message -----
    function buildMessage() {
      const t = T[lang()];
      const c = state.customer;
      const lines = [t.greeting, "", t.order];
      let total = 0;
      state.items.forEach((it, i) => {
        const unit = parsePrice(it.price);
        const line = unit * it.qty;
        total += line;
        lines.push(
          `${i + 1}. ${itemName(it)} (${it.weight}) × ${it.qty}` +
            (unit ? ` = ${formatPrice(line)}` : ""),
        );
      });
      if (total) lines.push(`${t.subtotal}: ${formatPrice(total)}`);
      const info = [];
      if (c.name.trim()) info.push(`${t.name}: ${c.name.trim()}`);
      if (c.phone.trim()) info.push(`${t.phone}: ${c.phone.trim()}`);
      if (c.address.trim()) info.push(`${t.address}: ${c.address.trim()}`);
      if (c.note.trim()) info.push(`${t.note}: ${c.note.trim()}`);
      if (info.length) lines.push("", ...info);
      return { text: lines.join("\n"), total: total };
    }

    function missingFields() {
      const t = T[lang()];
      const c = state.customer;
      const missing = [];
      if (!c.name.trim()) missing.push(t.name);
      const digits = c.phone.replace(/\D/g, "");
      if (!c.phone.trim()) missing.push(t.phone);
      else if (digits.length < 10) missing.push(t.phoneInvalid);
      if (!c.address.trim()) missing.push(t.address);
      return missing;
    }

    // Only the parts that change while typing; keeps input focus intact.
    function updateMessage() {
      const t = T[lang()];
      const msg = buildMessage();
      previewEl.textContent = msg.text;
      const missing = missingFields();
      let ready = false;
      if (!state.items.length) {
        hintEl.textContent = t.emptyHint;
      } else if (missing.length) {
        hintEl.textContent = t.missing + missing.join(", ");
      } else {
        hintEl.textContent = t.ready;
        ready = true;
      }
      hintEl.classList.toggle("ready", ready);
      waBtn.setAttribute("aria-disabled", String(!ready));
      waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg.text)}`;
    }

    function render() {
      const t = T[lang()];
      const count = state.items.reduce((n, it) => n + it.qty, 0);
      cartCount.textContent = String(count);
      cartCount.hidden = count === 0;
      cartBtn.classList.toggle("has-items", count > 0);
      cartBtn.setAttribute("aria-label", `${t.basket} (${count})`);

      emptyEl.hidden = state.items.length > 0;
      itemsEl.innerHTML = "";
      state.items.forEach((it, idx) => {
        const li = document.createElement("li");
        li.className = "cart-item";
        const unit = parsePrice(it.price);

        const info = document.createElement("div");
        info.className = "cart-item-info";
        const name = document.createElement("span");
        name.className = "cart-item-name";
        name.textContent = itemName(it);
        const meta = document.createElement("span");
        meta.className = "cart-item-meta";
        meta.textContent = `${it.weight}${it.price ? " · " + it.price : ""}`;
        info.append(name, meta);

        const controls = document.createElement("div");
        controls.className = "cart-item-controls";
        const stepper = document.createElement("div");
        stepper.className = "qty-stepper qty-stepper--small";
        const minus = document.createElement("button");
        minus.type = "button";
        minus.className = "qty-btn";
        minus.textContent = "−";
        minus.setAttribute("aria-label", t.decrease);
        const val = document.createElement("span");
        val.className = "qty-value";
        val.textContent = String(it.qty);
        const plus = document.createElement("button");
        plus.type = "button";
        plus.className = "qty-btn";
        plus.textContent = "+";
        plus.setAttribute("aria-label", t.increase);
        stepper.append(minus, val, plus);

        const lineTotal = document.createElement("span");
        lineTotal.className = "cart-item-total";
        lineTotal.textContent = unit ? formatPrice(unit * it.qty) : "";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "cart-item-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", t.remove);

        minus.addEventListener("click", () => {
          if (it.qty > 1) it.qty -= 1;
          else state.items.splice(idx, 1);
          save();
          render();
        });
        plus.addEventListener("click", () => {
          it.qty = Math.min(99, it.qty + 1);
          save();
          render();
        });
        remove.addEventListener("click", () => {
          state.items.splice(idx, 1);
          save();
          render();
        });

        controls.append(stepper, lineTotal, remove);
        li.append(info, controls);
        itemsEl.appendChild(li);
      });

      const msg = buildMessage();
      subtotalRow.hidden = !msg.total;
      subtotalEl.textContent = msg.total ? formatPrice(msg.total) : "";

      Object.keys(fields).forEach((k) => {
        if (fields[k]) fields[k].placeholder = t.placeholders[k];
      });
      document.getElementById("cartClose").setAttribute("aria-label", t.close);
      updateMessage();
    }

    // ----- Form -----
    Object.keys(fields).forEach((k) => {
      const el = fields[k];
      if (!el) return;
      el.value = state.customer[k] || "";
      el.addEventListener("input", () => {
        state.customer[k] = el.value;
        save();
        updateMessage();
      });
    });

    waBtn.addEventListener("click", (e) => {
      if (waBtn.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        const firstEmpty = ["name", "phone", "address"].find(
          (k) => !state.customer[k].trim() ||
            (k === "phone" && state.customer.phone.replace(/\D/g, "").length < 10),
        );
        if (state.items.length && firstEmpty) fields[firstEmpty].focus();
        hintEl.classList.remove("shake");
        void hintEl.offsetWidth;
        hintEl.classList.add("shake");
        return;
      }
      if (typeof gtag === "function") {
        gtag("event", "whatsapp_order", { value: buildMessage().total, currency: "TRY" });
      }
    });

    document.getElementById("cartClear").addEventListener("click", () => {
      state.items = [];
      save();
      render();
    });

    // ----- Open / close -----
    function open() {
      drawer.classList.add("active");
      drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      render();
      setTimeout(() => document.getElementById("cartClose").focus(), 50);
    }

    function close() {
      drawer.classList.remove("active");
      drawer.setAttribute("aria-hidden", "true");
      if (!document.getElementById("productModal").classList.contains("active")) {
        document.body.classList.remove("modal-open");
      }
      cartBtn.focus();
    }

    cartBtn.addEventListener("click", open);
    document.getElementById("cartClose").addEventListener("click", close);
    document.getElementById("cartBackdrop").addEventListener("click", close);
    document.getElementById("cartBrowse").addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("active")) close();
    });
    document.addEventListener("languageChanged", render);

    function summary() {
      return {
        count: state.items.reduce((n, it) => n + it.qty, 0),
        total: state.items.reduce((n, it) => n + parsePrice(it.price) * it.qty, 0),
      };
    }

    window.beeoniaCart = {
      add: add,
      open: open,
      productName: productName,
      summary: summary,
      formatPrice: formatPrice,
    };

    syncWithPage();
    save();
    render();
  })();

  // ========================================
  // Hero button + "Detaylar için dokunun" attention effect
  // ========================================
  // When the visitor reaches the products (through the hero button, or by
  // scrolling there for the first time) the tap labels sparkle for 1.5 s.
  (function initTapHintAttention() {
    const hints = () => document.querySelectorAll(".product-tap-hint");
    let lastRun = 0;

    function sparkle() {
      const now = Date.now();
      if (now - lastRun < 2000) return;
      lastRun = now;
      hints().forEach((el) => {
        el.classList.remove("is-attention");
        void el.offsetWidth; // restart the animation
        el.classList.add("is-attention");
      });
      setTimeout(() => {
        hints().forEach((el) => el.classList.remove("is-attention"));
      }, 1500);
    }

    // Run once the smooth scroll started by the hero button has settled.
    function afterScrollSettles(cb) {
      let timer = null;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener("scroll", onScroll);
        cb();
      };
      const onScroll = () => {
        clearTimeout(timer);
        timer = setTimeout(finish, 140);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      timer = setTimeout(finish, 400); // already in place: no scroll happens
      setTimeout(finish, 1800); // safety net
    }

    const cta = document.getElementById("heroCta");
    if (cta) {
      cta.addEventListener("click", () => {
        if (typeof gtag === "function") gtag("event", "hero_cta_click");
        afterScrollSettles(sparkle);
      });
    }

    // First natural arrival at the product cards.
    const track = document.getElementById("productsTrack");
    if (track && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            io.disconnect();
            setTimeout(sparkle, 300);
          }
        },
        { threshold: 0.6 },
      );
      io.observe(track);
    }
  })();

  // ========================================
  // Back to Top
  // ========================================
  const backToTop = document.getElementById("backToTop");

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // ========================================
  // Smooth Scroll for Navigation Links
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // ========================================
  // Scroll Reveal Animation
  // ========================================
  const revealElements = document.querySelectorAll(
    ".gallery-section, .products-section, .about-item, .value-card, .team-member, .testimonials-section, .faq-section, .science-section",
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  revealElements.forEach((el) => {
    if (el.classList.contains("value-card")) {
      const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains("value-card"));
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = `${idx * 80}ms`;
    }
    revealObserver.observe(el);
  });

  // ========================================
  // Header Background on Scroll
  // ========================================
  const header = document.querySelector(".header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      header.style.background = "rgba(13, 16, 38, 0.95)";
      header.style.backdropFilter = "blur(10px)";
    } else {
      header.style.background =
        "linear-gradient(180deg, rgba(13, 16, 38, 1) 0%, transparent 100%)";
      header.style.backdropFilter = "none";
    }
  });

  // ========================================
  // Prevent Image Drag
  // ========================================
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("dragstart", (e) => e.preventDefault());
  });

  // ========================================
  // Customer Reviews Timeline
  // ========================================
  (function initReviews() {
    const reviews = [
      {
        name: "Erim K.",
        commentTr: "Çok iyi kalite",
        commentEn: "Very good quality",
        date: "10 September, 2026",
        url: "https://www.instagram.com/p/DdHK38hqLD0/c/17863075578676039/",
      },
      {
        name: "Batın G.",
        commentTr:
          "Çok titizlikle çalışılıyor, ellerinize sağlık. Petek bal ve arı ekmeğinizin elime ulaşmasını dört gözle bekliyorum 😍😍😍",
        commentEn:
          "You work very meticulously, well done. I am eagerly waiting for your comb honey and bee bread to reach me 😍😍😍",
        date: "21 July, 2026",
        url: "https://www.instagram.com/p/DbDvcNNqnMx/c/18128737780711661/",
      },
      {
        name: "Şule K.",
        commentTr:
          "Arı sağlığına verdiğiniz önem, balınızın kalitesine de yansıyor. Emeğinize sağlık, başarılarınız daim olsun🐝🍯",
        commentEn:
          "The importance you give to bee health is also reflected in the quality of your honey. Well done, may your success be lasting 🐝🍯",
        date: "7 July, 2026",
        url: "https://www.instagram.com/p/Daf9fFNqno8/c/18318666838275771/",
      },
      {
        name: "Batın G.",
        commentTr: "Ballar müthiş lezzetli ve diğer hiçbir bala benzemiyor.",
        commentEn:
          "The honeys are incredibly delicious and unlike any other honey.",
        date: "9 June, 2026",
        url: "https://www.instagram.com/p/DZVCDUnKp6z/c/18377601637160808/",
      },
      {
        name: "Ayşe Ç.",
        commentTr:
          "alınn en iyisi olması için ilmik ilmik emek ve çaba, tebrikler 👏 👏 ve sonuç harika bir lezzetli bal 😍 emeğinize sağlık, ben yedim denedim siz de deneyin 👏👍🫶",
        commentEn:
          "Stitch by stitch effort and dedication to make the best of its kind, congratulations 👏 👏 and the result is a wonderful delicious honey 😍 well done, I ate and tried it, you try it too 👏👍🫶",
        date: "8 June, 2026",
        url: "https://www.instagram.com/p/DZVCDUnKp6z/c/18087942740434121/",
      },
      {
        name: "Nedret Ş. T.",
        commentTr: "Bilinçli üretici ve tabiiki sonuç mutlaka harika 👏👏👏",
        commentEn:
          "Conscious producer and of course the result is definitely great 👏👏👏",
        date: "1 June, 2026",
        url: "https://www.instagram.com/p/DZCXO0hIk0Z/c/17976957774013745/",
      },
      {
        name: "Hakan A.",
        commentTr:
          "Gerçekten harika bir bal, emeğinize sağlık 🍯✨ Doğallığı ilk kaşıkta hissediliyor, teşekkürler! Gerçek bal arayanlara gönül rahatlığıyla öneririm. Muhteşem bir ürün!",
        commentEn:
          "Truly wonderful honey, thank you for your effort 🍯✨ You can feel the naturalness from the first spoon, thanks! I wholeheartedly recommend it to those looking for real honey. An amazing product!",
        date: "29 November, 2025",
        url: "https://www.instagram.com/p/DQcT4f_jJzN/c/17902895868316341/?img_index=1",
      },
      {
        name: "Zafer H.",
        commentTr:
          "Siparişimiz hızlı bir şekilde ulaştı. Gerçek anlamda Doğal-Bio bal tadabildiğimiz için şanslıyız, tavsiye ediyoruz. Guvenilirliği ve tazeliği için emeğinize sağlık. Alın ve aldırın, Afiyet olsun...",
        commentEn:
          "Our order arrived quickly. We are lucky to be able to taste truly Natural-Bio honey, we recommend it. Thank you for your effort for its reliability and freshness. Buy it and have others buy it, Enjoy...",
        date: "31 December, 2025",
        url: "https://www.instagram.com/p/DQcT4f_jJzN/c/18050346845447293/",
      },
      {
        name: "İmam K.",
        commentTr:
          "Arkadaşlar burdaki ürünler bir harika herkese tavsiye ederim",
        commentEn:
          "Friends, the products here are wonderful, I recommend them to everyone",
        date: "13 January, 2026",
        url: "https://www.instagram.com/p/DTavyE8jD3V/c/17953422657063196/",
      },
      {
        name: "Hakan D.",
        commentTr:
          "Muhteşem. Tam özlediğimiz tat. Bu lezzet bizi çocukluğumuzda yediğimiz o lezzetli, kıvamlı, katkısız, katıksız mis kokulu bal tadıyla yeniden buluşturdu. Ellerinize, emeğinize sağlık.",
        commentEn:
          "Magnificent. Exactly the taste we missed. This flavor reunited us with that delicious, thick, pure, unadulterated, fragrant honey taste we had in our childhood. Thank you for your effort.",
        date: "17 December, 2025",
        url: "https://www.instagram.com/p/DOv6qyXDDC8/c/17977905290794155/",
      },
      {
        name: "Yusuf G.",
        commentTr:
          "Gerçek bir bilimcinin verdiği güven ve eşsiz lezzetiyle kahvaltıların Seda Sayan'ı. Emeğinize sağlık Ege Arıcılık 🐝",
        commentEn:
          "The Seda Sayan of breakfasts with the trust of a real scientist and its unique taste. Thank you for your effort Ege Beekeeping 🐝",
        date: "20 December, 2025",
        url: "https://www.instagram.com/p/DSfwhDWjF3u/c/18543127087017166/",
      },
      {
        name: "Rasim Rabia G.",
        commentTr:
          "Orjinal bal buna denir çocuklarımıza güvenle yediriyoruz ve yiyiyoruz. Şiddetle tavsiye ederim, herkes bir şans verip almalı. Emeklerinize sağlık 👏👏",
        commentEn:
          "This is what original honey is called, we feed our children with confidence and eat it ourselves, I strongly recommend it, everyone should give it a chance and buy it, thank you for your effort 👏👏",
        date: "1 September, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18061529036063972/",
      },
      {
        name: "ka.cerit",
        commentTr: "Hayıt balı EFSANEYMIS denemeniz lazım",
        commentEn: "Chaste tree (Vitex) honey IS LEGENDARY you must try it",
        date: "18 September, 2025",
        url: "https://www.instagram.com/p/DOi8IwbDLyE/c/18083034712902055/",
      },
      {
        name: "Kadir G.",
        commentTr: "Dünyanın en güzel balıdır bu, ellerinize sağlık.",
        commentEn: "This is the most beautiful honey in the world, thank you.",
        date: "13 September, 2025",
        url: "https://www.instagram.com/p/DOi8IwbDLyE/c/18088731997839464/",
      },
      {
        name: "Kiraz N.",
        commentTr:
          "Emeklerinize sağlık balı sizden almakla doğru tercih yapmışız",
        commentEn:
          "Thank you for your effort, we made the right choice by buying honey from you",
        date: "5 September, 2025",
        url: "https://www.instagram.com/p/DOOwb0GDAR7/c/18287629336261593/",
      },
      {
        name: "Aslı K.",
        commentTr:
          "Doğal ve özlediğimiz gerçek bal lezzeti 👍 Gönül rahatlığıyla tavsiye ederim💯",
        commentEn:
          "Natural and the real honey taste we missed 👍 I recommend it with peace of mind💯",
        date: "3 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18317756617208716/",
      },
      {
        name: "Av. Demet K.",
        commentTr:
          "Güvenilir ellerden doğal bal almak isteyen herkese tavsiye ederim , teşekkürler 🙏🏻",
        commentEn:
          "I recommend it to everyone who wants to buy natural honey from reliable hands, thank you 🙏🏻",
        date: "2 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18143009455416285/",
      },
      {
        name: "Nilay B.",
        commentTr: "Lezzetli, doğal, güvenli.",
        commentEn: "Delicious, natural, safe.",
        date: "3 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18519352420027476/",
      },
      {
        name: "Semra Ç.",
        commentTr:
          "Lezzeti ve aroması çok güzel. Emeklerinize sağlık. Doğal bal yemek isteyenler kaçırmasın.",
        commentEn:
          "Its taste and aroma are very nice. Thank you for your effort. Those who want to eat natural honey should not miss it.",
        date: "4 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18484451644077387/",
      },
      {
        name: "Prof. Dr. Zafer K.",
        commentTr:
          "Ege arıcılık tan son mahsül balımızı aldık. Bebeğimiz ve biz güvenle ve lezzetle yiyoruz. Bu devirde güvenle önemli.. Osman bey e teşekkürlerimi sunuyorum..",
        commentEn:
          "We got our last harvest honey from Ege Beekeeping. Our baby and we eat it safely and deliciously. Trust is important in this day and age.. I offer my thanks to Mr. Osman..",
        date: "11 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18167154961318978/",
      },
      {
        name: "Nevin Ç.",
        commentTr: "Gözü kapalı güvenebileceğimiz tek adres.Çok teşekkürler 🙏",
        commentEn:
          "The only address we can trust blindly. Thank you very much 🙏",
        date: "26 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18090888745707762/",
      },
      {
        name: "Kaan K.",
        commentTr:
          "Kavanoz bal ve petek baldan aldık çok memnun kaldık gerçekten çok doğal",
        commentEn:
          "We bought jar honey and comb honey, we were very satisfied, really very natural",
        date: "20 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18404546206112811/",
      },
      {
        name: "Ayşe A.",
        commentTr: "Emeğinize sağlık 👏 doğallığı ve tadı mükemmel 🌻",
        commentEn:
          "Thank you for your effort 👏 its naturalness and taste are perfect 🌻",
        date: "27 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/17860922025466897/",
      },
      {
        name: "Hakan B.",
        commentTr:
          "Hayıt balını kullandık. Aroması nadir, lezzeti mükemmeldi. Üreten arkadaşların emeklerine sağlık",
        commentEn:
          "We used chaste tree honey. Its aroma is rare, its taste was perfect. Thank you to the friends who produced it",
        date: "22 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/17876862222284743/",
      },
      {
        name: "Erim K.",
        commentTr:
          "Hem petek balı hemde kavanoz balından aldım, birinci sınıf Rahmetli dedemin kovanları olduğu için çocukluğumun lezzetine tekrar kavuşmuş oldum",
        commentEn:
          "I bought both comb honey and jar honey, first class. Since my late grandfather had beehives, I was reunited with the taste of my childhood",
        date: "20 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18038453081437367/",
      },
      {
        name: "Faruk K.",
        commentTr: "Çok beğendim. Çok güvenilir emeklerinize sağlık 👏",
        commentEn: "I loved it. Very reliable, thank you for your effort 👏",
        date: "29 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18090214426746958/",
      },
      {
        name: "Ferhat K.",
        commentTr: "Harika olmuş emeklerinize sağlık 👏",
        commentEn: "It turned out great, thank you for your effort 👏",
        date: "29 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18174250735353086/",
      },
      {
        name: "Özlem D.",
        commentTr: "Çok lezzetli mükemmel bir bal.Emeğinize sağlık👏",
        commentEn:
          "A very delicious, perfect honey. Thank you for your effort👏",
        date: "12 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18522901870028596/",
      },
      {
        name: "İpek A.",
        commentTr: "Ellerinize sağlık çok kaliteli ve lezzetliydi 👏🏻",
        commentEn: "Thank you, it was very high quality and delicious 👏🏻",
        date: "10 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18075902464809215/",
      },
      {
        name: "Diş Hekimi Soner Ç.",
        commentTr: "Gerçek bal için teşekkürler",
        commentEn: "Thank you for real honey",
        date: "15 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18024715718711653/#",
      },
      {
        name: "Mehmet_112",
        commentTr:
          "Ellerinize sağlık çok lezzetli bir bal, hayırlı hasatlarınınız olsun",
        commentEn:
          "Thank you, very delicious honey, may you have blessed harvests",
        date: "30 July, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/17860051446397889/",
      },
      {
        name: "İbrahim Z.",
        commentTr:
          "Göndermiş olduğunuz bal elime ulaştı. Tadı kokusu harika elinize emeğinize sağlık",
        commentEn:
          "The honey you sent has arrived. Its taste and smell are wonderful, thank you for your effort",
        date: "18 October, 2025",
        url: "https://www.instagram.com/p/DLAJV8OtWfP/c/18119284267523515/",
      },
    ];

    const timelineTrack = document.getElementById("timelineTrack");
    const reviewText = document.getElementById("reviewText");
    const reviewsSection = document.querySelector(".testimonials-section");

    if (!timelineTrack || !reviewText || !reviewsSection) {
      return;
    }

    let currentIndex = 0;
    let reviewInterval = null;

    // Get initials from name
    // Titles such as "Prof. Dr." or "Av." are skipped so the avatar shows
    // the person's own initials (e.g. "Prof. Dr. Zafer K." -> "ZK").
    const NAME_TITLES = ["prof.", "dr.", "av.", "diş", "hekimi", "dt."];
    function getInitials(name) {
      const parts = name
        .split(" ")
        .filter((p) => p && NAME_TITLES.indexOf(p.toLocaleLowerCase("tr")) === -1);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr");
      }
      return name.substring(0, 2).toLocaleUpperCase("tr");
    }

    // Get color class based on index
    function getColorClass(index) {
      return "color-" + ((index % 8) + 1);
    }

    // Create timeline items
    function createTimelineItems() {
      timelineTrack.innerHTML = "";

      // Show 3 items: prev, active, next
      const prevIndex = (currentIndex - 1 + reviews.length) % reviews.length;
      const nextIndex = (currentIndex + 1) % reviews.length;
      const indices = [prevIndex, currentIndex, nextIndex];
      const classes = ["prev", "active", "next"];

      indices.forEach(function (idx, i) {
        const review = reviews[idx];
        const item = document.createElement("div");
        item.className = "timeline-item " + classes[i];

        const avatar = document.createElement("div");
        avatar.className = "review-avatar " + getColorClass(idx);
        avatar.textContent = getInitials(review.name);

        const info = document.createElement("div");
        info.className = "reviewer-info";

        const nameSpan = document.createElement("span");
        nameSpan.className = "reviewer-name";
        nameSpan.textContent = review.name;

        const starsDiv = document.createElement("div");
        starsDiv.className = "reviewer-stars";
        for (let s = 0; s < 5; s++) {
          const star = document.createElement("span");
          star.className = "star";
          star.textContent = "★";
          starsDiv.appendChild(star);
        }

        // Add review text inside the card
        const reviewTextCard = document.createElement("p");
        reviewTextCard.className = "review-text-card";
        reviewTextCard.textContent =
          currentLang === "tr" ? review.commentTr : review.commentEn;

        // Add clickable date at bottom of card
        const dateLink = document.createElement("a");
        dateLink.className = "review-date-link";
        dateLink.href = review.url;
        dateLink.target = "_blank";
        dateLink.rel = "noopener noreferrer";
        dateLink.textContent = review.date;

        info.appendChild(nameSpan);
        info.appendChild(starsDiv);
        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(reviewTextCard);
        item.appendChild(dateLink);
        timelineTrack.appendChild(item);
      });
    }

    // Update review text with fade animation - no longer needed
    function updateReviewText() {
      // Text is now inside cards, no separate update needed
    }

    // Go to next review
    function nextReview() {
      currentIndex = (currentIndex + 1) % reviews.length;
      createTimelineItems();
    }

    // Start autoplay
    function startReviewAutoplay() {
      stopReviewAutoplay();
      reviewInterval = setInterval(nextReview, 3000);
    }

    // Stop autoplay
    function stopReviewAutoplay() {
      if (reviewInterval) {
        clearInterval(reviewInterval);
        reviewInterval = null;
      }
    }

    // Go to previous review
    function prevReview() {
      currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
      createTimelineItems();
    }

    // Initialize
    createTimelineItems();
    startReviewAutoplay();

    // Listen for language change to update reviews
    document.addEventListener("languageChanged", function () {
      createTimelineItems();
    });

    // Button controls for reviews carousel
    const reviewsPrevBtn = document.getElementById("reviewsPrev");
    const reviewsNextBtn = document.getElementById("reviewsNext");

    if (reviewsPrevBtn) {
      reviewsPrevBtn.addEventListener("click", function () {
        stopReviewAutoplay();
        prevReview();
        startReviewAutoplay();
      });
    }

    if (reviewsNextBtn) {
      reviewsNextBtn.addEventListener("click", function () {
        stopReviewAutoplay();
        nextReview();
        startReviewAutoplay();
      });
    }

    // Pause on hover
    reviewsSection.addEventListener("mouseenter", stopReviewAutoplay);
    reviewsSection.addEventListener("mouseleave", startReviewAutoplay);

    // Keyboard navigation (left/right arrow keys)
    document.addEventListener("keydown", function (e) {
      // Check if reviews section is visible in viewport
      const rect = reviewsSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVisible) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        stopReviewAutoplay();
        nextReview();
        startReviewAutoplay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stopReviewAutoplay();
        prevReview();
        startReviewAutoplay();
      }
    });

    // Mouse drag support for horizontal scrolling
    let isDragging = false;
    let startX = 0;
    let hasDragged = false;

    timelineTrack.addEventListener("mousedown", function (e) {
      isDragging = true;
      hasDragged = false;
      startX = e.clientX;
      timelineTrack.style.cursor = "grabbing";
      stopReviewAutoplay();
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;

      const diff = e.clientX - startX;
      if (Math.abs(diff) > 10) {
        hasDragged = true;
      }
    });

    document.addEventListener("mouseup", function (e) {
      if (!isDragging) return;

      isDragging = false;
      timelineTrack.style.cursor = "grab";

      const diff = startX - e.clientX;
      const threshold = 50;

      if (diff > threshold) {
        nextReview();
      } else if (diff < -threshold) {
        prevReview();
      }

      startReviewAutoplay();
    });

    // Set initial cursor style for drag indication
    timelineTrack.style.cursor = "grab";

    // Prevent click events on links when dragging
    timelineTrack.addEventListener(
      "click",
      function (e) {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  })();

  // ========================================
  // FAQ Accordion
  // ========================================
  (function initFAQ() {
    const faqItems = document.querySelectorAll(".faq-item");

    if (faqItems.length === 0) return;

    faqItems.forEach(function (item) {
      const question = item.querySelector(".faq-question");

      if (question) {
        question.addEventListener("click", function () {
          const isActive = item.classList.contains("active");

          // Close all other items (accordion behavior)
          faqItems.forEach(function (otherItem) {
            if (otherItem !== item) {
              otherItem.classList.remove("active");
              const otherQuestion = otherItem.querySelector(".faq-question");
              if (otherQuestion) {
                otherQuestion.setAttribute("aria-expanded", "false");
              }
            }
          });

          // Toggle current item
          item.classList.toggle("active");
          question.setAttribute("aria-expanded", !isActive);
        });

        // Keyboard accessibility
        question.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            question.click();
          }
        });
      }
    });

    // Allow opening multiple items with Shift+Click
    faqItems.forEach(function (item) {
      const question = item.querySelector(".faq-question");

      if (question) {
        question.addEventListener("click", function (e) {
          if (e.shiftKey) {
            // Just toggle this item without closing others
            e.stopImmediatePropagation();
            item.classList.toggle("active");
            question.setAttribute(
              "aria-expanded",
              item.classList.contains("active"),
            );
          }
        });
      }
    });
  })();

  // ========================================
  // Mascot Popup with Toggle and Drag
  // ========================================
  (function initMascotPopup() {
    const mascotPopup = document.getElementById("mascotPopup");
    const mascotImage = document.getElementById("mascotImage");
    const speechBubble = document.getElementById("mascotSpeechBubble");
    const mascotText = mascotPopup
      ? mascotPopup.querySelector(".mascot-text")
      : null;

    if (!mascotPopup || !mascotImage || !speechBubble) return;

    let isDragging = false;
    let hasDragged = false;
    let startX, startY;
    let initialMascotRight, initialBottom;

    // Show speech bubble after 3 seconds on first load
    setTimeout(function () {
      speechBubble.classList.add("visible");
    }, 3000);

    // Auto-hide speech bubble 10 seconds after page load
    setTimeout(function () {
      speechBubble.classList.remove("visible");
    }, 10000);

    // Idle nudge every 10 seconds — gentle "I'm still here" wiggle
    setInterval(function () {
      if (isDragging) return;
      mascotImage.classList.add("nudging");
    }, 10000);

    mascotImage.addEventListener("animationend", function (e) {
      if (e.animationName === "mascot-nudge") {
        mascotImage.classList.remove("nudging");
      }
    });

    // Toggle speech bubble on mascot click
    mascotImage.addEventListener("click", function (e) {
      if (!hasDragged) {
        speechBubble.classList.toggle("visible");
      }
      hasDragged = false;
    });

    // Get the flex gap between mascot and bubble
    function getFlexGap() {
      return parseFloat(window.getComputedStyle(mascotPopup).gap) || 12;
    }

    // Convert container "right" CSS value to the mascot image's own "right" offset
    // In normal state: mascot is at right end, so mascotRight = containerRight
    // In flipped state: mascot is at left end, so mascotRight = containerRight + bubbleWidth + gap
    function containerRightToMascotRight(containerRight, isFlipped) {
      if (isFlipped) {
        return containerRight + speechBubble.offsetWidth + getFlexGap();
      }
      return containerRight;
    }

    // Convert mascot image's "right" offset to the container's "right" CSS value
    function mascotRightToContainerRight(mascotRight, isFlipped) {
      if (isFlipped) {
        return mascotRight - speechBubble.offsetWidth - getFlexGap();
      }
      return mascotRight;
    }

    // Apply position: clamp mascot within viewport, determine flip, set CSS
    function applyPosition(mascotRight, bottom) {
      // Clamp mascot image within viewport horizontally
      var mascotW = mascotImage.offsetWidth;
      var maxMascotRight = window.innerWidth - mascotW;
      mascotRight = Math.max(0, Math.min(mascotRight, maxMascotRight));

      // Determine flip state: flip when mascot center crosses viewport center
      var mascotCenterX = window.innerWidth - mascotRight - mascotW / 2;
      var screenCenterX = window.innerWidth / 2;
      var shouldFlip = mascotCenterX < screenCenterX;

      if (shouldFlip) {
        mascotPopup.classList.add("flipped");
      } else {
        mascotPopup.classList.remove("flipped");
      }

      // Calculate container right from mascot right
      var containerRight = mascotRightToContainerRight(mascotRight, shouldFlip);
      mascotPopup.style.right = containerRight + "px";

      // Clamp vertically (popup height includes the taller bubble)
      var popupHeight = mascotPopup.offsetHeight;
      var maxBottom = window.innerHeight - popupHeight;
      bottom = Math.max(0, Math.min(bottom, maxBottom));
      mascotPopup.style.bottom = bottom + "px";
    }

    // Read the current mascot right offset from the DOM
    function getCurrentMascotRight() {
      var rect = mascotPopup.getBoundingClientRect();
      var containerRight = window.innerWidth - rect.right;
      var isFlipped = mascotPopup.classList.contains("flipped");
      return containerRightToMascotRight(containerRight, isFlipped);
    }

    // Read the current bottom offset from the DOM
    function getCurrentBottom() {
      var rect = mascotPopup.getBoundingClientRect();
      return window.innerHeight - rect.bottom;
    }

    // Drag functionality - Mouse events
    mascotImage.addEventListener("mousedown", function (e) {
      e.preventDefault();
      isDragging = true;
      hasDragged = false;

      startX = e.clientX;
      startY = e.clientY;
      initialMascotRight = getCurrentMascotRight();
      initialBottom = getCurrentBottom();

      mascotPopup.classList.add("dragging");
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;

      var deltaX = startX - e.clientX;
      var deltaY = startY - e.clientY;

      // Mark as dragged if moved more than 5px
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasDragged = true;
      }

      var mascotRight = initialMascotRight + deltaX;
      var newBottom = initialBottom + deltaY;

      applyPosition(mascotRight, newBottom);
    });

    document.addEventListener("mouseup", function () {
      if (isDragging) {
        isDragging = false;
        mascotPopup.classList.remove("dragging");
      }
    });

    // Drag functionality - Touch events for mobile
    mascotImage.addEventListener(
      "touchstart",
      function (e) {
        isDragging = true;
        hasDragged = false;

        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        initialMascotRight = getCurrentMascotRight();
        initialBottom = getCurrentBottom();

        mascotPopup.classList.add("dragging");
      },
      { passive: true },
    );

    document.addEventListener(
      "touchmove",
      function (e) {
        if (!isDragging) return;

        var touch = e.touches[0];
        var deltaX = startX - touch.clientX;
        var deltaY = startY - touch.clientY;

        // Mark as dragged if moved more than 5px
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          hasDragged = true;
        }

        var mascotRight = initialMascotRight + deltaX;
        var newBottom = initialBottom + deltaY;

        applyPosition(mascotRight, newBottom);
      },
      { passive: true },
    );

    document.addEventListener("touchend", function () {
      if (isDragging) {
        isDragging = false;
        mascotPopup.classList.remove("dragging");
      }
    });

    // Update text on language change
    document.addEventListener("languageChanged", function (e) {
      if (mascotText) {
        var lang = e.detail.lang;
        mascotText.textContent = mascotText.getAttribute("data-" + lang);
      }
    });
  })();

  // ========================================
  // Science / Literature Section
  // ========================================
  (function initScience() {
    const articles = [
      {
        titleEn: "The Honey Bee \"Hive\" Microbiota: Meta-Analysis Reveals a Native and Aerobic Microbiota Prevalent Throughout the Social Resource Niche (2024)",
        titleTr: "Bal Arısı \"Kovan\" Mikrobiyotası: Meta-Analiz, Sosyal Kaynak Nişinde Yaygın, Yerli ve Aerobik Bir Mikrobiyotayı Ortaya Koyuyor (2024)",
        date: "2026-12-18",
        summaryEn: "Meta-analysis of more than 3,800 public 16S rRNA sequence libraries from 35 projects, covering nine oxygen-rich niches of the colony: queen and worker mouthparts and foregut, midgut, social glands, larvae, and stored and secreted food. The mouthparts, crop and midgut of queens and workers share a large part of their bacteria with larval food and stored nutrition, dominated by Bombella, Apilactobacillus and several Lactobacillus species. The authors call this the \"social resource\" microbiota and propose, partly as hypothesis, that it mainly suppresses pathogens at the individual and colony level and may support gut resilience.",
        summaryTr: "35 projeden 3.800'ü aşkın açık 16S rRNA dizi kütüphanesini birleştiren meta-analiz; kraliçe ve işçi arıların ağız parçaları ve ön bağırsağı, orta bağırsak, sosyal bezler, larvalar ile depolanan ve salgılanan besinler dahil kovandaki dokuz oksijenli nişi kapsamaktadır. Kraliçe ve işçilerin ağız parçaları, bal midesi ve orta bağırsağı, bakterilerinin büyük kısmını larva besini ve depolanan besinle paylaşmakta; bu toplulukta Bombella, Apilactobacillus ve çeşitli Lactobacillus türleri baskındır. Yazarlar bu topluluğu \"sosyal kaynak\" mikrobiyotası olarak tanımlamakta ve kısmen hipotez düzeyinde, başlıca işlevinin birey ve koloni düzeyinde patojenleri baskılamak olduğunu öne sürmektedir.",
        categories: ["bee-welfare"],
        url: "https://www.frontiersin.org/journals/bee-science/articles/10.3389/frbee.2024.1410331/full"
      },
      {
        titleEn: "Definition and Identification of Honey Bee Welfare Practices Within the Five Domains Framework for Sustainable Beekeeping (2024)",
        titleTr: "Sürdürülebilir Arıcılık için Beş Alan Çerçevesinde Bal Arısı Refahı Uygulamalarının Tanımlanması ve Belirlenmesi (2024)",
        date: "2026-12-11",
        summaryEn: "Study defining the honey bee welfare practices that beekeepers should adopt within modern sustainable apiculture and classifying them according to the Five Domains Model used for other animal species, which covers nutrition, physical environment, health, behaviour, and mental state.",
        summaryTr: "Modern ve sürdürülebilir arıcılıkta arıcıların benimsemesi gereken bal arısı refahı uygulamalarını tanımlayan ve bunları diğer hayvan türlerinde kullanılan Beş Alan Modeli'ne (beslenme, fiziksel çevre, sağlık, davranış ve zihinsel durum) göre sınıflandıran çalışma.",
        summaryBasis: "unverified", // MDPI page blocks automated access; summary not yet checked against the paper
        categories: ["bee-welfare"],
        url: "https://www.mdpi.com/2076-3417/14/24/11902"
      },
      {
        titleEn: "Enhancing Honey Bee Health: Evaluating Pollen Substitute Diets in Field and Cage Experiments (2024)",
        titleTr: "Bal Arısı Sağlığını Güçlendirmek: Polen İkame Diyetlerinin Saha ve Kafes Deneylerinde Değerlendirilmesi (2024)",
        date: "2026-12-04",
        summaryEn: "Field trial with 15 colonies in South Korea (February to May 2023) plus a cage experiment, comparing three new pollen substitute diets with a commercial control across 11 parameters and 21 amino acids. Diet 1, containing apple juice, soy peptide and Chlorella, gave the largest total bee population (about 62,500 vs 27,900 bees with the control), larger brood area, higher consumption and honey production, and higher vitellogenin expression. Histidine, isoleucine and arginine content tracked colony performance most closely, so the authors argue amino acid balance should guide substitute formulation.",
        summaryTr: "Güney Kore'de 15 koloniyle yürütülen saha denemesi (Şubat-Mayıs 2023) ve kafes deneyi; üç yeni polen ikame diyeti ticari bir kontrol diyetiyle 11 parametre ve 21 amino asit üzerinden karşılaştırılmıştır. Elma suyu, soya peptidi ve Chlorella içeren Diyet 1, en yüksek toplam arı popülasyonunu (kontrolde yaklaşık 27.900'e karşı 62.500 arı), daha geniş yavru alanını, daha yüksek tüketim ve bal üretimini ve daha yüksek vitellogenin ifadesini sağlamıştır. Koloni performansıyla en yakın ilişkiyi histidin, izolösin ve arjinin içeriği gösterdiğinden yazarlar, ikame diyetlerin amino asit dengesine göre formüle edilmesini önermektedir.",
        categories: ["bee-welfare"],
        url: "https://www.mdpi.com/2075-4450/15/5/361"
      },
      {
        titleEn: "Effects of Nutritional Supplementation on Honey Bee Apis mellifera L. Brood Development, Colony Population Growth, and Honey Yield in Central Ethiopia (2026)",
        titleTr: "Besin Takviyesinin Bal Arısı Apis mellifera L.'de Yavru Gelişimi, Koloni Popülasyon Artışı ve Bal Verimi Üzerindeki Etkileri: Orta Etiyopya (2026)",
        date: "2026-11-27",
        summaryEn: "Single-season field trial in the Ethiopian highlands with five colonies per group, comparing three locally made pollen substitutes (soybean cake, niger seed cake, mung bean flour; 250 g per week) with sugar syrup alone. Soybean cake had the most protein (46%), was eaten most, and gave the highest honey yield (14.75 kg per colony vs 11.2 kg with syrup and 8.1 kg with mung bean) and the best economic return. The authors recommend it for smallholders but caution that the small sample, single season and missing amino acid analysis limit how far the results can be generalised.",
        summaryTr: "Etiyopya yaylalarında, grup başına beş koloniyle tek sezon yürütülen saha denemesi; yerel olarak üretilen üç polen ikamesi (soya küspesi, nijer tohumu küspesi, maş fasulyesi unu; haftada 250 g) yalnızca şeker şurubuyla karşılaştırılmıştır. En yüksek protein oranına (%46) sahip soya küspesi en çok tüketilen diyet olmuş, en yüksek bal verimini (koloni başına 14,75 kg; şurupta 11,2 kg, maş fasulyesinde 8,1 kg) ve en iyi ekonomik getiriyi sağlamıştır. Yazarlar bu diyeti küçük ölçekli arıcılara önermekle birlikte, küçük örneklemin, tek sezonun ve amino asit analizinin yapılmamış olmasının genellenebilirliği sınırladığını belirtmektedir.",
        categories: ["bee-welfare", "honey"],
        url: "https://www.frontiersin.org/journals/bee-science/articles/10.3389/frbee.2026.1813470/full"
      },
      {
        titleEn: "A Laboratory Amitraz Resistance Assay for Varroa destructor May Not Be a Reliable Predictor of Field-Level Amitraz Efficacy (2026)",
        titleTr: "Varroa destructor için Laboratuvar Amitraz Direnç Testi, Amitrazın Sahadaki Etkinliğini Güvenilir Biçimde Öngöremeyebilir (2026)",
        date: "2026-11-20",
        summaryEn: "Two-year brief research report testing whether a 3-hour laboratory bioassay can predict amitraz resistance in Varroa destructor. The bioassay correctly flagged mites carrying the Y215H resistance mutation 94.6% of the time but identified susceptible mites in only 66.8%. In the field, a 42-day Apivar (amitraz) treatment reduced mites by about 98% in 32 treated colonies regardless of the bioassay's prediction, while 12 untreated colonies showed no significant change. The authors conclude the assay detects the resistance genotype but does not predict how well amitraz will work in a colony.",
        summaryTr: "Varroa destructor'da amitraz direncinin 3 saatlik bir laboratuvar testiyle öngörülüp öngörülemeyeceğini iki yıl boyunca inceleyen kısa araştırma raporu. Test, Y215H direnç mutasyonu taşıyan akarları %94,6 oranında doğru belirlemiş, ancak duyarlı akarları yalnızca %66,8 oranında tanıyabilmiştir. Sahada 42 günlük Apivar (amitraz) uygulaması, testin öngörüsünden bağımsız olarak tedavi edilen 32 kolonide akar yükünü yaklaşık %98 azaltmış, tedavi edilmeyen 12 kolonide ise anlamlı değişim görülmemiştir. Yazarlar testin direnç genotipini saptadığını, ancak amitrazın kolonide ne kadar etkili olacağını öngörmediğini belirtmektedir.",
        categories: ["bee-welfare"],
        url: "https://www.frontiersin.org/journals/bee-science/articles/10.3389/frbee.2026.1886628/full"
      },
      {
        titleEn: "Propolis as a Natural Remedy in Reducing Dental Plaque and Gingival Inflammation: A Systematic Review and Meta-Analysis (2025)",
        titleTr: "Diş Plağı ve Diş Eti İltihabını Azaltmada Doğal Bir Seçenek Olarak Propolis: Sistematik Derleme ve Meta-Analiz (2025)",
        date: "2026-11-13",
        summaryEn: "Systematic review of 20 clinical studies plus a meta-analysis of the randomized trials on alcohol-free propolis mouthwash. Compared with baseline, the mouthwash produced large reductions in plaque index (SMD 1.74; 5 RCTs, 121 participants) and gingival index (SMD 2.19; 5 RCTs, 129 participants), and several trials found it about as effective as chlorhexidine without staining the teeth. The authors note that several trials carried some or high risk of bias, follow-up was short, and propolis formulations were not standardized.",
        summaryTr: "20 klinik çalışmayı kapsayan sistematik derleme ve alkolsüz propolis gargarasıyla yapılan randomize çalışmaların meta-analizi. Gargara, başlangıca kıyasla plak indeksinde (SMD 1,74; 5 RKÇ, 121 katılımcı) ve diş eti indeksinde (SMD 2,19; 5 RKÇ, 129 katılımcı) büyük düşüş sağlamış; birkaç çalışmada dişleri lekelemeden klorheksidine yakın etkinlik göstermiştir. Yazarlar bazı çalışmalarda yanlılık riskinin orta veya yüksek olduğunu, takip sürelerinin kısa kaldığını ve propolis formülasyonlarının standart olmadığını vurgulamaktadır.",
        categories: ["propolis", "immunity"],
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12470411/"
      },
      {
        titleEn: "A Multifunctional Dendrobium officinale Polysaccharide Hydrogel Loaded with Propolis Extract to Promote Oral Mucosal Repair (2026)",
        titleTr: "Ağız Mukozası Onarımını Destekleyen, Propolis Ekstresi Yüklü Çok İşlevli Dendrobium officinale Polisakkarit Hidrojeli (2026)",
        date: "2026-11-06",
        summaryEn: "Laboratory and rat study developing a hydrogel loaded with propolis extract, built from Dendrobium officinale polysaccharide and modified hyaluronic acid, for oral ulcers. The gel showed antioxidant, immunomodulatory and pro-angiogenic properties, supported repair at different stages of healing in rat oral ulcer models, and also helped close full-thickness skin wounds. The authors present it as a natural material that combines infection control, inflammation regulation and tissue regeneration; it has not yet been tested in people.",
        summaryTr: "Dendrobium officinale polisakkariti ve modifiye hyaluronik asitten oluşan, propolis ekstresi yüklü bir hidrojelin ağız ülserleri için geliştirildiği laboratuvar ve sıçan çalışması. Jel antioksidan, bağışıklık düzenleyici ve damar oluşumunu destekleyici özellikler göstermiş, sıçan ağız ülseri modellerinde iyileşmenin farklı evrelerinde onarımı desteklemiş ve tam kat deri yaralarının kapanmasına da yardımcı olmuştur. Yazarlar jeli enfeksiyon kontrolü, inflamasyon düzenlemesi ve doku yenilenmesini birleştiren doğal bir malzeme olarak sunmaktadır; insanlarda henüz test edilmemiştir.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["propolis", "wound-healing"],
        url: "https://doi.org/10.1016/j.phymed.2026.158869"
      },
      {
        titleEn: "Propolis Add-On Therapy Alleviates Depressive Symptoms: A Randomized Placebo-Controlled Clinical Trial (2022)",
        titleTr: "Eklenti Tedavi Olarak Propolis Depresif Semptomları Hafifletiyor: Randomize Plasebo Kontrollü Klinik Çalışma (2022)",
        date: "2026-10-30",
        summaryEn: "Double-blind, randomized, placebo-controlled trial in 54 adults with moderate to severe major depression who took Azerbaijani propolis or placebo for 6 weeks alongside their SSRI antidepressant. With propolis, the Hamilton depression score fell from about 21 to 10 and the Beck Depression Inventory from about 29 to 14, a significantly larger drop than with placebo, and the add-on was reported as safe. The authors attribute the effect to the propolis's phenolic acids and flavonoids; the trial was small and short.",
        summaryTr: "Orta-ağır majör depresyonu olan 54 yetişkinin SSRI antidepresanlarına ek olarak 6 hafta boyunca Azerbaycan propolisi veya plasebo aldığı çift kör, randomize, plasebo kontrollü çalışma. Propolis grubunda Hamilton depresyon skoru yaklaşık 21'den 10'a, Beck Depresyon Envanteri skoru yaklaşık 29'dan 14'e düşmüş; bu düşüş plasebodan anlamlı ölçüde büyük olmuş ve ek tedavi güvenli bulunmuştur. Yazarlar etkiyi propolisin fenolik asit ve flavonoid içeriğine bağlamaktadır; çalışma küçük ölçekli ve kısa sürelidir.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["propolis", "brain"],
        url: "https://pubmed.ncbi.nlm.nih.gov/35072307/"
      },
      {
        titleEn: "Effects of Propolis on Inflammation Markers in Patients Undergoing Hemodialysis: A Randomized, Double-Blind Controlled Clinical Trial (2023)",
        titleTr: "Hemodiyaliz Hastalarında Propolisin İnflamasyon Belirteçleri Üzerindeki Etkileri: Randomize, Çift Kör Kontrollü Klinik Çalışma (2023)",
        date: "2026-10-23",
        summaryEn: "Double-blind, randomized, placebo-controlled trial in patients with chronic kidney disease on haemodialysis, 41 of whom completed two months of 400 mg/day standardised Brazilian green propolis extract (EPP-AF) or placebo. Propolis significantly lowered plasma TNF-α and tended to lower MIP-1β, while the placebo group showed no changes. The authors conclude that short-term propolis may ease the chronic inflammation typical of haemodialysis patients; the sample was small and the follow-up short.",
        summaryTr: "Hemodiyalize giren kronik böbrek hastalarında yürütülen ve 41 hastanın iki ay boyunca günde 400 mg standardize Brezilya yeşil propolis ekstresi (EPP-AF) veya plasebo almayı tamamladığı çift kör, randomize, plasebo kontrollü çalışma. Propolis plazma TNF-α düzeyini anlamlı biçimde düşürmüş, MIP-1β'yı düşürme eğilimi göstermiş; plasebo grubunda değişim görülmemiştir. Yazarlar kısa süreli propolis kullanımının hemodiyaliz hastalarındaki kronik inflamasyonu hafifletebileceği sonucuna varmaktadır; örneklem küçük ve takip kısadır.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["propolis", "immunity"],
        url: "https://www.sciencedirect.com/science/article/pii/S1744388123000130"
      },
      {
        titleEn: "Royal Jelly for Management of Postmenopausal Symptoms: A Systematic Review and Meta-Analysis (2025)",
        titleTr: "Menopoz Sonrası Semptomların Yönetiminde Arı Sütü: Sistematik Derleme ve Meta-Analiz (2025)",
        date: "2026-10-16",
        summaryEn: "Systematic review and meta-analysis of 6 controlled studies (471 postmenopausal women, published 2011 to 2021) comparing royal jelly supplements with placebo. Royal jelly improved overall menopausal symptoms compared with placebo (standardised mean difference 0.73), and the included studies also reported benefits for genitourinary symptoms, quality of life and bone health. The authors see royal jelly as a possible non-hormonal option for women who cannot or prefer not to use hormone therapy, based on a small number of trials.",
        summaryTr: "Arı sütü takviyesini plaseboyla karşılaştıran 6 kontrollü çalışmanın (2011-2021 arası yayımlanmış, 471 postmenopozal kadın) sistematik derlemesi ve meta-analizi. Arı sütü genel menopoz semptomlarını plaseboya göre iyileştirmiş (standart ortalama fark 0,73); dahil edilen çalışmalar genitoüriner semptomlar, yaşam kalitesi ve kemik sağlığı açısından da yarar bildirmiştir. Yazarlar az sayıda çalışmaya dayanarak arı sütünü hormon tedavisi kullanamayan veya kullanmak istemeyen kadınlar için olası hormon dışı bir seçenek olarak değerlendirmektedir.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["royal-jelly", "immunity"],
        url: "https://pubmed.ncbi.nlm.nih.gov/41401249/"
      },
      {
        titleEn: "Bee Pollen Increases Hippocampal Brain-Derived Neurotrophic Factor and Suppresses Neuroinflammation in Adult Rats with Chronic Immobilization Stress (2021)",
        titleTr: "Arı Poleni Kronik İmmobilizasyon Stresi Uygulanan Yetişkin Sıçanlarda Hipokampal Beyin Kaynaklı Nörotrofik Faktörü Artırır ve Neuroinflamasyonu Baskılar (2021)",
        date: "2026-10-09",
        summaryEn: "Rat study in which 24 male Sprague-Dawley rats were split into control, immobilisation stress, and stress plus Anatolian bee pollen (200 mg/kg/day for 10 days) groups. Bee pollen reduced anxiety-like behaviour in the open field test but did not change depression-like behaviour in the forced swim test. In the hippocampus it raised BDNF, lowered IL-1β and TNF-α, and reduced oxidative damage (lower malondialdehyde, higher glutathione), suggesting protection against stress-related neuroinflammation in rats.",
        summaryTr: "24 erkek Sprague-Dawley sıçanın kontrol, hareketsizlik stresi ve stres artı Anadolu arı poleni (10 gün boyunca günde 200 mg/kg) gruplarına ayrıldığı hayvan çalışması. Arı poleni açık alan testinde kaygı benzeri davranışı azaltmış, ancak zorunlu yüzme testindeki depresyon benzeri davranışı değiştirmemiştir. Hipokampusta BDNF'yi artırmış, IL-1β ve TNF-α'yı düşürmüş ve oksidatif hasarı azaltmış (daha düşük malondialdehit, daha yüksek glutatyon); bu da sıçanlarda strese bağlı nöroinflamasyona karşı koruyucu bir etkiye işaret etmektedir.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["pollen", "brain"],
        url: "https://www.sciencedirect.com/science/article/pii/S0304394021007217"
      },
      {
        titleEn: "From Toxin to Therapy: Biomedical Applications of Bee Venom in Cancer, Diabetes, and Neurodegenerative Disorders (2026)",
        titleTr: "Toksin'den Terapiye: Arı Zehrinin Kanser, Diyabet ve Nörodejeneratif Bozukluklardaki Biyomedikal Uygulamaları (2026)",
        date: "2026-10-02",
        summaryEn: "Narrative review of bee venom (apitoxin) and its main components, melittin, apamin, adolapin and phospholipase A2, in diabetes, cancer and neurodegenerative disease, drawing on cell, animal and a smaller number of clinical studies. These compounds act on inflammation, oxidative stress, apoptosis and immune signalling, and clinical use so far is mainly for pain and inflammation. The authors stress that melittin and phospholipase A2 damage cell membranes and give whole venom a narrow therapeutic window with allergy and anaphylaxis risk, so they see purified compounds and targeted delivery as the way forward.",
        summaryTr: "Arı zehiri (apitoksin) ve başlıca bileşenleri olan melittin, apamin, adolapin ve fosfolipaz A2'nin diyabet, kanser ve nörodejeneratif hastalıklardaki rolünü, hücre, hayvan ve daha az sayıdaki klinik çalışmaya dayanarak ele alan anlatısal derleme. Bu bileşenler inflamasyon, oksidatif stres, apoptoz ve bağışıklık sinyal yolaklarını etkilemekte; klinik kullanım şimdiye kadar ağırlıklı olarak ağrı ve inflamasyon için olmuştur. Yazarlar, melittin ve fosfolipaz A2'nin hücre zarlarına zarar vermesi nedeniyle bütün zehrin tedavi aralığının dar olduğunu, alerji ve anafilaksi riski taşıdığını vurgulamakta ve saflaştırılmış bileşenleri ve hedefe yönelik taşıma sistemlerini çözüm olarak görmektedir.",
        categories: ["immunity", "brain"],
        url: "https://www.mdpi.com/1422-0067/27/11/4661"
      },
      {
        titleEn: "Bee Products in Dermatology and Skin Care (2020)",
        titleTr: "Dermatoloji ve Cilt Bakımında Arı Ürünleri (2020)",
        date: "2026-09-25",
        summaryEn: "Review of honey, propolis, bee pollen, bee bread, royal jelly, beeswax and bee venom as ingredients in dermatology and cosmetics, organised around their active compounds (flavonoids such as chrysin, galangin and pinocembrin, and royal jelly's 10-HDA). It covers burn and wound healing, where propolis performed comparably to sulfathiazole and silver sulfadiazine in reported studies, antimicrobial and UV-protective effects, and bee venom use in acne, atopic dermatitis and photodamage. A separate section reviews allergic reactions to bee products, which the authors note must be considered before topical use.",
        summaryTr: "Bal, propolis, arı poleni, arı ekmeği, arı sütü, balmumu ve arı zehirini dermatoloji ve kozmetikte kullanılan hammaddeler olarak, içerdikleri etken maddeler (krisin, galangin, pinosembrin gibi flavonoidler ve arı sütündeki 10-HDA) üzerinden inceleyen derleme. Yanık ve yara iyileşmesi (bildirilen çalışmalarda propolisin sülfatiyazol ve gümüş sülfadiazinle benzer etki gösterdiği), antimikrobiyal ve UV koruyucu etkiler ile arı zehirinin akne, atopik dermatit ve güneş hasarındaki kullanımı ele alınmaktadır. Ayrı bir bölüm arı ürünlerine karşı alerjik reaksiyonları incelemekte ve yazarlar topikal kullanımdan önce bu riskin göz önünde bulundurulması gerektiğini belirtmektedir.",
        categories: ["honey", "propolis", "royal-jelly"],
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7036894/"
      },
      {
        titleEn: "Exploring the Potential of Bee-Derived Antioxidants for Maintaining Oral Hygiene and Dental Health (2023)",
        titleTr: "Arı Kaynaklı Antioksidanların Ağız Hijyeni ve Diş Sağlığının Korunmasındaki Potansiyeli (2023)",
        date: "2026-09-18",
        summaryEn: "Review of honey, propolis and royal jelly for oral health, focusing on their phenolic acids, flavonoids such as pinocembrin, CAPE and galangin, and terpenoids. In vitro, animal and clinical studies show activity against oral pathogens such as Streptococcus mutans and Porphyromonas gingivalis and benefits in periodontitis, caries, oral mucositis and dentine hypersensitivity, and the review describes bee-based chewing gums, toothpastes and mouthwashes. The authors note that findings are inconsistent across studies, bioaccessibility of the active compounds is unclear, and allergies, though uncommon, mean safety must be considered.",
        summaryTr: "Bal, propolis ve arı sütünü ağız sağlığı açısından; fenolik asitleri, pinosembrin, CAPE ve galangin gibi flavonoidleri ve terpenoidleri üzerinden ele alan derleme. In vitro, hayvan ve klinik çalışmalar, Streptococcus mutans ve Porphyromonas gingivalis gibi ağız patojenlerine karşı etkinlik ile periodontit, diş çürüğü, oral mukozit ve dentin hassasiyetinde yarar göstermekte; derleme arı ürünü içeren sakız, diş macunu ve gargaraları da tanıtmaktadır. Yazarlar çalışma sonuçlarının tutarsız olduğunu, etken maddelerin biyoerişilebilirliğinin belirsiz kaldığını ve seyrek de olsa alerji riskinin güvenlik açısından dikkate alınması gerektiğini belirtmektedir.",
        categories: ["honey", "propolis"],
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10375990/#sec5-antioxidants-12-01452"
      },
      {
        titleEn: "Honey as a Bioindicator of Microplastic Pollution: Insights from Industrial and Special Honey Types (2026)",
        titleTr: "Mikroplastik Kirliliğinin Biyogöstergesi Olarak Bal: Endüstriyel ve Özel Bal Türlerinden Elde Edilen Bulgular (2026)",
        date: "2026-09-11",
        summaryEn: "Laboratory study of 15 honeys sold in Türkiye, 8 industrial and 7 special (artisanal), analysed by stereomicroscopy and FTIR spectroscopy against blank controls. Microplastics were found in 93% of samples, with more in special honeys (11.4 vs 4.9 particles per sample); most were fragments, mainly ethylene-vinyl acetate, PET and polyethylene, sized 85 to 1,200 µm. Estimated intake from honey was only 0.16 to 0.38 particles per day, so the authors see honey less as a major exposure source and more as an indicator of environmental microplastic pollution and of contamination during harvesting and processing.",
        summaryTr: "Türkiye'de satılan 8'i endüstriyel, 7'si özel (zanaat) olmak üzere 15 balın, boş kontrollerle birlikte stereomikroskopi ve FTIR spektroskopisiyle incelendiği laboratuvar çalışması. Örneklerin %93'ünde mikroplastik bulunmuş, özel ballarda miktar daha yüksek çıkmıştır (örnek başına 11,4'e karşı 4,9 partikül); partiküllerin çoğu 85-1.200 µm boyutunda, başta etilen-vinil asetat, PET ve polietilen olmak üzere parça formundadır. Baldan tahmini alım günde yalnızca 0,16-0,38 partikül olduğundan yazarlar balı başlıca bir maruziyet kaynağından çok, çevresel mikroplastik kirliliğinin ve hasat ile işleme sırasındaki kontaminasyonun bir göstergesi olarak değerlendirmektedir.",
        categories: ["honey"],
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12916803/"
      },
      {
        titleEn: "The Key Role of Amino Acids in Pollen Quality and Honey Bee Physiology (2024)",
        titleTr: "Amino Asitlerin Polen Kalitesi ve Bal Arısı Fizyolojisindeki Temel Rolü (2024)",
        date: "2026-09-04",
        summaryEn: "Review of how pollen protein and amino acid content shapes honey bee physiology, from how workers judge pollen quality to protein digestion and the use of amino acids for energy, brood rearing, royal jelly production and immunity. Protein content varies widely between plants, for example about 51% in aloe, 27% in rapeseed and phacelia and 11% in buckwheat, and colonies confined to monocultures or invasive goldenrod face a protein-poor single-source diet. Artificial diets based on soy, milk powder or egg yolk produce weaker colonies than natural pollen, and the authors call for studies linking pollen composition to hemolymph amino acids, overwintering and honey yield.",
        summaryTr: "Polenin protein ve amino asit içeriğinin bal arısı fizyolojisini nasıl şekillendirdiğini; işçi arıların polen kalitesini nasıl ayırt ettiğinden protein sindirimine ve amino asitlerin enerji, yavru yetiştirme, arı sütü üretimi ve bağışıklıktaki kullanımına kadar ele alan derleme. Protein oranı bitkiler arasında büyük farklılık göstermekte (örneğin aloede yaklaşık %51, kolza ve faselyada %27, karabuğdayda %11); monokültürlere veya istilacı altın başağa bağımlı kalan koloniler proteince fakir, tek kaynaklı bir beslenmeyle karşı karşıya kalmaktadır. Soya, süt tozu veya yumurta sarısına dayalı yapay diyetler doğal polene göre daha zayıf koloniler oluşturmakta; yazarlar polen bileşimini hemolenf amino asitleri, kışlama ve bal verimiyle ilişkilendiren çalışmalara ihtiyaç olduğunu vurgulamaktadır.",
        categories: ["pollen"],
        url: "https://www.mdpi.com/1420-3049/29/11/2605"
      },
      {
        titleEn: "Honey as a Neuroprotective Agent: Molecular Perspectives on Its Role in Alzheimer's Disease (2025)",
        titleTr: "Balın Nöroprotektif Ajan Olarak Rolü: Alzheimer Hastalığındaki Moleküler Perspektifler (2025)",
        date: "2026-08-28",
        summaryEn: "Review of the molecular mechanisms through which honey may protect against Alzheimer's disease, covering oxidative stress, mitochondrial dysfunction, inflammation, apoptosis, amyloid-β accumulation, tau hyperphosphorylation and acetylcholinesterase activity. Studies on avocado, manuka, acacia, kelulut, chestnut, coffee and tualang honeys show that effects depend on botanical origin. The evidence is almost entirely from cell cultures, C. elegans and rodents, often at high doses of up to 1 g/kg per day, and the authors found no completed or registered randomized human trial, so they describe the evidence as preliminary.",
        summaryTr: "Balın Alzheimer hastalığına karşı koruyucu olabileceği moleküler mekanizmaları; oksidatif stres, mitokondriyal işlev bozukluğu, inflamasyon, apoptoz, amiloid-β birikimi, tau hiperfosforilasyonu ve asetilkolinesteraz aktivitesi üzerinden inceleyen derleme. Avokado, manuka, akasya, kelulut, kestane, kahve ve tualang ballarıyla yapılan çalışmalar etkinin balın bitkisel kaynağına bağlı olduğunu göstermektedir. Kanıtların neredeyse tamamı hücre kültürleri, C. elegans ve kemirgenlerden, çoğu zaman günde 1 g/kg'a varan yüksek dozlarla elde edilmiştir; yazarlar tamamlanmış veya kayıtlı randomize bir insan çalışması bulamadıklarından kanıtları ön düzeyde olarak nitelendirmektedir.",
        categories: ["honey", "brain"],
        url: "https://www.mdpi.com/2072-6643/17/16/2577"
      },
      {
        titleEn: "Ethanol Extract of Propolis Relieves Exercise-Induced Fatigue via Modulating Metabolites and Gut Microbiota in Mice (2025)",
        titleTr: "Propolis Etanol Ekstresinin Metabolitler ve Bağırsak Mikrobiyotası Üzerindeki Modülatör Etkisiyle Egzersize Bağlı Yorgunluğu Azaltması (2025)",
        date: "2026-08-21",
        summaryEn: "Mouse study in which male C57BL/6 mice did 3 weeks of swim training with or without an ethanol propolis extract (400 mg/kg body weight; 10 mice per group), then swam to exhaustion. Propolis extended swimming time by 27.6%, limited the exercise-induced loss of liver and muscle glycogen, lowered blood lactate, urea nitrogen and inflammatory cytokines, and raised antioxidant enzymes, without changing body weight or food intake. Metabolomics and gut microbiota sequencing showed restored GABA, isoleucine and L-carnitine levels and more butyrate-producing bacteria; the active compounds and mechanisms in humans remain to be confirmed.",
        summaryTr: "Erkek C57BL/6 farelerin propolisin etanol ekstresiyle (400 mg/kg vücut ağırlığı; grup başına 10 fare) veya ekstre olmadan 3 hafta yüzme antrenmanı yaptığı ve ardından tükenene kadar yüzdürüldüğü hayvan çalışması. Propolis yüzme süresini %27,6 uzatmış, egzersize bağlı karaciğer ve kas glikojeni kaybını sınırlamış, kan laktatı, üre azotu ve inflamatuar sitokinleri düşürmüş ve antioksidan enzimleri artırmış; vücut ağırlığı ve yem tüketimini değiştirmemiştir. Metabolomik ve bağırsak mikrobiyotası analizleri GABA, izolösin ve L-karnitin düzeylerinin düzeldiğini ve bütirat üreten bakterilerin arttığını göstermiştir; etken bileşenlerin ve mekanizmaların insanlarda doğrulanması gerekmektedir.",
        categories: ["propolis", "exercise"],
        url: "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1549913/full"
      },
      {
        titleEn: "Royal Jelly Extracellular Vesicles Promote Wound Healing by Modulating Underlying Cellular Responses (2023)",
        titleTr: "Arı Sütü Ekstraselüler Vezikülleri Hücresel Yanıtları Modüle Ederek Yara İyileşmesini Destekler (2023)",
        date: "2026-08-14",
        summaryEn: "Laboratory and mouse study showing that royal jelly contains extracellular vesicles (about 130 nm, carrying exosome markers CD63 and syntenin and the cargo proteins MRJP1, defensin-1 and jellein-3) that cells take up. The vesicles changed mesenchymal stem cell differentiation and secretions, reduced inflammation in LPS-stimulated macrophages by blocking the MAPK pathway, showed antibacterial activity, and sped up wound closure in a splinted mouse wound model. The authors propose these vesicles explain part of royal jelly's known effects and, being easier to standardise than raw royal jelly, could move it closer to clinical use.",
        summaryTr: "Arı sütünün, hücrelerce alınan hücre dışı veziküller (yaklaşık 130 nm; CD63 ve sintenin ekzozom belirteçleri ile MRJP1, defensin-1 ve jellein-3 yük proteinlerini taşıyan) içerdiğini gösteren laboratuvar ve fare çalışması. Veziküller mezenkimal kök hücrelerin farklılaşmasını ve salgılarını değiştirmiş, LPS ile uyarılmış makrofajlarda MAPK yolağını baskılayarak inflamasyonu azaltmış, antibakteriyel etki göstermiş ve atelli fare yara modelinde yara kapanmasını hızlandırmıştır. Yazarlar bu veziküllerin arı sütünün bilinen etkilerinin bir kısmını açıkladığını ve ham arı sütüne göre daha kolay standardize edilebildikleri için klinik kullanıma daha yakın olduklarını öne sürmektedir.",
        categories: ["royal-jelly", "wound-healing"],
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9989319/"
      },
      {
        titleEn: "The Immunomodulatory Effects of Honey and Associated Flavonoids in Cancer (2021)",
        titleTr: "Balın ve İlişkili Flavonoidlerin Kanserde İmmünomodülatör Etkileri (2021)",
        date: "2026-08-07",
        summaryEn: "Review of in vitro and animal studies on how honey and its flavonoids, such as chrysin, quercetin, kaempferol and apigenin, influence the immune response to cancer. Honey can both trigger pro-inflammatory cytokine release from immune cells and suppress inflammation, and in tumour models it reduced angiogenesis and shifted immune cells toward an anti-tumour state; some flavonoids block IL-6 receptor signalling. No clinical trials are included, and the authors state that mechanisms must be clarified in suitable preclinical models before honey or its flavonoids can be tested as adjuncts to cancer immunotherapy.",
        summaryTr: "Bal ve krisin, kuersetin, kaempferol ve apigenin gibi flavonoidlerinin kansere karşı bağışıklık yanıtını nasıl etkilediğini in vitro ve hayvan çalışmaları üzerinden inceleyen derleme. Bal, bağışıklık hücrelerinden hem inflamasyon artırıcı sitokin salınımını tetikleyebilmekte hem de inflamasyonu baskılayabilmekte; tümör modellerinde damar oluşumunu azaltmış ve bağışıklık hücrelerini tümör karşıtı yönde değiştirmiştir; bazı flavonoidler IL-6 reseptör sinyalini engellemektedir. Derlemede klinik çalışma yer almamakta; yazarlar bal veya flavonoidlerinin kanser immünoterapisine destek olarak denenmesinden önce mekanizmaların uygun preklinik modellerde netleştirilmesi gerektiğini belirtmektedir.",
        categories: ["honey", "immunity"],
        url: "https://doi.org/10.3390/nu13041269"
      },
      {
        titleEn: "Detection of Serotonin, Melatonin, and Their Metabolites in Honey (2022)",
        titleTr: "Balda Serotonin, Melatonin ve Metabolitlerinin Tespiti (2022)",
        date: "2026-07-31",
        summaryEn: "Analytical chemistry study using LC-MS on five honeys: a natural Australian honey, two US commercial brands, and a natural and a commercial Polish honey. It reports for the first time serotonin, N-acetylserotonin, melatonin and 2-hydroxymelatonin in honey, along with their precursor tryptophan; melatonin reached 0.91 ng/g in the Australian honey, while serotonin ranged from 20.6 to 88.2 ng/g. Levels varied widely by source, and the authors note it is unclear whether amounts from moderate honey intake are enough to affect human health; they suggest the compounds may matter for bee development and colony function.",
        summaryTr: "Doğal bir Avustralya balı, iki ABD ticari markası ile doğal ve ticari birer Polonya balı olmak üzere beş balın LC-MS ile incelendiği analitik kimya çalışması. Balda ilk kez serotonin, N-asetilserotonin, melatonin ve 2-hidroksimelatonin ile öncülleri triptofan saptanmıştır; melatonin Avustralya balında 0,91 ng/g düzeyine ulaşırken serotonin 20,6-88,2 ng/g arasında bulunmuştur. Düzeyler kaynağa göre büyük farklılık göstermiş; yazarlar ölçülü bal tüketimiyle alınan miktarların insan sağlığını etkileyip etkilemediğinin belirsiz olduğunu belirtmekte, bu bileşiklerin arı gelişimi ve koloni işlevleri için önemli olabileceğini öne sürmektedir.",
        categories: ["honey", "brain"],
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9017714/"
      },
      {
        titleEn: "Bee Bread Attenuates Atherosclerosis by Activating Nrf2/Keap1 and Modulating TNF-α/NF-κβ-Associated Mast Cell Migration in an Obese Rat Model (2022)",
        titleTr: "Arı Ekmeğinin Obez Sıçan Modelinde Nrf2/Keap1 Aktivasyonu ve TNF-α/NF-κβ ile İlişkili Mast Hücre Migrasyonu Modülasyonu Yoluyla Aterosklerozla Mücadelesi (2022)",
        date: "2026-07-24",
        summaryEn: "Rat study in which 40 male Sprague-Dawley rats were made obese with a high-fat diet for 6 weeks and then received water, bee bread (0.5 g/kg/day) or the drug orlistat for another 6 weeks while continuing the diet. Bee bread reduced atherosclerotic changes in the aortic wall, strengthened the antioxidant Nrf2/Keap1 pathway, suppressed NF-κB-driven inflammation, raised the anti-apoptotic protein Bcl-2, and improved mast cell and collagen changes. The authors link part of the effect to bee bread's vitamins A, C and E; human data are not available.",
        summaryTr: "40 erkek Sprague-Dawley sıçanın 6 hafta yüksek yağlı diyetle obez hale getirildiği, ardından diyete devam ederken 6 hafta daha su, arı ekmeği (günde 0,5 g/kg) veya orlistat ilacı aldığı hayvan çalışması. Arı ekmeği aort duvarındaki aterosklerotik değişiklikleri azaltmış, antioksidan Nrf2/Keap1 yolağını güçlendirmiş, NF-κB kaynaklı inflamasyonu baskılamış, apoptozu önleyen Bcl-2 proteinini artırmış ve mast hücresi ile kolajen değişikliklerini iyileştirmiştir. Yazarlar etkinin bir kısmını arı ekmeğindeki A, C ve E vitaminlerine bağlamaktadır; insan verisi bulunmamaktadır.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["pollen", "immunity"],
        url: "https://doi.org/10.1039/D2FO00949H"
      },
      {
        titleEn: "Royal Jelly Supplementation Improves Endurance and Mitochondrial Biogenesis in Athletes: A Crossover Trial (2025)",
        titleTr: "Arı Sütü Takviyesinin Sporcularda Dayanıklılık ve Mitokondriyal Biyogenezi İyileştirmesi: Çapraz Geçişli Çalışma (2025)",
        date: "2026-07-17",
        summaryEn: "Double-blind, randomized, placebo-controlled crossover trial in 18 endurance-trained male athletes who took 1,000 mg/day of lyophilised royal jelly or placebo for 2 weeks each, separated by a 2-week washout. Compared with placebo, royal jelly lengthened time to exhaustion in a running test by 4.6 minutes and increased expression of PGC-1α, a regulator of mitochondrial biogenesis, but did not change Nrf2 expression, most oxidative stress markers, perceived exertion or heart rate. The authors note the small sample, the single athlete population and the lack of muscle biopsies to confirm the proposed mitochondrial mechanism.",
        summaryTr: "Dayanıklılık antrenmanı yapan 18 erkek sporcunun 2'şer hafta boyunca günde 1.000 mg liyofilize arı sütü veya plasebo aldığı, aralarında 2 haftalık arınma dönemi bulunan çift kör, randomize, plasebo kontrollü çapraz çalışma. Arı sütü, plaseboya kıyasla koşu testinde tükenme süresini 4,6 dakika uzatmış ve mitokondri biyogenezini düzenleyen PGC-1α ifadesini artırmış; ancak Nrf2 ifadesini, oksidatif stres belirteçlerinin çoğunu, algılanan zorluk düzeyini ve kalp hızını değiştirmemiştir. Yazarlar küçük örneklemi, tek bir sporcu grubunun incelenmesini ve öne sürülen mitokondriyal mekanizmayı doğrulayacak kas biyopsisinin yapılmamasını sınırlılık olarak belirtmektedir.",
        categories: ["royal-jelly", "exercise"],
        url: "https://doi.org/10.1002/fsn3.70497"
      },
      {
        titleEn: "Artepillin C-Rich Propolis Extract Supplementation Promotes Muscle Recovery Following Exercise-Induced Muscle Damage in Resistance-Trained Young Females: A Randomized, Placebo-Controlled Trial (2025)",
        titleTr: "Artepillin C Açısından Zengin Propolis Ekstresi Takviyesinin Direnç Antrenmanı Yapan Genç Kadınlarda Egzersize Bağlı Kas Hasarı Sonrası Toparlanma Üzerine Etkisi: Randomize, Plasebo Kontrollü Çalışma (2025)",
        date: "2026-07-10",
        summaryEn: "Randomized, placebo-controlled trial in 22 resistance-trained young women who took a standardised Brazilian green propolis extract (about 54 mg artepillin C per day) or placebo for 7 days, with an eccentric knee-extensor exercise bout on day 4 to cause muscle damage. Compared with placebo, propolis reduced delayed-onset muscle soreness, limited muscle swelling and ultrasound echo-intensity changes, and sped up recovery of maximal strength over 72 hours, with no side effects reported. Blood markers of inflammation and oxidative stress were not measured, which the authors list as a limitation.",
        summaryTr: "Direnç antrenmanı yapan 22 genç kadının 7 gün boyunca standardize Brezilya yeşil propolis ekstresi (günde yaklaşık 54 mg artepilin C) veya plasebo aldığı ve 4. günde kas hasarı oluşturmak için eksantrik diz ekstansiyonu egzersizi yaptığı randomize, plasebo kontrollü çalışma. Propolis, plaseboya kıyasla gecikmiş kas ağrısını azaltmış, kas şişmesini ve ultrason eko yoğunluğundaki değişimi sınırlamış ve 72 saat içinde maksimal kuvvetin toparlanmasını hızlandırmış; yan etki bildirilmemiştir. Kandaki inflamasyon ve oksidatif stres belirteçleri ölçülmemiş olup yazarlar bunu bir sınırlılık olarak belirtmektedir.",
        categories: ["propolis", "exercise"],
        url: "https://doi.org/10.1080/15502783.2025.2569908"
      },
      {
        titleEn: "Anti-Inflammatory Potential of Royal Jelly in Multiple Sclerosis Disease: A Double Randomized Clinical Trial (2025)",
        titleTr: "Multipl Sklerozda Arı Sütünün Anti-İnflamatuar Potansiyeli: Çift Kör Randomize Klinik Çalışma (2025)",
        date: "2026-07-03",
        summaryEn: "Randomized, placebo-controlled trial in 35 people with multiple sclerosis (19 given 500 mg royal jelly daily, 16 given placebo) for 2 months. In the royal jelly group, disability scores (EDSS) fell slightly, from 3.13 to 2.92, and IL-1β, IL-6, TNF, interferon, nitric oxide and malondialdehyde decreased while catalase increased; in the placebo group malondialdehyde rose. Most comparisons were made within each group before and after treatment rather than between groups, the sample was small and the follow-up short, so the results are best read as preliminary.",
        summaryTr: "Multipl sklerozlu 35 hastanın 2 ay boyunca günde 500 mg arı sütü (19 kişi) veya plasebo (16 kişi) aldığı randomize, plasebo kontrollü çalışma. Arı sütü grubunda engellilik skoru (EDSS) 3,13'ten 2,92'ye hafifçe düşmüş; IL-1β, IL-6, TNF, interferon, nitrik oksit ve malondialdehit azalırken katalaz artmış, plasebo grubunda ise malondialdehit yükselmiştir. Karşılaştırmaların çoğu gruplar arasında değil her grubun kendi içinde tedavi öncesi ve sonrası yapılmış, örneklem küçük ve takip kısa tutulmuştur; bu nedenle sonuçlar ön bulgular olarak değerlendirilmelidir.",
        categories: ["royal-jelly", "immunity"],
        url: "https://doi.org/10.1097/MS9.0000000000002967"
      },
      {
        titleEn: "Antimicrobial Activity of Bee Pollen: Influence of Botanical Origin and Processing (2026)",
        titleTr: "Arı Poleninin Antimikrobiyal Aktivitesi: Botanik Köken ve İşlemenin Etkisi (2026)",
        date: "2026-06-26",
        summaryEn: "Review of laboratory studies on the antimicrobial activity of monofloral bee pollen, most often from sunflower, oilseed rape, clover and chestnut. Gram-positive bacteria, especially Staphylococcus aureus, were consistently more sensitive than Gram-negative ones, and results depended strongly on botanical and geographical origin, season, extraction solvent and test method. The tough outer pollen wall (exine) limits release of active compounds; processing such as freeze-drying gave stronger activity than conventional drying but is costly for industry. The authors call for species-specific quality standards and comparable test methods.",
        summaryTr: "Çoğunlukla ayçiçeği, kolza, yonca ve kestaneden elde edilen tek çiçekli (monofloral) arı poleninin antimikrobiyal etkisini inceleyen laboratuvar çalışmalarının derlemesi. Gram-pozitif bakteriler, özellikle Staphylococcus aureus, Gram-negatiflere göre tutarlı biçimde daha duyarlı bulunmuş; sonuçlar bitkisel ve coğrafi köken, mevsim, ekstraksiyon çözücüsü ve test yöntemine güçlü biçimde bağlı kalmıştır. Polenin dayanıklı dış duvarı (ekzin) etken maddelerin salınımını sınırlamakta; dondurarak kurutma gibi işlemler geleneksel kurutmaya göre daha güçlü etki sağlamış, ancak endüstri için maliyetlidir. Yazarlar türe özgü kalite standartları ve karşılaştırılabilir test yöntemleri geliştirilmesi çağrısında bulunmaktadır.",
        categories: ["pollen", "immunity"],
        url: "https://doi.org/10.17113/ftb.64.01.26.9421"
      },
      {
        titleEn: "Anti-Inflammatory and Wound Healing Properties of Different Honey Varieties from Romania and Correlations to Their Composition (2024)",
        titleTr: "Romanya Bal Çeşitlerinin Anti-İnflamatuar ve Yara İyileştirici Özellikleri ile Kimyasal Bileşimleriyle İlişkileri (2024)",
        date: "2026-06-19",
        summaryEn: "In vitro study of seven Romanian honeys (including honeydew, linden, sunflower and multifloral) tested on human macrophage-like cells, fibroblasts and keratinocytes. Effects differed by variety: honeydew honey lowered TNF-α by about 12% and IL-8 by about 11% in inflamed macrophages, while some multifloral honeys slightly raised TNF-α; several honeys boosted fibroblast growth, collagen synthesis and keratinocyte migration in a dose-dependent way. Activity correlated strongly with total phenolic content and only weakly with sugars, and the authors propose phenolic content as a quality marker for honey-based wound dressings, pending animal and clinical testing.",
        summaryTr: "Aralarında salgı balı, ıhlamur, ayçiçeği ve çok çiçekli ballar bulunan yedi Romanya balının insan makrofaj benzeri hücreleri, fibroblastlar ve keratinositler üzerinde test edildiği in vitro çalışma. Etkiler bal türüne göre farklılık göstermiştir: salgı balı inflamasyonlu makrofajlarda TNF-α'yı yaklaşık %12, IL-8'i yaklaşık %11 azaltırken bazı çok çiçekli ballar TNF-α'yı hafifçe artırmış; birçok bal fibroblast çoğalmasını, kolajen sentezini ve keratinosit göçünü doza bağlı olarak artırmıştır. Etkinlik toplam fenolik içerikle güçlü, şekerlerle zayıf ilişki göstermiş; yazarlar hayvan ve klinik çalışmalarla doğrulanmak üzere fenolik içeriği bal bazlı yara örtüleri için bir kalite ölçütü olarak önermektedir.",
        categories: ["honey", "wound-healing"],
        url: "https://doi.org/10.3390/life14091187"
      },
      {
        titleEn: "Bee Pollen as a Source of Biopharmaceuticals for Neurodegeneration and Cancer Research: A Scoping Review and Translational Prospects (2024)",
        titleTr: "Nörodejenerasyon ve Kanser Araştırmaları için Biyofarmasötik Kaynağı Olarak Arı Poleni: Bir Kapsam Taraması ve Çeviri Perspektifleri (2024)",
        date: "2026-06-12",
        summaryEn: "Scoping review of 421 publications on bee pollen compounds and the biological processes shared by neurodegeneration and cancer, such as oxidative stress, inflammation, mitochondrial dysfunction and abnormal cell death. Many individual pollen constituents, mainly flavonoids, phenolic acids and other phytochemicals, act on these processes in cell and animal studies, but only a small number of floral pollen sources have been studied as whole products. The authors list low bioavailability, lack of chemical standardisation and scattered, uncoordinated experimental designs as the main obstacles, and note that clinical evidence is still missing.",
        summaryTr: "Arı poleni bileşenleri ile nörodejenerasyon ve kanserde ortak olan oksidatif stres, inflamasyon, mitokondriyal işlev bozukluğu ve anormal hücre ölümü gibi biyolojik süreçlere ilişkin 421 yayını kapsayan kapsam derlemesi. Başta flavonoidler ve fenolik asitler olmak üzere polenin pek çok bileşeni hücre ve hayvan çalışmalarında bu süreçleri etkilemekte, ancak bütün bir ürün olarak yalnızca az sayıda çiçek kaynaklı polen incelenmiş bulunmaktadır. Yazarlar düşük biyoyararlanımı, kimyasal standardizasyon eksikliğini ve dağınık, eşgüdümsüz deney tasarımlarını başlıca engeller olarak sıralamakta ve klinik kanıtın henüz bulunmadığını belirtmektedir.",
        categories: ["pollen", "brain"],
        url: "https://doi.org/10.3390/molecules29245893"
      },
      {
        titleEn: "Effect of a Honey-Sweetened Beverage on Muscle Soreness and Recovery After Exercise-Induced Muscle Damage in Strength-Trained Females (2024)",
        titleTr: "Bal ile Tatlandırılmış İçeceğin Kuvvet Antrenmanlı Kadınlarda Egzersize Bağlı Kas Hasarı Sonrası Kas Ağrısı ve Toparlanma Üzerine Etkisi (2024)",
        date: "2026-06-05",
        summaryEn: "Double-blind, randomized, placebo-controlled crossover study in 16 strength-trained women who drank 70 g of honey in 250 mL of water, or an artificially sweetened placebo, 90 minutes before 200 weighted vertical jumps designed to cause muscle damage. Compared with placebo, the honey drink reduced muscle soreness at every time point up to 48 hours, improved wall-sit endurance and leg-press 1RM, and lowered perceived exertion, but did not change jump height, flexibility or pain threshold. The placebo contained no carbohydrate, and the authors note that no blood markers of muscle damage were measured.",
        summaryTr: "Kuvvet antrenmanı yapan 16 kadının, kas hasarı oluşturmak için yapılan 200 ağırlıklı dikey sıçramadan 90 dakika önce 250 mL suda 70 g bal ya da yapay tatlandırıcılı plasebo içtiği çift kör, randomize, plasebo kontrollü çapraz çalışma. Ballı içecek plaseboya kıyasla 48 saate kadar tüm ölçümlerde kas ağrısını azaltmış, duvarda oturma dayanıklılığını ve bacak presi 1TM değerini artırmış, algılanan zorluğu düşürmüş; ancak sıçrama yüksekliği, esneklik ve ağrı eşiğini değiştirmemiştir. Plasebo karbonhidrat içermediği ve kas hasarına ilişkin kan belirteçleri ölçülmediği için sonuçlar dikkatle yorumlanmalıdır.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.3389/fphys.2024.1426872"
      },
      {
        titleEn: "Effect of Honey Supplementation on Skeletal Muscle Inflammatory Markers Among Military Graduates After Overtraining (2025)",
        titleTr: "Bal Takviyesinin Aşırı Antrenman Sonrası Askeri Mezunlarda İskelet Kası İnflamatuar Belirteçleri Üzerine Etkisi (2025)",
        date: "2026-05-28",
        summaryEn: "Randomized, double-blind, placebo-controlled trial in 42 overtrained male military graduates (mean age about 21) who took 5 mL of a 12% milk-vetch (Astragalus) honey solution twice daily or placebo for 6 weeks. Inflammatory and muscle-damage markers rose in both groups during training, but the increases in CRP, TNF-α, aldolase A and creatine kinase were significantly smaller with honey; the TNF-α rise in the placebo group was about twice that of the honey group. The authors note the small, single-sex sample, the 6-week duration and the lack of performance, body composition and blood sugar measurements.",
        summaryTr: "Aşırı antrenman yapmış 42 erkek askeri mezunun (ortalama yaş yaklaşık 21) 6 hafta boyunca günde iki kez 5 mL %12'lik geven (Astragalus) balı çözeltisi veya plasebo aldığı randomize, çift kör, plasebo kontrollü çalışma. İnflamasyon ve kas hasarı belirteçleri her iki grupta da antrenman boyunca yükselmiş, ancak CRP, TNF-α, aldolaz A ve kreatin kinazdaki artış bal grubunda anlamlı ölçüde daha küçük kalmıştır; plasebo grubundaki TNF-α artışı bal grubunun yaklaşık iki katıdır. Yazarlar küçük ve tek cinsiyetten oluşan örneklemi, 6 haftalık süreyi ve performans, vücut kompozisyonu ile kan şekerinin ölçülmemesini sınırlılık olarak belirtmektedir.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.1002/hsr2.70428"
      },
      {
        titleEn: "Could It Bee? Honey Ingestion Induces Comparable Metabolic Responses to Traditional Carbohydrates During Steady-State Cycling (2025)",
        titleTr: "Bal Olabilir mi? Bal Tüketimi Dengeli Bisiklet Sürüşü Sırasında Geleneksel Karbonhidratlara Benzer Metabolik Yanıtlar Oluşturur (2025)",
        date: "2026-05-20",
        summaryEn: "Randomized crossover trial in 12 trained men who cycled for 180 minutes at a steady pace while taking 90 g of carbohydrate per hour either as honey or as a conventional sports carbohydrate product, followed by a time-to-fatigue test. Carbohydrate and fat oxidation, endurance capacity, breath hydrogen and gastrointestinal symptoms did not differ between honey and the sports product, and severe gut symptoms were rare. The authors conclude honey can be an alternative fuelling option during long exercise; the study was small and included only men.",
        summaryTr: "12 antrenmanlı erkeğin 180 dakika sabit tempoda bisiklet sürerken saatte 90 g karbonhidratı bal veya geleneksel bir spor karbonhidrat ürünü olarak aldığı, ardından yorgunluğa kadar süre testine girdiği randomize çapraz çalışma. Karbonhidrat ve yağ oksidasyonu, dayanıklılık kapasitesi, nefeste hidrojen ve sindirim semptomları bal ile spor ürünü arasında farklılık göstermemiş, ciddi sindirim şikâyetleri nadir görülmüştür. Yazarlar balın uzun egzersizde alternatif bir enerji kaynağı olabileceği sonucuna varmaktadır; çalışma küçük ölçekli ve yalnızca erkeklerle yapılmıştır.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.1123/ijsnem.2024-0244"
      },
      {
        titleEn: "Carbohydrates and Endurance Exercise: A Narrative Review of a Food First Approach (2023)",
        titleTr: "Karbonhidratlar ve Dayanıklılık Egzersizi: Önce Gıda Yaklaşımının Anlatısal Bir Derlemesi (2023)",
        date: "2026-05-12",
        summaryEn: "Narrative review of a \"food first\" approach to carbohydrate intake for endurance athletes, comparing whole foods with commercial gels, bars and drinks before, during and after exercise. Lentils, oats, honey, raisins, rice and potatoes all worked as pre-exercise carbohydrate sources, while honey, raisins and bananas were the most practical during exercise because they are easy to carry; high-glycaemic foods suit rapid glycogen recovery afterwards. Bulky foods can cause gastrointestinal discomfort, and the authors stress that evidence is limited by small samples, water-only controls, mostly recreational athletes and mainly cycling protocols.",
        summaryTr: "Dayanıklılık sporcularında karbonhidrat alımında \"önce gıda\" yaklaşımını inceleyen ve tam gıdaları egzersiz öncesi, sırası ve sonrasında ticari jel, bar ve içeceklerle karşılaştıran anlatısal derleme. Mercimek, yulaf, bal, kuru üzüm, pirinç ve patates egzersiz öncesi karbonhidrat kaynağı olarak etkili bulunmuş; egzersiz sırasında taşınması kolay olan bal, kuru üzüm ve muz en pratik seçenekler olarak öne çıkmış, yüksek glisemik indeksli gıdalar ise egzersiz sonrası hızlı glikojen yenilenmesine uygun görülmüştür. Hacimli gıdalar sindirim rahatsızlığına yol açabilmekte; yazarlar kanıtların küçük örneklemler, yalnızca su içilen kontrol koşulları, ağırlıklı olarak amatör sporcular ve bisiklet protokolleriyle sınırlı olduğunu vurgulamaktadır.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.3390/nu15061367"
      },
      {
        titleEn: "Honey on Brain Health: A Promising Brain Booster (2023)",
        titleTr: "Beyin Sağlığında Bal: Umut Verici Bir Beyin Güçlendirici (2023)",
        date: "2026-05-04",
        summaryEn: "Review of 34 original human and animal studies on honey and brain health, grouped into four areas: memory, neuroprotection, stress reduction and pain relief. Most evidence comes from rodent models, for example prenatally stressed rats in which honey lowered oxidative stress markers and preserved hippocampal neurons, and the review attributes the effects to phenolic acids and flavonoids such as luteolin, kaempferol and apigenin acting through antioxidant, anti-inflammatory, cholinergic and BDNF pathways. The authors note that human studies are scarce, so the proposed mechanisms remain largely preclinical.",
        summaryTr: "Bal ve beyin sağlığı üzerine 34 özgün insan ve hayvan çalışmasını bellek, nöroproteksiyon, stres azaltma ve ağrı giderme olmak üzere dört başlıkta toplayan derleme. Kanıtların çoğu kemirgen modellerinden gelmekte (örneğin doğum öncesi strese maruz kalan sıçanlarda bal oksidatif stres belirteçlerini düşürmüş ve hipokampus nöronlarını korumuştur); derleme etkileri luteolin, kaempferol ve apigenin gibi flavonoidler ile fenolik asitlerin antioksidan, anti-inflamatuar, kolinerjik ve BDNF yolakları üzerinden etkisine bağlamaktadır. Yazarlar insan çalışmalarının az olduğunu, dolayısıyla önerilen mekanizmaların büyük ölçüde preklinik düzeyde kaldığını belirtmektedir.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.3389/fnagi.2022.1092596"
      },
      {
        titleEn: "The Potential Use of Honey as a Neuroprotective Agent for the Management of Neurodegenerative Diseases (2023)",
        titleTr: "Nörodejeneratif Hastalıkların Yönetiminde Nöroprotektif Ajan Olarak Balın Potansiyel Kullanımı (2023)",
        date: "2026-04-26",
        summaryEn: "Review of 16 studies from 2012 to 2022 on honey in neurodegenerative disease: six in vitro, eight animal, one combined and a single human intervention, which tested honey with cinnamon in Parkinson's disease. Tualang and thyme honeys showed the strongest antioxidant, anti-inflammatory and anticholinesterase activity, mainly in Alzheimer's models, and the effects were linked to polyphenols, especially quercetin and gallic acid. Because only one intervention study exists, the authors conclude the evidence is not yet sufficient to show that honey slows neurodegeneration in people.",
        summaryTr: "Balın nörodejeneratif hastalıklardaki rolüne ilişkin 2012-2022 arasındaki 16 çalışmayı inceleyen derleme: altı in vitro, sekiz hayvan, bir birleşik çalışma ve Parkinson hastalığında bal ile tarçını test eden tek bir insan müdahale çalışması. En güçlü antioksidan, anti-inflamatuar ve antikolinesteraz etkiyi ağırlıklı olarak Alzheimer modellerinde Tualang ve kekik balları göstermiş; etkiler başta kuersetin ve gallik asit olmak üzere polifenollere bağlanmıştır. Yalnızca bir müdahale çalışması bulunduğundan yazarlar, balın insanlarda nörodejenerasyonu yavaşlattığını göstermek için kanıtların henüz yeterli olmadığı sonucuna varmaktadır.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.3390/nu15071558"
      },
      {
        titleEn: "Honey as a Neuroprotective Agent: Molecular Perspectives on Its Role in Alzheimer's Disease (2025)",
        titleTr: "Nöroprotektif Ajan Olarak Bal: Alzheimer Hastalığındaki Rolüne Moleküler Bakış (2025)",
        date: "2026-04-18",
        summaryEn: "Review of the molecular mechanisms through which honey may protect against Alzheimer's disease, covering oxidative stress, mitochondrial dysfunction, inflammation, apoptosis, amyloid-β accumulation, tau hyperphosphorylation and acetylcholinesterase activity. Studies on avocado, manuka, acacia, kelulut, chestnut, coffee and tualang honeys show that effects depend on botanical origin. The evidence is almost entirely from cell cultures, C. elegans and rodents, often at high doses of up to 1 g/kg per day, and the authors found no completed or registered randomized human trial, so they describe the evidence as preliminary.",
        summaryTr: "Balın Alzheimer hastalığına karşı koruyucu olabileceği moleküler mekanizmaları; oksidatif stres, mitokondriyal işlev bozukluğu, inflamasyon, apoptoz, amiloid-β birikimi, tau hiperfosforilasyonu ve asetilkolinesteraz aktivitesi üzerinden inceleyen derleme. Avokado, manuka, akasya, kelulut, kestane, kahve ve tualang ballarıyla yapılan çalışmalar etkinin balın bitkisel kaynağına bağlı olduğunu göstermektedir. Kanıtların neredeyse tamamı hücre kültürleri, C. elegans ve kemirgenlerden, çoğu zaman günde 1 g/kg'a varan yüksek dozlarla elde edilmiştir; yazarlar tamamlanmış veya kayıtlı randomize bir insan çalışması bulamadıklarından kanıtları ön düzeyde olarak nitelendirmektedir.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.3390/nu17162577"
      },
      {
        titleEn: "Comparative Neuroprotective Effects of Royal Jelly and 10-Hydroxy-2-Decenoic Acid on Ischemia-Induced Inflammatory, Apoptotic, Epigenetic and Genotoxic Changes in a Rat Model of Ischemic Stroke (2024)",
        titleTr: "Arı Sütü ve 10-Hidroksi-2-Dekenoik Asidin İskemik İnme Sıçan Modelinde İskemiye Bağlı İnflamatuar, Apoptotik, Epigenetik ve Genotoksik Değişiklikler Üzerindeki Karşılaştırmalı Nöroprotektif Etkileri (2024)",
        date: "2026-04-10",
        summaryEn: "Rat study comparing royal jelly with its main fatty acid, 10-HDA, after experimentally induced ischaemic stroke (middle cerebral artery occlusion), each given daily for 7 days from the day of surgery. Both reduced brain infarct size and weight loss, lowered the cell-death markers caspase-3 and PARP-1, increased histone acetylation, and reduced DNA damage in brain tissue and blood lymphocytes; royal jelly raised acetyl-histone H3 more strongly than 10-HDA alone. The authors conclude that royal jelly's protective effect in experimental stroke comes largely from 10-HDA.",
        summaryTr: "Deneysel olarak oluşturulan iskemik inmede (orta serebral arter tıkanması) arı sütünü ana yağ asidi 10-HDA ile karşılaştıran ve her ikisinin ameliyat gününden itibaren 7 gün boyunca günlük verildiği sıçan çalışması. Her ikisi de beyin enfarktüs alanını ve kilo kaybını azaltmış, hücre ölümü belirteçleri kaspaz-3 ve PARP-1'i düşürmüş, histon asetilasyonunu artırmış ve beyin dokusu ile kan lenfositlerindeki DNA hasarını azaltmıştır; arı sütü asetil-histon H3'ü 10-HDA'dan daha güçlü artırmıştır. Yazarlar arı sütünün deneysel inmedeki koruyucu etkisinin büyük ölçüde 10-HDA'dan kaynaklandığı sonucuna varmaktadır.",
        summaryBasis: "abstract", // paywalled: summary based on the abstract only
        categories: ["royal-jelly", "brain"],
        url: "https://www.tandfonline.com/doi/abs/10.1080/1028415X.2024.2344141"
      },
      {
        titleEn: "Pro-Cognitive Effect of Royal Jelly Is Linked with Increased Burst Activity of Mesocorticolimbic Dopaminergic Neurons (2025)",
        titleTr: "Arı Sütünün Bilişsel Etkisi, Mezokortikolimbik Dopaminerjik Nöronların Artan Aktivitesiyle İlişkilidir (2025)",
        date: "2026-04-02",
        summaryEn: "Rat study in which adult male Wistar rats received royal jelly for two weeks before a novel object recognition test and in vivo recordings of brain monoamine neurons. Treated rats had higher recognition and discrimination indices than controls, with no weight loss or change in food intake, and dopaminergic neurons of the ventral tegmental area fired more often in bursts, while serotonin and noradrenaline neurons were unchanged. The authors link royal jelly's pro-cognitive effect to the mesolimbic dopamine system but could not identify which component is responsible; tyrosine, a dopamine precursor, is one candidate.",
        summaryTr: "Yetişkin erkek Wistar sıçanlarına iki hafta boyunca arı sütü verildikten sonra yeni nesne tanıma testi ve beyindeki monoamin nöronlarının canlı kayıtlarının yapıldığı hayvan çalışması. Arı sütü alan sıçanlarda tanıma ve ayırt etme indeksleri kontrollere göre daha yüksek bulunmuş, kilo kaybı veya yem tüketiminde değişim görülmemiş; ventral tegmental alandaki dopaminerjik nöronlar daha sık patlama tarzı ateşleme yaparken serotonin ve noradrenalin nöronları değişmemiştir. Yazarlar arı sütünün bilişsel etkisini mezolimbik dopamin sistemine bağlamakla birlikte sorumlu bileşeni belirleyememiştir; dopaminin öncülü olan tirozin olası adaylardan biridir.",
        categories: ["royal-jelly", "brain"],
        url: "https://doi.org/10.3390/nu17223593"
      },
      {
        titleEn: "Royal Jelly Mitigates Cognitive Decline and Anxiety in Female Mice: A Neuroprotective Solution for Alzheimer's Disease (2026)",
        titleTr: "Arı Sütü Dişi Farelerde Bilişsel Gerileme ve Anksiyeteyi Azaltır: Alzheimer Hastalığı için Nöroprotektif Bir Çözüm (2026)",
        date: "2026-03-25",
        summaryEn: "In vivo study demonstrating that royal jelly reduces cognitive decline and anxiety in a female mouse model of Alzheimer's disease.",
        summaryTr: "Arı sütünün Alzheimer hastalığının dişi fare modelinde bilişsel gerilemeyi ve anksiyeteyi azalttığını gösteren in vivo çalışma.",
        summaryBasis: "unverified", // MDPI page blocks automated access; summary not yet checked against the paper
        categories: ["royal-jelly", "brain"],
        url: "https://doi.org/10.3390/compounds6010008"
      },
      {
        titleEn: "Immunomodulatory and Anti-Inflammatory Properties of Honey and Bee Products (2025)",
        titleTr: "Bal ve Arı Ürünlerinin İmmünomodülatör ve Anti-İnflamatuar Özellikleri (2025)",
        date: "2026-03-17",
        summaryEn: "Review of the immunomodulatory and anti-inflammatory properties shared across honey, propolis, royal jelly, and bee pollen.",
        summaryTr: "Bal, propolis, arı sütü ve arı poleninin ortak immünomodülatör ve anti-inflamatuar özelliklerini inceleyen derleme.",
        summaryBasis: "unverified", // MDPI page blocks automated access; summary not yet checked against the paper
        categories: ["honey", "propolis", "royal-jelly", "pollen", "immunity"],
        url: "https://www.mdpi.com/2673-5601/5/2/19"
      },
      {
        titleEn: "Propolis Supplementation on Inflammatory and Oxidative Stress Biomarkers: A Systematic Review and Meta-Analysis of RCTs (2025)",
        titleTr: "İnflamatuar ve Oksidatif Stres Biyobelirteçleri Üzerine Propolis Takviyesi: RCT'lerin Sistematik Derlemesi ve Meta-Analizi (2025)",
        date: "2026-03-09",
        summaryEn: "Systematic review and meta-analysis of 27 randomized controlled trials (29 treatment arms, 1,539 adults, 2003 to 2023), mostly in people with conditions such as type 2 diabetes, fatty liver disease, kidney disease or rheumatoid arthritis. Propolis lowered CRP (by 1.23 mg/L), IL-6, TNF-α and MCP-1 and raised total antioxidant capacity, glutathione and glutathione peroxidase, but had no significant effect on IL-2, IL-8, IL-10, malondialdehyde or superoxide dismutase. The authors flag differences in dose, form, duration and participants as sources of heterogeneity and call for trials to establish the best dose and duration.",
        summaryTr: "Çoğu tip 2 diyabet, yağlı karaciğer, böbrek hastalığı veya romatoid artrit gibi rahatsızlıkları olan yetişkinlerde yürütülmüş 27 randomize kontrollü çalışmanın (29 tedavi kolu, 1.539 kişi, 2003-2023) sistematik derlemesi ve meta-analizi. Propolis CRP'yi (1,23 mg/L), IL-6, TNF-α ve MCP-1'i düşürmüş; toplam antioksidan kapasite, glutatyon ve glutatyon peroksidazı artırmış, ancak IL-2, IL-8, IL-10, malondialdehit ve süperoksit dismutaz üzerinde anlamlı etki göstermemiştir. Yazarlar doz, form, süre ve katılımcı farklılıklarını heterojenlik kaynağı olarak belirtmekte ve en uygun doz ile sürenin belirlenmesi için yeni çalışmalar önermektedir.",
        categories: ["propolis", "immunity"],
        url: "https://doi.org/10.3389/fnut.2025.1542184"
      },
      {
        titleEn: "Antimicrobial Potential of Bee-Derived Products: Honey, Propolis and Bee Venom (2025)",
        titleTr: "Arı Kaynaklı Ürünlerin Antimikrobiyal Potansiyeli: Bal, Propolis ve Arı Zehri (2025)",
        date: "2026-03-01",
        summaryEn: "Review of the antibacterial, antiviral and antifungal activity of honey, propolis and bee venom, describing their chemical composition and mechanisms such as hydrogen peroxide, methylglyoxal, osmotic effects, flavonoids and the membrane-disrupting peptide melittin. The review covers activity against multidrug-resistant microbes, synergy with conventional antibiotics and the established use of honey in wound care. It also discusses obstacles to medical use, including variable composition, lack of standardisation, regulatory barriers and allergy risk, and concludes that standardised products and clinical trials are needed.",
        summaryTr: "Bal, propolis ve arı zehirinin antibakteriyel, antiviral ve antifungal etkilerini; kimyasal bileşimleri ile hidrojen peroksit, metilglioksal, ozmotik etki, flavonoidler ve hücre zarını bozan melittin peptidi gibi etki mekanizmaları üzerinden inceleyen derleme. Derleme çoklu ilaca dirençli mikroorganizmalara karşı etkinliği, geleneksel antibiyotiklerle sinerjiyi ve balın yara bakımındaki yerleşik kullanımını ele almaktadır. Ayrıca değişken bileşim, standardizasyon eksikliği, mevzuat engelleri ve alerji riski gibi tıbbi kullanımın önündeki engelleri tartışmakta; standardize ürünlere ve klinik çalışmalara ihtiyaç olduğu sonucuna varmaktadır.",
        categories: ["honey", "propolis", "immunity"],
        url: "https://doi.org/10.3390/pathogens14080780"
      },
      {
        titleEn: "Royal Jelly: A Promising Therapeutic Intervention and Functional Food Supplement (2024)",
        titleTr: "Arı Sütü: Umut Verici Bir Terapötik Müdahale ve Fonksiyonel Gıda Takviyesi (2024)",
        date: "2026-02-21",
        summaryEn: "Systematic review of studies published from 2000 to April 2024 on royal jelly's composition, health effects and mechanisms. Its proteins (MRJPs), peptides, fatty acids such as 10-HDA and flavonoids are linked to anti-inflammatory, antioxidant, antimicrobial and anti-ageing effects, with reported benefits for wound healing, immune function, diabetes and cardiovascular risk acting through NF-κB, MAPK and AMPK signalling. The authors note that much of the evidence is preclinical, large controlled human trials are few, composition varies with bee and diet, and standard doses and long-term safety data are still lacking.",
        summaryTr: "2000'den Nisan 2024'e kadar yayımlanan, arı sütünün bileşimi, sağlık etkileri ve mekanizmalarına ilişkin çalışmaları inceleyen sistematik derleme. Proteinleri (MRJP'ler), peptitleri, 10-HDA gibi yağ asitleri ve flavonoidleri anti-inflamatuar, antioksidan, antimikrobiyal ve yaşlanma karşıtı etkilerle ilişkilendirilmekte; yara iyileşmesi, bağışıklık, diyabet ve kardiyovasküler risk üzerindeki bildirilen yararların NF-κB, MAPK ve AMPK sinyal yolakları aracılığıyla gerçekleştiği belirtilmektedir. Yazarlar kanıtların önemli kısmının preklinik olduğunu, büyük kontrollü insan çalışmalarının az sayıda kaldığını, bileşimin arı ve beslenmeye göre değiştiğini ve standart doz ile uzun dönem güvenlik verilerinin hâlâ eksik olduğunu belirtmektedir.",
        categories: ["royal-jelly", "immunity", "wound-healing"],
        url: "https://doi.org/10.1016/j.heliyon.2024.e37138"
      },
      {
        titleEn: "Unlocking the Healing Potential: Medical-Grade Honey in Wound Management and Tissue Regeneration (2025)",
        titleTr: "İyileştirici Potansiyeli Açığa Çıkarmak: Yara Yönetimi ve Doku Rejenerasyonunda Tıbbi Sınıf Bal (2025)",
        date: "2026-02-13",
        summaryEn: "Narrative review drawing on 167 selected publications about medical-grade honey in wound care, including how botanical origin shapes its antibacterial, anti-inflammatory and regenerative properties. Honey-based products performed well in chronic and burn wounds in several studies, lowering infection rates and shortening hospital stays, but other trials found no significant difference from conventional dressings. The authors describe the clinical evidence as mixed, attribute much of the inconsistency to variable honey composition and potency, and call for standardised products and further clinical studies.",
        summaryTr: "Seçilen 167 yayına dayanarak tıbbi sınıf balın yara bakımındaki kullanımını ve bitkisel kökenin antibakteriyel, anti-inflamatuar ve doku yenileyici özellikleri nasıl etkilediğini inceleyen anlatısal derleme. Bal bazlı ürünler birçok çalışmada kronik ve yanık yaralarında iyi sonuç vermiş, enfeksiyon oranlarını ve hastanede kalış süresini azaltmış; ancak diğer bazı çalışmalarda geleneksel pansumanlardan anlamlı bir fark bulunmamıştır. Yazarlar klinik kanıtları karışık olarak nitelendirmekte, tutarsızlığın büyük kısmını balın değişken bileşimine ve etkinliğine bağlamakta ve standardize ürünler ile ek klinik çalışmalar önermektedir.",
        categories: ["honey", "wound-healing"],
        url: "https://doi.org/10.1002/hsr2.70240"
      },
      {
        titleEn: "The Use of Honey for Cicatrization and Pain Control of Obstetric Wounds (2024)",
        titleTr: "Obstetrik Yaraların İyileşmesi ve Ağrı Kontrolünde Balın Kullanımı (2024)",
        date: "2026-02-05",
        summaryEn: "Systematic review and meta-analysis of 5 double-blind randomized trials in 353 women with caesarean or episiotomy wounds, comparing topical honey with placebo. Final wound healing at days 10 to 14 did not differ between groups, but honey reduced pain midway through treatment, lowered the need for pain medication and complications, and increased patient satisfaction, with good tolerability. The authors point to high heterogeneity, mixed wound and honey types and small samples, and call for larger trials with standardised time points and scales.",
        summaryTr: "Sezaryen veya epizyotomi yarası olan 353 kadında topikal bal ile plaseboyu karşılaştıran 5 çift kör randomize çalışmanın sistematik derlemesi ve meta-analizi. 10-14. günlerdeki nihai yara iyileşmesi gruplar arasında farklılık göstermemiş; ancak bal, tedavinin ortasında ağrıyı azaltmış, ağrı kesici ihtiyacını ve komplikasyonları düşürmüş, hasta memnuniyetini artırmış ve iyi tolere edilmiştir. Yazarlar yüksek heterojenliğe, farklı yara ve bal türlerine ve küçük örneklemlere dikkat çekmekte, standart zaman noktaları ve ölçeklerle daha büyük çalışmalar yapılmasını önermektedir.",
        categories: ["honey", "wound-healing"],
        url: "https://doi.org/10.3390/nu16020185"
      },
      {
        titleEn: "Propolis-Functionalized Biomaterials for Wound Healing (2025)",
        titleTr: "Yara İyileşmesi için Propolis ile Fonksiyonelleştirilmiş Biyomalzemeler (2025)",
        date: "2026-01-28",
        summaryEn: "Systematic review of propolis-functionalized biomaterials and their application in wound healing.",
        summaryTr: "Propolis ile fonksiyonelleştirilmiş biyomalzemeleri ve yara iyileşmesindeki uygulamalarını inceleyen sistematik derleme.",
        summaryBasis: "unverified", // MDPI page blocks automated access; summary not yet checked against the paper
        categories: ["propolis", "wound-healing"],
        url: "https://www.mdpi.com/2673-4176/6/3/74"
      },
      {
        titleEn: "Bee Products and Traditional Plant Therapies for Wound Care (2025)",
        titleTr: "Yara Bakımı için Arı Ürünleri ve Geleneksel Bitki Terapileri (2025)",
        date: "2026-01-20",
        summaryEn: "Narrative review of bee products, mainly honey and propolis, and traditional medicinal plants in wound care, covering their composition and their antimicrobial, anti-inflammatory, antioxidant and tissue-regenerating mechanisms. Experimental and clinical studies, including in diabetic foot ulcers, support their use in chronic wounds, and combinations such as honey with propolis showed good infection control and wound closure. The authors present these products as low-cost options that could complement standard wound care but stress that standardisation and further clinical research are still needed.",
        summaryTr: "Başta bal ve propolis olmak üzere arı ürünlerinin ve geleneksel tıbbi bitkilerin yara bakımındaki kullanımını; bileşimleri ile antimikrobiyal, anti-inflamatuar, antioksidan ve doku yenileyici mekanizmaları üzerinden inceleyen anlatısal derleme. Diyabetik ayak ülserleri dahil deneysel ve klinik çalışmalar bu ürünlerin kronik yaralarda kullanımını desteklemekte; bal ile propolis gibi kombinasyonlar enfeksiyon kontrolü ve yara kapanmasında iyi sonuç vermiştir. Yazarlar bu ürünleri standart yara bakımını tamamlayabilecek düşük maliyetli seçenekler olarak sunmakla birlikte standardizasyon ve ek klinik araştırma gerektiğini vurgulamaktadır.",
        categories: ["honey", "propolis", "royal-jelly", "pollen", "wound-healing"],
        url: "https://doi.org/10.3831/KPI.2025.28.4.255"
      },
      {
        titleEn: "Antioxidant and Anti-Inflammatory Properties of Bee Pollen from Acorn and Darae (2024)",
        titleTr: "Meşe ve Darae Arı Poleninin Antioksidan ve Anti-İnflamatuar Özellikleri (2024)",
        date: "2026-01-12",
        summaryEn: "Cell-culture study of ethanol extracts of Korean bee pollen from acorn (Quercus acutissima) and hardy kiwi, or darae (Actinidia arguta), in LPS-stimulated mouse macrophages, at non-toxic doses up to 400 µg/mL. Acorn and darae pollen cut nitric oxide by 69% and 78%, PGE2 by 44% and 66% and reactive oxygen species by 47% and 60%, lowered TNF-α, IL-6 and IL-1β, blocked NF-κB entry into the nucleus by about 90% and activated the antioxidant regulator Nrf2. The two pollens did not differ significantly, and the findings are limited to a single mouse cell line.",
        summaryTr: "Kore'de meşe (Quercus acutissima) ve darae (Actinidia arguta, kivi akrabası) bitkilerinden toplanan arı poleninin etanol ekstrelerinin, toksik olmayan 400 µg/mL'ye kadar dozlarda LPS ile uyarılmış fare makrofajlarında incelendiği hücre kültürü çalışması. Meşe ve darae poleni nitrik oksidi sırasıyla %69 ve %78, PGE2'yi %44 ve %66, reaktif oksijen türlerini %47 ve %60 azaltmış; TNF-α, IL-6 ve IL-1β'yı düşürmüş, NF-κB'nin çekirdeğe geçişini yaklaşık %90 engellemiş ve antioksidan düzenleyici Nrf2'yi etkinleştirmiştir. İki polen arasında anlamlı fark bulunmamış olup bulgular tek bir fare hücre hattıyla sınırlıdır.",
        categories: ["pollen", "immunity"],
        url: "https://doi.org/10.3390/antiox13080981"
      },
      {
        titleEn: "Chemical Properties and Biological Activity of Bee Pollen (2023)",
        titleTr: "Arı Poleninin Kimyasal Özellikleri ve Biyolojik Aktivitesi (2023)",
        date: "2026-01-04",
        summaryEn: "Review of bee pollen's chemical composition (proteins, carbohydrates, lipids, vitamins, minerals, phenolic compounds and flavonoids) and its antioxidant, anti-inflammatory, antimicrobial, anticancer and possible antiviral activity, with a separate summary of clinical trials, supplement uses, allergy and food-safety risks. Reported mechanisms include suppression of inflammatory genes through NF-κB and MAPK and radical scavenging by polyphenols, and some human studies show effects such as lower cholesterol. The authors stress that composition varies with plant species, region, soil and collection method, which limits generalisation and calls for standardisation.",
        summaryTr: "Arı poleninin kimyasal bileşimini (protein, karbonhidrat, lipit, vitamin, mineral, fenolik bileşikler ve flavonoidler) ve antioksidan, anti-inflamatuar, antimikrobiyal, antikanser ve olası antiviral etkilerini inceleyen; klinik çalışmaları, takviye kullanımını, alerji ve gıda güvenliği risklerini ayrıca özetleyen derleme. Bildirilen mekanizmalar arasında NF-κB ve MAPK üzerinden inflamatuar genlerin baskılanması ve polifenollerin serbest radikal temizleme etkisi bulunmakta; bazı insan çalışmalarında kolesterol düşüşü gibi etkiler görülmektedir. Yazarlar bileşimin bitki türü, bölge, toprak ve toplama yöntemine göre değiştiğini, bunun genellemeyi sınırladığını ve standardizasyon gerektirdiğini vurgulamaktadır.",
        categories: ["pollen"],
        url: "https://doi.org/10.3390/molecules28237768"
      },
      {
        titleEn: "Antioxidant-Rich Polyfloral Bee Pollen Exerts Antimicrobial and Anti-Inflammatory Effects in Lung Epithelial Cells (2025)",
        titleTr: "Antioksidan Açısından Zengin Çok Çiçekli Arı Poleni Akciğer Epitel Hücrelerinde Antimikrobiyal ve Anti-İnflamatuar Etki Gösterir (2025)",
        date: "2025-12-27",
        summaryEn: "Laboratory study of a polyfloral bee pollen from Tuscany, mainly from bramble, dwarf elder and holm oak, analysed for polyphenols (20.2 mg/g), flavonoids and carotenoids and tested in antioxidant, antimicrobial and cell assays. The extract showed solid antioxidant capacity and inhibited Bacillus subtilis and Pseudomonas stutzeri only at a high concentration (10 mg/mL). In TNF-α-inflamed human lung epithelial cells (A549), pretreatment with 10 and 50 µg/mL reduced IL-8 and COX-2 expression by dampening NF-κB activation, which the authors suggest may be relevant to chronic airway inflammation such as COPD, pending in vivo studies.",
        summaryTr: "Başta böğürtlen, yer mürveri ve pırnal meşesinden oluşan, Toskana'da toplanmış çok çiçekli bir arı poleninin polifenol (20,2 mg/g), flavonoid ve karotenoid içeriğinin ölçüldüğü ve antioksidan, antimikrobiyal ve hücre testlerinde incelendiği laboratuvar çalışması. Ekstre iyi bir antioksidan kapasite göstermiş, Bacillus subtilis ve Pseudomonas stutzeri'yi ise ancak yüksek konsantrasyonda (10 mg/mL) baskılamıştır. TNF-α ile inflamasyon oluşturulan insan akciğer epitel hücrelerinde (A549) 10 ve 50 µg/mL ön tedavi, NF-κB aktivasyonunu azaltarak IL-8 ve COX-2 ifadesini düşürmüş; yazarlar bunun KOAH gibi kronik solunum yolu inflamasyonları için önemli olabileceğini, ancak canlı organizma çalışmalarıyla doğrulanması gerektiğini belirtmektedir.",
        categories: ["pollen", "immunity"],
        url: "https://doi.org/10.3390/foods14050802"
      },
      {
        titleEn: "Chemical Composition of Egyptian Propolis and Antimicrobial Activity in Combination with Honey Against MDR Uropathogens (2025)",
        titleTr: "Mısır Propolisinin Kimyasal Bileşimi ve Bal ile Kombinasyon Halinde Çoklu İlaca Dirençli Üropatojenlere Karşı Antimikrobiyal Aktivitesi (2025)",
        date: "2025-12-19",
        summaryEn: "Laboratory study of an ethanol extract of Egyptian propolis, alone and mixed with honey, against five multidrug-resistant urinary tract pathogens (Pseudomonas aeruginosa, E. coli, Klebsiella pneumoniae, Staphylococcus saprophyticus and Candida albicans) that standard antibiotic discs did not inhibit. Propolis inhibited all five, most strongly Candida and S. saprophyticus, honey alone had no effect, and the propolis and honey mixture lowered the minimum inhibitory concentration by about 4 to 8 times. The most active fraction contained 14 phenolic acids and flavonoids, led by naringenin, gallic acid and taxifolin; no animal or human testing was done.",
        summaryTr: "Mısır propolisinin etanol ekstresinin, tek başına ve balla karıştırılarak, standart antibiyotik disklerinin etkisiz kaldığı beş çoklu ilaca dirençli idrar yolu patojenine (Pseudomonas aeruginosa, E. coli, Klebsiella pneumoniae, Staphylococcus saprophyticus ve Candida albicans) karşı test edildiği laboratuvar çalışması. Propolis beş patojenin tümünü, en güçlü olarak Candida ve S. saprophyticus'u baskılamış, bal tek başına etkisiz kalmış, propolis-bal karışımı ise minimum inhibitör konsantrasyonu yaklaşık 4-8 kat düşürmüştür. En etkili fraksiyonda başta naringenin, gallik asit ve taksifolin olmak üzere 14 fenolik asit ve flavonoid bulunmuş; hayvan veya insan testi yapılmamıştır.",
        categories: ["propolis", "honey", "immunity"],
        url: "https://doi.org/10.1038/s41598-025-00773-1"
      }
    ];

    const ARTICLES_PER_PAGE = 10;
    let currentCategory = "all";
    let currentPage = 1;

    const grid = document.getElementById("scienceGrid");
    const paginationContainer = document.getElementById("sciencePagination");
    const categoryBtns = document.querySelectorAll(".category-btn");
    // Only on the Literatür page: free-text search and a result count.
    const searchInput = document.getElementById("scienceSearch");
    const countEl = document.getElementById("scienceCount");
    if (!grid || !paginationContainer) return;

    // Category label mapping for bilingual tags
    const categoryLabels = {
      "honey": { en: "Honey", tr: "Bal" },
      "brain": { en: "Brain", tr: "Beyin" },
      "exercise": { en: "Exercise", tr: "Egzersiz" },
      "immunity": { en: "Immunity", tr: "Bağışıklık" },
      "wound-healing": { en: "Wound Healing", tr: "Yara İyileşmesi" },
      "propolis": { en: "Propolis", tr: "Propolis" },
      "royal-jelly": { en: "Royal Jelly", tr: "Arı Sütü" },
      "pollen": { en: "Pollen", tr: "Polen" },
      "bee-welfare": { en: "Bee Welfare", tr: "Arı Refahı" }
    };

    function todayString() {
      var now = new Date();
      var m = String(now.getMonth() + 1).padStart(2, "0");
      var d = String(now.getDate()).padStart(2, "0");
      return now.getFullYear() + "-" + m + "-" + d;
    }

    function getFilteredArticles() {
      var today = todayString();
      // YYYY-MM-DD strings compare correctly as text; future-dated articles stay hidden until their day.
      var q = searchInput ? searchInput.value.trim().toLocaleLowerCase("tr") : "";
      let filtered = articles.filter(function(a) {
        if (a.date > today) return false;
        if (currentCategory !== "all" && a.categories.indexOf(currentCategory) === -1) return false;
        if (!q) return true;
        var hay = (a.titleTr + " " + a.titleEn + " " + a.summaryTr + " " + a.summaryEn).toLocaleLowerCase("tr");
        return hay.indexOf(q) !== -1;
      });
      // Sort by date descending (newest first)
      filtered.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      return filtered;
    }

    function formatDate(dateStr) {
      var d = new Date(dateStr);
      var months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      var monthsTr = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      if (currentLang === "tr") {
        return d.getDate() + " " + monthsTr[d.getMonth()] + " " + d.getFullYear();
      }
      return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }

    // Titles end with the publication year, e.g. "... (2024)". Wrap it so it
    // can be styled in extra-bold next to the title.
    function formatTitle(title) {
      return title.replace(/\s*\((\d{4})\)\s*$/, ' <span class="science-card-year">($1)</span>');
    }

    function renderArticles() {
      var filtered = getFilteredArticles();
      var totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
      if (currentPage > totalPages) currentPage = totalPages || 1;

      var start = (currentPage - 1) * ARTICLES_PER_PAGE;
      var pageArticles = filtered.slice(start, start + ARTICLES_PER_PAGE);

      var html = "";
      pageArticles.forEach(function(article) {
        var title = currentLang === "tr" ? article.titleTr : article.titleEn;
        var summary = currentLang === "tr" ? article.summaryTr : article.summaryEn;
        var readText = currentLang === "tr" ? "Makaleyi Oku" : "Read Article";

        var tags = "";
        article.categories.forEach(function(cat) {
          var label = currentLang === "tr" ? categoryLabels[cat].tr : categoryLabels[cat].en;
          tags += '<span class="science-tag">' + label + '</span>';
        });

        html += '<div class="science-card">' +
          '<h3 class="science-card-title">' + formatTitle(title) + '</h3>' +
          '<span class="science-card-date">' + formatDate(article.date) + '</span>' +
          '<p class="science-card-summary">' + summary + '</p>' +
          '<div class="science-card-tags">' + tags + '</div>' +
          '<a href="' + article.url + '" target="_blank" rel="noopener noreferrer" class="science-card-link">' +
            readText +
            ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</a>' +
        '</div>';
      });

      if (!pageArticles.length) {
        html = '<p class="science-empty">' +
          (currentLang === "tr" ? "Aramanızla eşleşen makale bulunamadı." : "No articles match your search.") + '</p>';
      }
      grid.innerHTML = html;
      if (countEl) {
        countEl.textContent = currentLang === "tr"
          ? filtered.length + " makale"
          : filtered.length + (filtered.length === 1 ? " article" : " articles");
      }
      renderPagination(filtered.length, totalPages);
    }

    function renderPagination(total, totalPages) {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
      }

      var prevText = currentLang === "tr" ? "Önceki" : "Prev";
      var nextText = currentLang === "tr" ? "Sonraki" : "Next";

      var html = '<button class="pagination-btn pagination-arrow' + (currentPage === 1 ? ' disabled' : '') + '" data-page="prev" aria-label="' + prevText + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
        '</button>';

      for (var i = 1; i <= totalPages; i++) {
        html += '<button class="pagination-btn pagination-num' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
      }

      html += '<button class="pagination-btn pagination-arrow' + (currentPage === totalPages ? ' disabled' : '') + '" data-page="next" aria-label="' + nextText + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
        '</button>';

      paginationContainer.innerHTML = html;

      // Add click handlers
      paginationContainer.querySelectorAll(".pagination-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var page = this.getAttribute("data-page");
          if (page === "prev" && currentPage > 1) {
            currentPage--;
          } else if (page === "next" && currentPage < totalPages) {
            currentPage++;
          } else if (page !== "prev" && page !== "next") {
            currentPage = parseInt(page);
          }
          renderArticles();
          // Scroll to the science section header, not the top of page
          var scienceSection = document.getElementById("science");
          if (scienceSection) {
            var headerOffset = 80;
            var elementPosition = scienceSection.getBoundingClientRect().top;
            var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          }
        });
      });
    }

    // A category whose articles are all still scheduled would open an empty list, so hide its button.
    var todayForCategories = todayString();
    categoryBtns.forEach(function(btn) {
      var cat = btn.getAttribute("data-category");
      if (cat === "all") return;
      var hasVisible = articles.some(function(a) {
        return a.date <= todayForCategories && a.categories.indexOf(cat) !== -1;
      });
      if (!hasVisible) btn.style.display = "none";
    });

    // Category filter click handlers
    categoryBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        categoryBtns.forEach(function(b) { b.classList.remove("active"); });
        this.classList.add("active");
        currentCategory = this.getAttribute("data-category");
        currentPage = 1;
        renderArticles();
      });
    });

    // Listen for language changes to re-render
    document.addEventListener("languageChanged", function() {
      // Update category button text
      categoryBtns.forEach(function(btn) {
        btn.textContent = btn.getAttribute("data-" + currentLang);
      });
      renderArticles();
    });

    if (searchInput) {
      searchInput.addEventListener("input", function() {
        currentPage = 1;
        renderArticles();
      });
    }

    // Initial render
    renderArticles();
  })();

  // ========================================
  // Floating Bee Particles
  // ========================================
  (function () {
    var canvas = document.getElementById("beeParticles");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    // Sections where bees are visible
    var SECTION_IDS = ["about", "team", "testimonials"];
    var visibleZones = [];
    var width, height;
    var bees = [];
    var mouse = { x: -9999, y: -9999 };
    var BEE_COUNT_DESKTOP = 14;
    var BEE_COUNT_MOBILE = 6;
    var MOUSE_RADIUS = 150;

    // Pre-rendered sprite caches
    var SPRITE_SIZES = [20, 26, 32, 38];
    var WING_FRAMES = 8;
    var bodySprites = {};
    var wingSpriteSets = {};
    var spritesReady = false;

    // --- SVG builders ---
    function buildBodySVG() {
      // Bee faces right: head~x42, thorax~x74, abdomen~x132
      return [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">',
        '<defs>',
        // Clip abdomen stripes to ellipse shape
        '<clipPath id="ac">',
        '<ellipse cx="132" cy="60" rx="40" ry="23"/>',
        '</clipPath>',
        // Thorax gradient - dark warm amber-brown, furry
        '<radialGradient id="tG" cx="42%" cy="36%" r="56%">',
        '<stop offset="0%" stop-color="#C09030"/>',
        '<stop offset="50%" stop-color="#7A5810"/>',
        '<stop offset="100%" stop-color="#3A2806"/>',
        '</radialGradient>',
        // Abdomen base - rich golden amber
        '<radialGradient id="aG" cx="34%" cy="30%" r="66%">',
        '<stop offset="0%" stop-color="#F0C030"/>',
        '<stop offset="38%" stop-color="#D08818"/>',
        '<stop offset="72%" stop-color="#A86008"/>',
        '<stop offset="100%" stop-color="#7A4006"/>',
        '</radialGradient>',
        // Head gradient - very dark
        '<radialGradient id="hG" cx="38%" cy="34%" r="56%">',
        '<stop offset="0%" stop-color="#523818"/>',
        '<stop offset="100%" stop-color="#180A00"/>',
        '</radialGradient>',
        // Abdomen sheen
        '<radialGradient id="sG" cx="36%" cy="22%" r="54%">',
        '<stop offset="0%" stop-color="rgba(255,238,130,0.3)"/>',
        '<stop offset="100%" stop-color="rgba(255,210,60,0)"/>',
        '</radialGradient>',
        // Thorax fur highlight
        '<radialGradient id="fG" cx="46%" cy="34%" r="54%">',
        '<stop offset="0%" stop-color="rgba(225,185,65,0.28)"/>',
        '<stop offset="100%" stop-color="rgba(200,160,40,0)"/>',
        '</radialGradient>',
        '</defs>',
        // Antennae (from forehead, curving forward-upward)
        '<path d="M37,50 Q30,40 24,32 Q20,26 16,22" fill="none" stroke="#2C1A00" stroke-width="1.35" stroke-linecap="round"/>',
        '<circle cx="15.5" cy="21" r="2.3" fill="#56380A"/>',
        '<path d="M44,49 Q40,39 38,30 Q37,25 35,21" fill="none" stroke="#2C1A00" stroke-width="1.2" stroke-linecap="round"/>',
        '<circle cx="34.5" cy="20" r="2" fill="#56380A"/>',
        // Head
        '<ellipse cx="43" cy="60" rx="14" ry="13" fill="url(#hG)"/>',
        // Compound eyes - large, glossy, oval
        '<ellipse cx="35" cy="51" rx="6.5" ry="7.5" fill="#06030A"/>',
        '<ellipse cx="35" cy="69" rx="6.5" ry="7.5" fill="#06030A"/>',
        '<ellipse cx="33" cy="49" rx="2.6" ry="3.2" fill="rgba(255,255,255,0.19)"/>',
        '<ellipse cx="33" cy="67" rx="2.6" ry="3.2" fill="rgba(255,255,255,0.19)"/>',
        '<ellipse cx="36.5" cy="53" rx="1.2" ry="1.5" fill="rgba(255,255,255,0.1)"/>',
        '<ellipse cx="36.5" cy="71" rx="1.2" ry="1.5" fill="rgba(255,255,255,0.1)"/>',
        // Mandibles
        '<path d="M30,58 C26,56 24,58 25,60 C24,62 26,64 30,62" fill="none" stroke="#2A1600" stroke-width="1.1" stroke-linecap="round"/>',
        // Neck joint
        '<ellipse cx="58" cy="60" rx="5" ry="7.5" fill="#38240A"/>',
        // Thorax - plump, rounded
        '<ellipse cx="74" cy="60" rx="18" ry="17" fill="url(#tG)"/>',
        '<ellipse cx="72" cy="56" rx="14" ry="12" fill="url(#fG)"/>',
        // Thorax fur strokes - dense short hairs
        '<g stroke="#D0A028" stroke-width="0.85" stroke-linecap="round" opacity="0.32">',
        '<line x1="66" y1="44" x2="63" y2="41"/><line x1="72" y1="43" x2="71" y2="39"/>',
        '<line x1="78" y1="44" x2="81" y2="41"/><line x1="83" y1="50" x2="87" y2="48"/>',
        '<line x1="84" y1="58" x2="89" y2="57"/><line x1="83" y1="66" x2="87" y2="68"/>',
        '<line x1="78" y1="76" x2="81" y2="79"/><line x1="72" y1="77" x2="71" y2="81"/>',
        '<line x1="66" y1="76" x2="63" y2="79"/><line x1="62" y1="70" x2="57" y2="69"/>',
        '<line x1="61" y1="60" x2="56" y2="60"/><line x1="62" y1="52" x2="57" y2="51"/>',
        '</g>',
        // Petiole (narrow waist)
        '<ellipse cx="93" cy="60" rx="5" ry="6.5" fill="#3C2808"/>',
        // Abdomen - golden oval
        '<ellipse cx="132" cy="60" rx="40" ry="23" fill="url(#aG)"/>',
        // Stripes clipped to abdomen ellipse
        '<g clip-path="url(#ac)">',
        '<rect x="101" y="37" width="7" height="46" fill="#1A0900" opacity="0.74"/>',
        '<rect x="116" y="37" width="8" height="46" fill="#1A0900" opacity="0.72"/>',
        '<rect x="132" y="37" width="8" height="46" fill="#1A0900" opacity="0.68"/>',
        '<rect x="148" y="37" width="7" height="46" fill="#1A0900" opacity="0.62"/>',
        '</g>',
        // Abdomen highlight sheen
        '<ellipse cx="122" cy="46" rx="26" ry="8" fill="url(#sG)"/>',
        // Stinger
        '<path d="M170,60 Q175,59.5 180,59.7 L180.2,60 L180,60.3 Q175,60.5 170,60 Z" fill="#1C0E00"/>',
        // Legs - 3 pairs with natural 2-segment bend
        '<g stroke="#221200" stroke-width="1.15" fill="none" stroke-linecap="round" opacity="0.88">',
        '<path d="M63,51 L58,44 L52,37"/>',
        '<path d="M63,69 L58,76 L52,83"/>',
        '<path d="M75,47 L73,39 L68,32"/>',
        '<path d="M75,73 L73,81 L68,88"/>',
        '<path d="M88,50 L90,42 L96,35"/>',
        '<path d="M88,70 L90,78 L96,85"/>',
        // Pollen corbiculae (golden blobs on hind tibiae)
        '<ellipse cx="96" cy="35" rx="3.2" ry="2.2" fill="#DCAA22" stroke="none" opacity="0.48"/>',
        '<ellipse cx="96" cy="85" rx="3.2" ry="2.2" fill="#DCAA22" stroke="none" opacity="0.48"/>',
        '</g>',
        '</svg>',
      ].join("");
    }

    function buildWingSVG(flapOffset) {
      // Wings attach at thorax, rotate around attachment point
      // flapOffset: ranges from -0.6 to +0.6 (sin wave)
      var f = flapOffset;
      // Rotation angles (degrees). Negative = counterclockwise = up from body center
      // At f=-0.6: wings nearly closed (~8°); at f=+0.6: wings spread (~30°)
      var fwTop = -(18 + f * 18);   // upper forewing: -7° to -29°
      var fwBot =   18 + f * 18;    // lower forewing (mirror): +7° to +29°
      var hwTop = -(10 + f * 10);   // upper hindwing: -4° to -16°
      var hwBot =   10 + f * 10;    // lower hindwing: +4° to +16°

      // Attachment at thorax top/bottom (x=74, y=60 in SVG coords)
      var ax = 74, ay = 60;

      // Forewing path: starts at origin, elongated teardrop pointing right-upward
      // Leading edge broad, trailing edge tapered toward tip
      var fw = 'M0,0 C6,-5 18,-14 40,-18 C60,-21 78,-17 86,-9 C91,-4 89,4 80,9 C62,15 30,10 0,0Z';
      // Hindwing path: smaller, rounder
      var hw = 'M0,0 C5,-3 15,-10 32,-13 C46,-15 58,-11 61,-5 C63,0 60,7 48,10 C34,12 15,8 0,0Z';

      // Vein paths (relative, for forewing)
      var fv1 = 'M0,0 C14,-8 38,-14 74,-11';
      var fv2 = 'M0,0 C18,-2 44,-5 76,-1';

      function wing(path, vein1, vein2, rotDeg, scaleY, hw_mode) {
        var tr = 'translate(' + ax + ',' + ay + ') rotate(' + rotDeg + ')' + (scaleY < 0 ? ' scale(1,-1)' : '');
        var parts = [
          '<g transform="' + tr + '">',
          '<path d="' + path + '" fill="rgba(228,240,255,0.42)" stroke="rgba(160,175,210,0.28)" stroke-width="0.55"/>',
        ];
        if (!hw_mode && vein1) {
          parts.push('<path d="' + vein1 + '" fill="none" stroke="rgba(110,100,80,0.38)" stroke-width="0.65"/>');
          parts.push('<path d="' + vein2 + '" fill="none" stroke="rgba(110,100,80,0.22)" stroke-width="0.45"/>');
        }
        parts.push('</g>');
        return parts.join('');
      }

      return [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">',
        // Hindwings behind forewings
        wing(hw, null, null, hwTop, 1, true),
        wing(hw, null, null, hwBot, -1, true),
        // Forewings on top
        wing(fw, fv1, fv2, fwTop, 1, false),
        wing(fw, fv1, fv2, fwBot, -1, false),
        '</svg>',
      ].join('');
    }

    // Render SVG to offscreen canvas
    function svgToCanvas(svgStr, w, h, callback) {
      var img = new Image();
      img.onload = function () {
        var oc = document.createElement("canvas");
        oc.width = w;
        oc.height = h;
        oc.getContext("2d").drawImage(img, 0, 0, w, h);
        callback(oc);
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
    }

    function preRenderSprites(callback) {
      var bodySvg = buildBodySVG();
      var total = SPRITE_SIZES.length * (1 + WING_FRAMES);
      var done = 0;
      function check() { if (++done >= total) { spritesReady = true; callback(); } }

      for (var si = 0; si < SPRITE_SIZES.length; si++) {
        (function (pH) {
          var pW = Math.round(pH * (200 / 120));
          svgToCanvas(bodySvg, pW, pH, function (c) {
            bodySprites[pH] = { canvas: c, w: pW, h: pH };
            check();
          });
          wingSpriteSets[pH] = new Array(WING_FRAMES);
          for (var f = 0; f < WING_FRAMES; f++) {
            (function (frame) {
              var t = frame / (WING_FRAMES - 1);
              var flapOff = Math.sin(t * Math.PI * 2) * 0.6;
              svgToCanvas(buildWingSVG(flapOff), pW, pH, function (c) {
                wingSpriteSets[pH][frame] = { canvas: c, w: pW, h: pH };
                check();
              });
            })(f);
          }
        })(SPRITE_SIZES[si]);
      }
    }

    function closestSize(s) {
      var best = SPRITE_SIZES[0];
      for (var i = 1; i < SPRITE_SIZES.length; i++) {
        if (Math.abs(SPRITE_SIZES[i] - s) < Math.abs(best - s)) best = SPRITE_SIZES[i];
      }
      return best;
    }

    // --- Section visibility ---
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function updateVisibleZones() {
      visibleZones = [];
      for (var i = 0; i < SECTION_IDS.length; i++) {
        var el = document.getElementById(SECTION_IDS[i]);
        if (el) {
          var r = el.getBoundingClientRect();
          visibleZones.push({ top: r.top, bottom: r.bottom });
        }
      }
    }

    function isInVisibleZone(y) {
      for (var i = 0; i < visibleZones.length; i++) {
        if (y >= visibleZones[i].top - 50 && y <= visibleZones[i].bottom + 50) return true;
      }
      return false;
    }

    function getZoneBounds() {
      if (!visibleZones.length) return null;
      return { top: visibleZones[0].top, bottom: visibleZones[visibleZones.length - 1].bottom };
    }

    function getBeeCount() {
      return window.innerWidth < 768 ? BEE_COUNT_MOBILE : BEE_COUNT_DESKTOP;
    }

    // --- Bee lifecycle ---
    function createBee() {
      var bounds = getZoneBounds();
      var yMin = bounds ? bounds.top : 0;
      var yMax = bounds ? bounds.bottom : height;
      return {
        x: Math.random() * width,
        y: yMin + Math.random() * (yMax - yMin),
        spriteSize: SPRITE_SIZES[Math.floor(Math.random() * SPRITE_SIZES.length)],
        angle: Math.random() * Math.PI * 2,
        baseSpeedX: (Math.random() - 0.5) * 1.0,
        baseSpeedY: (Math.random() - 0.5) * 0.6,
        vx: 0, vy: 0,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.35 + Math.random() * 0.15,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.015 + Math.random() * 0.01,
        wobbleAmp: 0.3 + Math.random() * 0.3,
        opacity: 0.5 + Math.random() * 0.3,
        glowPulse: Math.random() * Math.PI * 2,
        flipY: Math.random() > 0.5 ? 1 : -1,
      };
    }

    function initBees() {
      bees = [];
      for (var i = 0, n = getBeeCount(); i < n; i++) bees.push(createBee());
    }

    // --- Drawing ---
    function drawBee(bee) {
      if (!spritesReady) return;
      var sk = closestSize(bee.spriteSize);
      var bs = bodySprites[sk];
      var wf = wingSpriteSets[sk];
      if (!bs || !wf) return;

      var wIdx = Math.floor(((bee.wingPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * WING_FRAMES) % WING_FRAMES;
      var ws = wf[wIdx];
      var w = bs.w, h = bs.h;
      var glowI = 0.10 + Math.sin(bee.glowPulse) * 0.05;

      ctx.save();
      ctx.globalAlpha = bee.opacity;
      ctx.translate(bee.x, bee.y);
      ctx.rotate(bee.angle);
      ctx.scale(1, bee.flipY);

      // Warm ambient glow
      var g = ctx.createRadialGradient(0, 0, h * 0.15, 0, 0, h * 1.2);
      g.addColorStop(0, "rgba(245,200,66," + (glowI * 0.7) + ")");
      g.addColorStop(0.5, "rgba(220,170,40," + (glowI * 0.35) + ")");
      g.addColorStop(1, "rgba(200,150,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, h * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Wings behind body
      if (ws) ctx.drawImage(ws.canvas, -w * 0.5, -h * 0.5, w, h);
      // Body on top
      ctx.drawImage(bs.canvas, -w * 0.5, -h * 0.5, w, h);

      ctx.restore();
    }

    // --- Physics ---
    function update() {
      updateVisibleZones();
      var bounds = getZoneBounds();

      for (var i = 0; i < bees.length; i++) {
        var b = bees[i];
        b.wobblePhase += b.wobbleSpeed;
        var wx = Math.sin(b.wobblePhase) * b.wobbleAmp;
        var wy = Math.cos(b.wobblePhase * 0.7) * b.wobbleAmp;

        var fx = 0, fy = 0;
        var dx = b.x - mouse.x, dy = b.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_RADIUS && d > 0) {
          var f = (1 - d / MOUSE_RADIUS) * 3;
          fx = (dx / d) * f;
          fy = (dy / d) * f;
        }

        b.vx += (b.baseSpeedX + wx + fx - b.vx) * 0.05;
        b.vy += (b.baseSpeedY + wy + fy - b.vy) * 0.05;
        b.x += b.vx;
        b.y += b.vy;

        if (Math.abs(b.vx) > 0.1 || Math.abs(b.vy) > 0.1) {
          var ta = Math.atan2(b.vy, b.vx);
          var ad = ta - b.angle;
          while (ad > Math.PI) ad -= Math.PI * 2;
          while (ad < -Math.PI) ad += Math.PI * 2;
          b.angle += ad * 0.04;
        }

        b.wingPhase += b.wingSpeed;
        b.glowPulse += 0.02;

        var m = 60;
        if (b.x < -m) b.x = width + m;
        if (b.x > width + m) b.x = -m;
        if (bounds) {
          if (b.y < bounds.top - m) b.y = bounds.bottom + m * 0.5;
          if (b.y > bounds.bottom + m) b.y = bounds.top - m * 0.5;
        } else {
          if (b.y < -m) b.y = height + m;
          if (b.y > height + m) b.y = -m;
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < bees.length; i++) {
        if (isInVisibleZone(bees[i].y)) drawBee(bees[i]);
      }
    }

    function animate() {
      update();
      draw();
      requestAnimationFrame(animate);
    }

    // --- Events ---
    document.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener("mouseleave", function () { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("touchmove", function (e) {
      if (e.touches.length > 0) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    }, { passive: true });
    document.addEventListener("touchend", function () { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener("resize", function () {
      resize();
      if (bees.length !== getBeeCount()) initBees();
    });

    // --- Init ---
    resize();
    updateVisibleZones();
    preRenderSprites(function () {
      initBees();
      animate();
    });
  })();

  // ========================================
  // Initial Setup
  // ========================================
  // Trigger initial language setting
  updateLanguage(pageLang);

  // Show elements that should be visible on load
  setTimeout(() => {
    document
      .querySelectorAll(".gallery-section, .products-section, .science-section")
      .forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        }
      });
  }, 100);
});
