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
    ".gallery-section, .products-section, .partners-section, .about-item, .team-member, .testimonials-section"
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
  // Customer Reviews Timeline
  // ========================================
  (function initReviews() {
    const reviews = [
      { name: "Naide Kiraz", comment: "Organik ve doğal ürün severlere şiddetle tavsiye ediyorum. Harika bir deneyim!", date: "23 January, 2026", url: "#" },
      { name: "Zafer Hinislioğlu", comment: "Kaliteli ve güvenilir ürünler. Ailecek kullanıyoruz, herkese tavsiye ederiz.", date: "18 January, 2026", url: "#" },
      { name: "Aslı Kılınç", comment: "Çam balının tadı muhteşem! Doğallığı hemen belli oluyor, teşekkürler Beeonia.", date: "12 January, 2026", url: "#" },
      { name: "Özlem Duraydın", comment: "Yıllardır aradığım doğal balı sonunda buldum. Katkısız ve lezzetli.", date: "5 January, 2026", url: "#" },
      { name: "Av. Demet Kozacıoğlu", comment: "Profesyonel hizmet ve üstün kalite. Arı ürünleri konusunda güvenilir bir adres.", date: "28 December, 2025", url: "#" },
      { name: "Semra Çangiri", comment: "Propolisin faydalarını görünce çok şaşırdım. Bağışıklık sistemim güçlendi.", date: "20 December, 2025", url: "#" },
      { name: "Nilay Bilgin", comment: "Her sabah kahvaltıda balınızı yiyoruz. Enerji dolu başlıyoruz güne!", date: "15 December, 2025", url: "#" },
      { name: "Yusuf Güdücü", comment: "Yamanlar Dağı'ndan gelen bu bal gerçekten eşsiz. Tadına doyum olmuyor.", date: "8 December, 2025", url: "#" },
      { name: "Rabia Gören", comment: "Çocuklarıma gönül rahatlığıyla yedirebileceğim doğal ürünler.", date: "1 December, 2025", url: "#" },
      { name: "Ferhat Karaca", comment: "Arıcılık konusundaki tutkunuz ürünlerinize yansıyor. Tebrikler!", date: "25 November, 2025", url: "#" },
      { name: "Soner Çoruk", comment: "Hediye olarak aldım, alan da veren de memnun kaldı.", date: "18 November, 2025", url: "#" },
      { name: "İpek Aydın", comment: "Polen ve bal karışımı enerji bombası gibi! Sporcular için ideal.", date: "10 November, 2025", url: "#" },
      { name: "İbrahim Zaralioğlu", comment: "Doğal ve saf ürünler arıyorsanız doğru adrestesiniz.", date: "3 November, 2025", url: "#" },
      { name: "Hakan Adıyaman", comment: "Bal kavanozunu açtığımda gelen o doğal koku... Muhteşem!", date: "27 October, 2025", url: "#" },
      { name: "Hakan Demirtel", comment: "Sürdürülebilir arıcılık anlayışınız takdire şayan. Devamını bekliyoruz.", date: "20 October, 2025", url: "#" }
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
    function getInitials(name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
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

      indices.forEach(function(idx, i) {
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
        reviewTextCard.textContent = review.comment;

        // Add clickable date at bottom of card
        const dateLink = document.createElement("a");
        dateLink.className = "review-date-link";
        dateLink.href = review.url;
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

    // Pause on hover
    reviewsSection.addEventListener("mouseenter", stopReviewAutoplay);
    reviewsSection.addEventListener("mouseleave", startReviewAutoplay);

    // Keyboard navigation (left/right arrow keys)
    document.addEventListener("keydown", function(e) {
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

    timelineTrack.addEventListener("mousedown", function(e) {
      isDragging = true;
      hasDragged = false;
      startX = e.clientX;
      timelineTrack.style.cursor = "grabbing";
      stopReviewAutoplay();
      e.preventDefault();
    });

    document.addEventListener("mousemove", function(e) {
      if (!isDragging) return;

      const diff = e.clientX - startX;
      if (Math.abs(diff) > 10) {
        hasDragged = true;
      }
    });

    document.addEventListener("mouseup", function(e) {
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
    timelineTrack.addEventListener("click", function(e) {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  })();

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
