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

    // Dispatch language change event for reviews section
    document.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: lang } }));
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
    ".gallery-section, .products-section, .partners-section, .about-item, .team-member, .testimonials-section, .faq-section"
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
      { name: "Hakan Adıyaman", commentTr: "Gerçekten harika bir bal, emeğinize sağlık 🍯✨ Doğallığı ilk kaşıkta hissediliyor, teşekkürler! Gerçek bal arayanlara gönül rahatlığıyla öneririm. Muhteşem bir ürün!", commentEn: "Truly wonderful honey, thank you for your effort 🍯✨ You can feel the naturalness from the first spoon, thanks! I wholeheartedly recommend it to those looking for real honey. An amazing product!", date: "29 November, 2025", url: "#" },
      { name: "Zafer Hinislioğlu", commentTr: "Siparişimiz hızlı bir şekilde ulaştı. Gerçek anlamda Doğal-Bio bal tadabildiğimiz için şanslıyız, tavsiye ediyoruz. Guvenilirliği ve tazeliği için emeğinize sağlık. Alın ve aldırın, Afiyet olsun...", commentEn: "Our order arrived quickly. We are lucky to be able to taste truly Natural-Bio honey, we recommend it. Thank you for your effort for its reliability and freshness. Buy it and have others buy it, Enjoy...", date: "31 December, 2025", url: "#" },
      { name: "İmam Karadağ", commentTr: "Arkadaşlar burdaki ürünler bir harika herkese tavsiye ederim", commentEn: "Friends, the products here are wonderful, I recommend them to everyone", date: "13 January, 2026", url: "#" },
      { name: "Hakan Demirtel", commentTr: "Muhteşem. Tam özlediğimiz tat. Bu lezzet bizi çocukluğumuzda yediğimiz o lezzetli, kıvamlı, katkısız, katıksız mis kokulu bal tadıyla yeniden buluşturdu. Ellerinize, emeğinize sağlık.", commentEn: "Magnificent. Exactly the taste we missed. This flavor reunited us with that delicious, thick, pure, unadulterated, fragrant honey taste we had in our childhood. Thank you for your effort.", date: "17 December, 2025", url: "#" },
      { name: "Yusuf Güdücü", commentTr: "Gerçek bir bilimcinin verdiği güven ve eşsiz lezzetiyle kahvaltıların Seda Sayanı. Emeğinize sağlık Ege Arıcılık 🐝", commentEn: "The Seda Sayan of breakfasts with the trust of a real scientist and its unique taste. Thank you for your effort Ege Beekeeping 🐝", date: "20 December, 2025", url: "#" },
      { name: "Rasim Rabia Gören", commentTr: "Orjinal bal buna denir çocuklarımıza güvenle yediriyoruz ve yiyiyoruz şiddetle tavsiye ederim herkez bir şans verip almalı emeklerinize sağlık 👏👏", commentEn: "This is what original honey is called, we feed our children with confidence and eat it ourselves, I strongly recommend it, everyone should give it a chance and buy it, thank you for your effort 👏👏", date: "1 September, 2025", url: "#" },
      { name: "ka.cerit", commentTr: "Hayıt balı EFSANEYMIS denemeniz lazım", commentEn: "Chaste tree honey IS LEGENDARY you must try it", date: "18 September, 2025", url: "#" },
      { name: "Kadir Gören", commentTr: "Dünyanın en güzel balıdır bu, ellerinize sağlık.", commentEn: "This is the most beautiful honey in the world, thank you.", date: "13 September, 2025", url: "#" },
      { name: "Kiraz Naide", commentTr: "Emeklerinize sağlık balı sizden almakla doğru tercih yapmışız", commentEn: "Thank you for your effort, we made the right choice by buying honey from you", date: "5 September, 2025", url: "#" },
      { name: "Aslı Kılınç", commentTr: "Doğal ve özlediğimiz gerçek bal lezzeti 👍 Gönül rahatlığıyla tavsiye ederim💯", commentEn: "Natural and the real honey taste we missed 👍 I recommend it with peace of mind💯", date: "3 September, 2025", url: "#" },
      { name: "Av. Demet Kozacıoğlu", commentTr: "Güvenilir ellerden doğal bal almak isteyen herkese tavsiye ederim , teşekkürler 🙏🏻", commentEn: "I recommend it to everyone who wants to buy natural honey from reliable hands, thank you 🙏🏻", date: "2 September, 2025", url: "#" },
      { name: "Nilay Bilgin", commentTr: "Lezzetli, doğal, güvenli.", commentEn: "Delicious, natural, safe.", date: "3 September, 2025", url: "#" },
      { name: "Semra Çangiri", commentTr: "Lezzeti ve aroması çok güzel. Emeklerinize sağlık. Doğal bal yemek isteyenler kaçırmasın.", commentEn: "Its taste and aroma are very nice. Thank you for your effort. Those who want to eat natural honey should not miss it.", date: "4 September, 2025", url: "#" },
      { name: "Prof. Dr. Zafer Kozacıoğlu", commentTr: "Ege arıcılık tan son mahsül balımızı aldık. Bebeğimiz ve biz güvenle ve lezzetle yiyoruz. Bu devirde güvenle önemli.. Osman bey e teşekkürlerimi sunuyorum..", commentEn: "We got our last harvest honey from Ege Beekeeping. Our baby and we eat it safely and deliciously. Trust is important in this day and age.. I offer my thanks to Mr. Osman..", date: "11 August, 2025", url: "#" },
      { name: "Nevin Çiftlikçi", commentTr: "Gözü kapalı güvenebileceğimiz tek adres.Çok teşekkürler 🙏", commentEn: "The only address we can trust blindly. Thank you very much 🙏", date: "26 August, 2025", url: "#" },
      { name: "Kaan Kılınç", commentTr: "Kavanoz bal ve petek baldan aldık çok memnun kaldık gerçekten çok doğal", commentEn: "We bought jar honey and comb honey, we were very satisfied, really very natural", date: "20 August, 2025", url: "#" },
      { name: "Ayşe Aydın", commentTr: "Emeğinize sağlık 👏 doğallığı ve tadı mükemmel 🌻", commentEn: "Thank you for your effort 👏 its naturalness and taste are perfect 🌻", date: "27 August, 2025", url: "#" },
      { name: "Hakan Bilgin", commentTr: "Hayıt balını kullandık. Aroması nadir, lezzeti mükemmeldi. Üreten arkadaşların emeklerine sağlık", commentEn: "We used chaste tree honey. Its aroma is rare, its taste was perfect. Thank you to the friends who produced it", date: "22 August, 2025", url: "#" },
      { name: "Erim Kılınç", commentTr: "Hem petek balı hemde kavanoz balından aldım, birinci sınıf Rahmetli dedemin kovanları olduğu için çocukluğumun lezzetine tekrar kavuşmuş oldum", commentEn: "I bought both comb honey and jar honey, first class. Since my late grandfather had beehives, I was reunited with the taste of my childhood", date: "20 August, 2025", url: "#" },
      { name: "Faruk Kurt", commentTr: "Çok beğendim. Çok güvenilir emeklerinize sağlık 👏", commentEn: "I loved it. Very reliable, thank you for your effort 👏", date: "29 August, 2025", url: "#" },
      { name: "Ferhat Karaca", commentTr: "Harika olmuş emeklerinize sağlık 👏", commentEn: "It turned out great, thank you for your effort 👏", date: "29 August, 2025", url: "#" },
      { name: "Özlem Duraydın", commentTr: "Çok lezzetli mükemmel bir bal.Emeğinize sağlık👏", commentEn: "A very delicious, perfect honey. Thank you for your effort👏", date: "12 August, 2025", url: "#" },
      { name: "İpek Aydın", commentTr: "Ellerinize sağlık çok kaliteli ve lezzetliydi 👏🏻", commentEn: "Thank you, it was very high quality and delicious 👏🏻", date: "10 August, 2025", url: "#" },
      { name: "Diş Hekimi Soner Çoruk", commentTr: "Gerçek bal için teşekkürler", commentEn: "Thank you for real honey", date: "15 August, 2025", url: "#" },
      { name: "Mehmet_112", commentTr: "Ellerinize sağlık çok lezzetli bir bal, hayırlı hasatlarınınız olsun", commentEn: "Thank you, very delicious honey, may you have blessed harvests", date: "30 July, 2025", url: "#" },
      { name: "İbrahim Zaralıoğlu", commentTr: "Göndermiş olduğunuz bal elime ulaştı. Tadı kokusu harika elinize emeğinize sağlık", commentEn: "The honey you sent has arrived. Its taste and smell are wonderful, thank you for your effort", date: "18 October, 2025", url: "#" }
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
        reviewTextCard.textContent = currentLang === "tr" ? review.commentTr : review.commentEn;

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
    document.addEventListener("languageChanged", function() {
      createTimelineItems();
    });

    // Button controls for reviews carousel
    const reviewsPrevBtn = document.getElementById("reviewsPrev");
    const reviewsNextBtn = document.getElementById("reviewsNext");

    if (reviewsPrevBtn) {
      reviewsPrevBtn.addEventListener("click", function() {
        stopReviewAutoplay();
        prevReview();
        startReviewAutoplay();
      });
    }

    if (reviewsNextBtn) {
      reviewsNextBtn.addEventListener("click", function() {
        stopReviewAutoplay();
        nextReview();
        startReviewAutoplay();
      });
    }

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
  // FAQ Accordion
  // ========================================
  (function initFAQ() {
    const faqItems = document.querySelectorAll(".faq-item");

    if (faqItems.length === 0) return;

    faqItems.forEach(function(item) {
      const question = item.querySelector(".faq-question");

      if (question) {
        question.addEventListener("click", function() {
          const isActive = item.classList.contains("active");

          // Close all other items (accordion behavior)
          faqItems.forEach(function(otherItem) {
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
        question.addEventListener("keydown", function(e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            question.click();
          }
        });
      }
    });

    // Allow opening multiple items with Shift+Click
    faqItems.forEach(function(item) {
      const question = item.querySelector(".faq-question");

      if (question) {
        question.addEventListener("click", function(e) {
          if (e.shiftKey) {
            // Just toggle this item without closing others
            e.stopImmediatePropagation();
            item.classList.toggle("active");
            question.setAttribute("aria-expanded", item.classList.contains("active"));
          }
        });
      }
    });
  })();

  // ========================================
  // Mascot Popup
  // ========================================
  (function initMascotPopup() {
    const mascotPopup = document.getElementById("mascotPopup");
    const mascotCloseBtn = document.getElementById("mascotPopupClose");
    const mascotText = mascotPopup ? mascotPopup.querySelector(".mascot-text") : null;

    if (!mascotPopup || !mascotCloseBtn) return;

    // Check if popup was already shown
    const popupShown = localStorage.getItem("beeoniaMascotPopupShown");

    if (popupShown) {
      mascotPopup.style.display = "none";
      return;
    }

    // Show popup after 5 seconds
    setTimeout(function() {
      mascotPopup.classList.add("visible");
    }, 5000);

    // Close button handler
    mascotCloseBtn.addEventListener("click", function() {
      mascotPopup.classList.remove("visible");
      localStorage.setItem("beeoniaMascotPopupShown", "true");

      // Remove from DOM after fade out animation
      setTimeout(function() {
        mascotPopup.style.display = "none";
      }, 500);
    });

    // Update text on language change
    document.addEventListener("languageChanged", function(e) {
      if (mascotText) {
        const lang = e.detail.lang;
        mascotText.textContent = mascotText.getAttribute("data-" + lang);
      }
    });
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
