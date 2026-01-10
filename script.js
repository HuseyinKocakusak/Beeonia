// ========================================
// BEEONIA - JavaScript
// Interactive Features & Responsive Behavior
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // ========================================
  // Language Switching
  // ========================================
  let currentLang = "en";
  const langBtns = document.querySelectorAll(".lang-btn");

  function updateLanguage(lang) {
    currentLang = lang;

    // Update all elements with data-tr and data-en attributes
    document.querySelectorAll("[data-tr][data-en]").forEach((el) => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });

    // Update active button
    langBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang === "tr" ? "tr" : "en";
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => updateLanguage(btn.dataset.lang));
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

      this.slides = Array.from(this.track.children);
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
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      this.track.addEventListener(
        "touchstart",
        (e) => {
          startX = e.touches[0].clientX;
          isDragging = true;
          if (this.autoplay) this.stopAutoplay();
        },
        { passive: true }
      );

      this.track.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging) return;
          currentX = e.touches[0].clientX;
        },
        { passive: true }
      );

      this.track.addEventListener("touchend", () => {
        if (!isDragging) return;
        isDragging = false;

        const diff = startX - currentX;
        const threshold = 50;

        if (diff > threshold) {
          this.next();
        } else if (diff < -threshold) {
          this.prev();
        }

        if (this.autoplay) this.startAutoplay();
      });

      // Mouse drag support for desktop
      let mouseStartX = 0;
      let isMouseDragging = false;

      this.track.addEventListener("mousedown", (e) => {
        mouseStartX = e.clientX;
        isMouseDragging = true;
        this.track.style.cursor = "grabbing";
      });

      document.addEventListener("mousemove", (e) => {
        if (!isMouseDragging) return;
        currentX = e.clientX;
      });

      document.addEventListener("mouseup", () => {
        if (!isMouseDragging) return;
        isMouseDragging = false;
        this.track.style.cursor = "grab";

        const diff = mouseStartX - currentX;
        const threshold = 50;

        if (diff > threshold) {
          this.next();
        } else if (diff < -threshold) {
          this.prev();
        }
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
        this.autoplayInterval
      );
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }
  }

  // Initialize carousels
  const galleryCarousel = new Carousel(
    "galleryTrack",
    "galleryPrev",
    "galleryNext",
    {
      slidesToShow: 1,
      autoplay: true,
      autoplayInterval: 5000,
    }
  );

  const productsCarousel = new Carousel(
    "productsTrack",
    "productsPrev",
    "productsNext",
    {
      slidesToShow: 3,
      gap: 24,
    }
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
  const modalWeight = document.getElementById("modalWeight");
  const modalPrice = document.getElementById("modalPrice");
  const modalHarvest = document.getElementById("modalHarvest");
  const modalBackdrop = document.querySelector(".modal-backdrop");

  function openModal(card) {
    const img = card.querySelector(".product-image img");

    modalImage.src = img.src;
    modalTitle.textContent = card.dataset.title;
    modalOrigin.textContent = card.dataset.origin;
    modalDescription.textContent =
      currentLang === "tr"
        ? card.dataset.descriptionTr
        : card.dataset.descriptionEn;
    modalWeight.textContent = card.dataset.weight;
    modalPrice.textContent = card.dataset.price;
    modalHarvest.textContent =
      currentLang === "tr" ? card.dataset.harvestTr : card.dataset.harvestEn;

    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  // Product card click handlers
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card));
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
    ".gallery-section, .products-section, .partners-section, .about-item, .team-member"
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
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

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
  // Initial Setup
  // ========================================
  // Trigger initial language setting
  updateLanguage("tr");

  // Show elements that should be visible on load
  setTimeout(() => {
    document
      .querySelectorAll(".gallery-section, .products-section")
      .forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        }
      });
  }, 100);
});
