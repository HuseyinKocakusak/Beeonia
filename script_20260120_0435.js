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
    document.dispatchEvent(
      new CustomEvent("languageChanged", { detail: { lang: lang } }),
    );
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
        { passive: true },
      );

      this.track.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging) return;
          currentX = e.touches[0].clientX;
        },
        { passive: true },
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
    let scrollLeft = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationId = null;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;

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
        track.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        setTranslate(currentTranslate + scrollStep);
        prevTranslate = currentTranslate;
        setTimeout(function () { track.style.transition = "none"; }, 400);
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener("click", function () {
        track.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        setTranslate(currentTranslate - scrollStep);
        prevTranslate = currentTranslate;
        setTimeout(function () { track.style.transition = "none"; }, 400);
      });
    }

    // Touch events
    viewport.addEventListener("touchstart", function (e) {
      isDragging = true;
      startX = e.touches[0].clientX;
      prevTranslate = currentTranslate;
      lastX = startX;
      lastTime = Date.now();
      velocity = 0;
      track.style.transition = "none";
    }, { passive: true });

    viewport.addEventListener("touchmove", function (e) {
      if (!isDragging) return;
      var currentX = e.touches[0].clientX;
      var diff = currentX - startX;
      var now = Date.now();
      var dt = now - lastTime;
      if (dt > 0) {
        velocity = (currentX - lastX) / dt;
      }
      lastX = currentX;
      lastTime = now;
      setTranslate(prevTranslate + diff);
    }, { passive: true });

    viewport.addEventListener("touchend", function () {
      isDragging = false;
      prevTranslate = currentTranslate;
      // Momentum scroll
      applyMomentum();
    });

    // Mouse drag
    viewport.addEventListener("mousedown", function (e) {
      isDragging = true;
      startX = e.clientX;
      prevTranslate = currentTranslate;
      lastX = startX;
      lastTime = Date.now();
      velocity = 0;
      track.style.transition = "none";
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      var currentX = e.clientX;
      var diff = currentX - startX;
      var now = Date.now();
      var dt = now - lastTime;
      if (dt > 0) {
        velocity = (currentX - lastX) / dt;
      }
      lastX = currentX;
      lastTime = now;
      setTranslate(prevTranslate + diff);
    });

    document.addEventListener("mouseup", function () {
      if (!isDragging) return;
      isDragging = false;
      prevTranslate = currentTranslate;
      applyMomentum();
    });

    function applyMomentum() {
      var momentum = velocity * 150;
      if (Math.abs(momentum) > 5) {
        track.style.transition = "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        setTranslate(currentTranslate + momentum);
        prevTranslate = currentTranslate;
        setTimeout(function () { track.style.transition = "none"; }, 600);
      }
    }

    // Mouse wheel horizontal scroll
    viewport.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
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
    ".gallery-section, .products-section, .partners-section, .about-item, .value-card, .team-member, .testimonials-section, .faq-section, .science-section",
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
        name: "Hakan Adıyaman",
        commentTr:
          "Gerçekten harika bir bal, emeğinize sağlık 🍯✨ Doğallığı ilk kaşıkta hissediliyor, teşekkürler! Gerçek bal arayanlara gönül rahatlığıyla öneririm. Muhteşem bir ürün!",
        commentEn:
          "Truly wonderful honey, thank you for your effort 🍯✨ You can feel the naturalness from the first spoon, thanks! I wholeheartedly recommend it to those looking for real honey. An amazing product!",
        date: "29 November, 2025",
        url: "https://www.instagram.com/p/DQcT4f_jJzN/c/17902895868316341/?img_index=1",
      },
      {
        name: "Zafer Hinislioğlu",
        commentTr:
          "Siparişimiz hızlı bir şekilde ulaştı. Gerçek anlamda Doğal-Bio bal tadabildiğimiz için şanslıyız, tavsiye ediyoruz. Guvenilirliği ve tazeliği için emeğinize sağlık. Alın ve aldırın, Afiyet olsun...",
        commentEn:
          "Our order arrived quickly. We are lucky to be able to taste truly Natural-Bio honey, we recommend it. Thank you for your effort for its reliability and freshness. Buy it and have others buy it, Enjoy...",
        date: "31 December, 2025",
        url: "https://www.instagram.com/p/DQcT4f_jJzN/c/18050346845447293/",
      },
      {
        name: "İmam Karadağ",
        commentTr:
          "Arkadaşlar burdaki ürünler bir harika herkese tavsiye ederim",
        commentEn:
          "Friends, the products here are wonderful, I recommend them to everyone",
        date: "13 January, 2026",
        url: "https://www.instagram.com/p/DTavyE8jD3V/c/17953422657063196/",
      },
      {
        name: "Hakan Demirtel",
        commentTr:
          "Muhteşem. Tam özlediğimiz tat. Bu lezzet bizi çocukluğumuzda yediğimiz o lezzetli, kıvamlı, katkısız, katıksız mis kokulu bal tadıyla yeniden buluşturdu. Ellerinize, emeğinize sağlık.",
        commentEn:
          "Magnificent. Exactly the taste we missed. This flavor reunited us with that delicious, thick, pure, unadulterated, fragrant honey taste we had in our childhood. Thank you for your effort.",
        date: "17 December, 2025",
        url: "https://www.instagram.com/p/DOv6qyXDDC8/c/17977905290794155/",
      },
      {
        name: "Yusuf Güdücü",
        commentTr:
          "Gerçek bir bilimcinin verdiği güven ve eşsiz lezzetiyle kahvaltıların Seda Sayan'ı. Emeğinize sağlık Ege Arıcılık 🐝",
        commentEn:
          "The Seda Sayan of breakfasts with the trust of a real scientist and its unique taste. Thank you for your effort Ege Beekeeping 🐝",
        date: "20 December, 2025",
        url: "https://www.instagram.com/p/DSfwhDWjF3u/c/18543127087017166/",
      },
      {
        name: "Rasim Rabia Gören",
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
        name: "Kadir Gören",
        commentTr: "Dünyanın en güzel balıdır bu, ellerinize sağlık.",
        commentEn: "This is the most beautiful honey in the world, thank you.",
        date: "13 September, 2025",
        url: "https://www.instagram.com/p/DOi8IwbDLyE/c/18088731997839464/",
      },
      {
        name: "Kiraz Naide",
        commentTr:
          "Emeklerinize sağlık balı sizden almakla doğru tercih yapmışız",
        commentEn:
          "Thank you for your effort, we made the right choice by buying honey from you",
        date: "5 September, 2025",
        url: "https://www.instagram.com/p/DOOwb0GDAR7/c/18287629336261593/",
      },
      {
        name: "Aslı Kılınç",
        commentTr:
          "Doğal ve özlediğimiz gerçek bal lezzeti 👍 Gönül rahatlığıyla tavsiye ederim💯",
        commentEn:
          "Natural and the real honey taste we missed 👍 I recommend it with peace of mind💯",
        date: "3 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18317756617208716/",
      },
      {
        name: "Av. Demet Kozacıoğlu",
        commentTr:
          "Güvenilir ellerden doğal bal almak isteyen herkese tavsiye ederim , teşekkürler 🙏🏻",
        commentEn:
          "I recommend it to everyone who wants to buy natural honey from reliable hands, thank you 🙏🏻",
        date: "2 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18143009455416285/",
      },
      {
        name: "Nilay Bilgin",
        commentTr: "Lezzetli, doğal, güvenli.",
        commentEn: "Delicious, natural, safe.",
        date: "3 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18519352420027476/",
      },
      {
        name: "Semra Çangiri",
        commentTr:
          "Lezzeti ve aroması çok güzel. Emeklerinize sağlık. Doğal bal yemek isteyenler kaçırmasın.",
        commentEn:
          "Its taste and aroma are very nice. Thank you for your effort. Those who want to eat natural honey should not miss it.",
        date: "4 September, 2025",
        url: "https://www.instagram.com/p/DOG6YD5jJ0L/c/18484451644077387/",
      },
      {
        name: "Prof. Dr. Zafer Kozacıoğlu",
        commentTr:
          "Ege arıcılık tan son mahsül balımızı aldık. Bebeğimiz ve biz güvenle ve lezzetle yiyoruz. Bu devirde güvenle önemli.. Osman bey e teşekkürlerimi sunuyorum..",
        commentEn:
          "We got our last harvest honey from Ege Beekeeping. Our baby and we eat it safely and deliciously. Trust is important in this day and age.. I offer my thanks to Mr. Osman..",
        date: "11 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18167154961318978/",
      },
      {
        name: "Nevin Çiftlikçi",
        commentTr: "Gözü kapalı güvenebileceğimiz tek adres.Çok teşekkürler 🙏",
        commentEn:
          "The only address we can trust blindly. Thank you very much 🙏",
        date: "26 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18090888745707762/",
      },
      {
        name: "Kaan Kılınç",
        commentTr:
          "Kavanoz bal ve petek baldan aldık çok memnun kaldık gerçekten çok doğal",
        commentEn:
          "We bought jar honey and comb honey, we were very satisfied, really very natural",
        date: "20 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18404546206112811/",
      },
      {
        name: "Ayşe Aydın",
        commentTr: "Emeğinize sağlık 👏 doğallığı ve tadı mükemmel 🌻",
        commentEn:
          "Thank you for your effort 👏 its naturalness and taste are perfect 🌻",
        date: "27 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/17860922025466897/",
      },
      {
        name: "Hakan Bilgin",
        commentTr:
          "Hayıt balını kullandık. Aroması nadir, lezzeti mükemmeldi. Üreten arkadaşların emeklerine sağlık",
        commentEn:
          "We used chaste tree honey. Its aroma is rare, its taste was perfect. Thank you to the friends who produced it",
        date: "22 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/17876862222284743/",
      },
      {
        name: "Erim Kılınç",
        commentTr:
          "Hem petek balı hemde kavanoz balından aldım, birinci sınıf Rahmetli dedemin kovanları olduğu için çocukluğumun lezzetine tekrar kavuşmuş oldum",
        commentEn:
          "I bought both comb honey and jar honey, first class. Since my late grandfather had beehives, I was reunited with the taste of my childhood",
        date: "20 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18038453081437367/",
      },
      {
        name: "Faruk Kurt",
        commentTr: "Çok beğendim. Çok güvenilir emeklerinize sağlık 👏",
        commentEn: "I loved it. Very reliable, thank you for your effort 👏",
        date: "29 August, 2025",
        url: "https://www.instagram.com/p/DNBuvY_My2e/c/18090214426746958/",
      },
      {
        name: "Ferhat Karaca",
        commentTr: "Harika olmuş emeklerinize sağlık 👏",
        commentEn: "It turned out great, thank you for your effort 👏",
        date: "29 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18174250735353086/",
      },
      {
        name: "Özlem Duraydın",
        commentTr: "Çok lezzetli mükemmel bir bal.Emeğinize sağlık👏",
        commentEn:
          "A very delicious, perfect honey. Thank you for your effort👏",
        date: "12 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18522901870028596/",
      },
      {
        name: "İpek Aydın",
        commentTr: "Ellerinize sağlık çok kaliteli ve lezzetliydi 👏🏻",
        commentEn: "Thank you, it was very high quality and delicious 👏🏻",
        date: "10 August, 2025",
        url: "https://www.instagram.com/p/DMdmrOOM2s7/c/18075902464809215/",
      },
      {
        name: "Diş Hekimi Soner Çoruk",
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
        name: "İbrahim Zaralıoğlu",
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
        titleEn: "Effect of a Honey-Sweetened Beverage on Muscle Soreness and Recovery After Exercise-Induced Muscle Damage in Strength-Trained Females (2024)",
        titleTr: "Bal ile Tatlandırılmış İçeceğin Kuvvet Antrenmanlı Kadınlarda Egzersize Bağlı Kas Hasarı Sonrası Kas Ağrısı ve Toparlanma Üzerine Etkisi (2024)",
        date: "2026-06-05",
        summaryEn: "Randomized crossover trial showing a honey-sweetened beverage reduces muscle soreness and supports recovery after exercise-induced muscle damage.",
        summaryTr: "Randomize çapraz geçişli çalışma, bal ile tatlandırılmış içeceğin egzersize bağlı kas hasarı sonrası kas ağrısını azalttığını ve toparlanmayı desteklediğini göstermektedir.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.3389/fphys.2024.1426872"
      },
      {
        titleEn: "Effect of Honey Supplementation on Skeletal Muscle Inflammatory Markers Among Military Graduates After Overtraining (2025)",
        titleTr: "Bal Takviyesinin Aşırı Antrenman Sonrası Askeri Mezunlarda İskelet Kası İnflamatuar Belirteçleri Üzerine Etkisi (2025)",
        date: "2026-05-28",
        summaryEn: "Double-blind clinical trial demonstrating that honey supplementation lowers skeletal muscle inflammatory markers following overtraining.",
        summaryTr: "Çift kör klinik çalışma, bal takviyesinin aşırı antrenman sonrası iskelet kası inflamatuar belirteçlerini düşürdüğünü göstermektedir.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.1002/hsr2.70428"
      },
      {
        titleEn: "Could It Bee? Honey Ingestion Induces Comparable Metabolic Responses to Traditional Carbohydrates During Steady-State Cycling (2025)",
        titleTr: "Bal Olabilir mi? Bal Tüketimi Dengeli Bisiklet Sürüşü Sırasında Geleneksel Karbonhidratlara Benzer Metabolik Yanıtlar Oluşturur (2025)",
        date: "2026-05-20",
        summaryEn: "Randomized crossover trial finding that honey produces metabolic responses comparable to traditional carbohydrates during three hours of steady-state cycling.",
        summaryTr: "Randomize çapraz geçişli çalışma, balın üç saatlik dengeli bisiklet sürüşü sırasında geleneksel karbonhidratlara benzer metabolik yanıtlar oluşturduğunu bulmuştur.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.1123/ijsnem.2024-0244"
      },
      {
        titleEn: "Carbohydrates and Endurance Exercise: A Narrative Review of a Food First Approach (2023)",
        titleTr: "Karbonhidratlar ve Dayanıklılık Egzersizi: Önce Gıda Yaklaşımının Anlatısal Bir Derlemesi (2023)",
        date: "2026-05-12",
        summaryEn: "Narrative review supporting a food-first approach to carbohydrate intake for endurance exercise, including natural sources such as honey.",
        summaryTr: "Bal gibi doğal kaynaklar dahil, dayanıklılık egzersizi için karbonhidrat alımında önce gıda yaklaşımını destekleyen anlatısal derleme.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.3390/nu15061367"
      },
      {
        titleEn: "Honey on Brain Health: A Promising Brain Booster (2023)",
        titleTr: "Beyin Sağlığında Bal: Umut Verici Bir Beyin Güçlendirici (2023)",
        date: "2026-05-04",
        summaryEn: "Review highlighting honey's polyphenols as supportive of cognitive function, memory, and overall brain health.",
        summaryTr: "Balın polifenollerinin bilişsel işlevi, hafızayı ve genel beyin sağlığını desteklediğini vurgulayan derleme.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.3389/fnagi.2022.1092596"
      },
      {
        titleEn: "The Potential Use of Honey as a Neuroprotective Agent for the Management of Neurodegenerative Diseases (2023)",
        titleTr: "Nörodejeneratif Hastalıkların Yönetiminde Nöroprotektif Ajan Olarak Balın Potansiyel Kullanımı (2023)",
        date: "2026-04-26",
        summaryEn: "Review examining honey's neuroprotective potential against neurodegenerative diseases through its antioxidant and anti-inflammatory actions.",
        summaryTr: "Balın antioksidan ve anti-inflamatuar etkileri aracılığıyla nörodejeneratif hastalıklara karşı nöroprotektif potansiyelini inceleyen derleme.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.3390/nu15071558"
      },
      {
        titleEn: "Honey as a Neuroprotective Agent: Molecular Perspectives on Its Role in Alzheimer's Disease (2025)",
        titleTr: "Nöroprotektif Ajan Olarak Bal: Alzheimer Hastalığındaki Rolüne Moleküler Bakış (2025)",
        date: "2026-04-18",
        summaryEn: "Review exploring the molecular mechanisms by which honey may protect against Alzheimer's disease.",
        summaryTr: "Balın Alzheimer hastalığına karşı koruma sağlayabileceği moleküler mekanizmaları araştıran derleme.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.3390/nu17162577"
      },
      {
        titleEn: "Neuroprotective Effects of Royal Jelly and Its Active Compounds on Neurodegenerative Diseases (2024)",
        titleTr: "Arı Sütü ve Aktif Bileşenlerinin Nörodejeneratif Hastalıklar Üzerindeki Nöroprotektif Etkileri (2024)",
        date: "2026-04-10",
        summaryEn: "Review of how royal jelly and active compounds such as 10-HDA exert neuroprotective effects in neurodegenerative diseases.",
        summaryTr: "Arı sütü ve 10-HDA gibi aktif bileşenlerinin nörodejeneratif hastalıklarda nasıl nöroprotektif etki gösterdiğini inceleyen derleme.",
        categories: ["royal-jelly", "brain"],
        url: "https://doi.org/10.3389/fphar.2024.1351119"
      },
      {
        titleEn: "Pro-Cognitive Effect of Royal Jelly Is Linked with Increased Burst Activity of Mesocorticolimbic Dopaminergic Neurons (2025)",
        titleTr: "Arı Sütünün Bilişsel Etkisi, Mezokortikolimbik Dopaminerjik Nöronların Artan Aktivitesiyle İlişkilidir (2025)",
        date: "2026-04-02",
        summaryEn: "Research showing royal jelly's pro-cognitive effects are linked to increased burst activity of mesocorticolimbic dopaminergic neurons.",
        summaryTr: "Arı sütünün bilişsel etkilerinin mezokortikolimbik dopaminerjik nöronların artan aktivitesiyle ilişkili olduğunu gösteren araştırma.",
        categories: ["royal-jelly", "brain"],
        url: "https://doi.org/10.3390/nu17223593"
      },
      {
        titleEn: "Royal Jelly Mitigates Cognitive Decline and Anxiety in Female Mice: A Neuroprotective Solution for Alzheimer's Disease (2026)",
        titleTr: "Arı Sütü Dişi Farelerde Bilişsel Gerileme ve Anksiyeteyi Azaltır: Alzheimer Hastalığı için Nöroprotektif Bir Çözüm (2026)",
        date: "2026-03-25",
        summaryEn: "In vivo study demonstrating that royal jelly reduces cognitive decline and anxiety in a female mouse model of Alzheimer's disease.",
        summaryTr: "Arı sütünün Alzheimer hastalığının dişi fare modelinde bilişsel gerilemeyi ve anksiyeteyi azalttığını gösteren in vivo çalışma.",
        categories: ["royal-jelly", "brain"],
        url: "https://doi.org/10.3390/compounds6010008"
      },
      {
        titleEn: "Immunomodulatory and Anti-Inflammatory Properties of Honey and Bee Products (2025)",
        titleTr: "Bal ve Arı Ürünlerinin İmmünomodülatör ve Anti-İnflamatuar Özellikleri (2025)",
        date: "2026-03-17",
        summaryEn: "Review of the immunomodulatory and anti-inflammatory properties shared across honey, propolis, royal jelly, and bee pollen.",
        summaryTr: "Bal, propolis, arı sütü ve arı poleninin ortak immünomodülatör ve anti-inflamatuar özelliklerini inceleyen derleme.",
        categories: ["honey", "propolis", "royal-jelly", "pollen", "immunity"],
        url: "https://doi.org/10.3390/apitherapyreports5020019"
      },
      {
        titleEn: "Propolis Supplementation on Inflammatory and Oxidative Stress Biomarkers: A Systematic Review and Meta-Analysis of RCTs (2025)",
        titleTr: "İnflamatuar ve Oksidatif Stres Biyobelirteçleri Üzerine Propolis Takviyesi: RCT'lerin Sistematik Derlemesi ve Meta-Analizi (2025)",
        date: "2026-03-09",
        summaryEn: "Systematic review and meta-analysis of randomized trials showing propolis supplementation improves inflammatory and oxidative stress biomarkers.",
        summaryTr: "Propolis takviyesinin inflamatuar ve oksidatif stres biyobelirteçlerini iyileştirdiğini gösteren randomize çalışmaların sistematik derlemesi ve meta-analizi.",
        categories: ["propolis", "immunity"],
        url: "https://doi.org/10.3389/fnut.2025.1542184"
      },
      {
        titleEn: "Antimicrobial Potential of Bee-Derived Products: Honey, Propolis and Bee Venom (2025)",
        titleTr: "Arı Kaynaklı Ürünlerin Antimikrobiyal Potansiyeli: Bal, Propolis ve Arı Zehri (2025)",
        date: "2026-03-01",
        summaryEn: "Review of the antimicrobial potential of bee-derived products including honey and propolis against pathogenic microorganisms.",
        summaryTr: "Bal ve propolis dahil arı kaynaklı ürünlerin patojen mikroorganizmalara karşı antimikrobiyal potansiyelini inceleyen derleme.",
        categories: ["honey", "propolis", "immunity"],
        url: "https://doi.org/10.3390/pathogens14080780"
      },
      {
        titleEn: "Royal Jelly: A Promising Therapeutic Intervention and Functional Food Supplement (2024)",
        titleTr: "Arı Sütü: Umut Verici Bir Terapötik Müdahale ve Fonksiyonel Gıda Takviyesi (2024)",
        date: "2026-02-21",
        summaryEn: "Systematic review of royal jelly's therapeutic potential as a functional food, including immune support and wound healing.",
        summaryTr: "Arı sütünün bağışıklık desteği ve yara iyileşmesi dahil fonksiyonel gıda olarak terapötik potansiyelini inceleyen sistematik derleme.",
        categories: ["royal-jelly", "immunity", "wound-healing"],
        url: "https://doi.org/10.1016/j.heliyon.2024.e37138"
      },
      {
        titleEn: "Unlocking the Healing Potential: Medical-Grade Honey in Wound Management and Tissue Regeneration (2025)",
        titleTr: "İyileştirici Potansiyeli Açığa Çıkarmak: Yara Yönetimi ve Doku Rejenerasyonunda Tıbbi Sınıf Bal (2025)",
        date: "2026-02-13",
        summaryEn: "Narrative review of medical-grade honey's role in wound management and tissue regeneration.",
        summaryTr: "Tıbbi sınıf balın yara yönetimi ve doku rejenerasyonundaki rolünü inceleyen anlatısal derleme.",
        categories: ["honey", "wound-healing"],
        url: "https://doi.org/10.1002/hsr2.70240"
      },
      {
        titleEn: "The Use of Honey for Cicatrization and Pain Control of Obstetric Wounds (2024)",
        titleTr: "Obstetrik Yaraların İyileşmesi ve Ağrı Kontrolünde Balın Kullanımı (2024)",
        date: "2026-02-05",
        summaryEn: "Systematic review and meta-analysis evaluating honey for wound cicatrization and pain control in obstetric wounds.",
        summaryTr: "Obstetrik yaralarda yara iyileşmesi ve ağrı kontrolü için balı değerlendiren sistematik derleme ve meta-analiz.",
        categories: ["honey", "wound-healing"],
        url: "https://doi.org/10.3390/nu16020185"
      },
      {
        titleEn: "Propolis-Functionalized Biomaterials for Wound Healing (2025)",
        titleTr: "Yara İyileşmesi için Propolis ile Fonksiyonelleştirilmiş Biyomalzemeler (2025)",
        date: "2026-01-28",
        summaryEn: "Systematic review of propolis-functionalized biomaterials and their application in wound healing.",
        summaryTr: "Propolis ile fonksiyonelleştirilmiş biyomalzemeleri ve yara iyileşmesindeki uygulamalarını inceleyen sistematik derleme.",
        categories: ["propolis", "wound-healing"],
        url: "https://doi.org/10.3390/bioengineering6030074"
      },
      {
        titleEn: "Bee Products and Traditional Plant Therapies for Wound Care (2025)",
        titleTr: "Yara Bakımı için Arı Ürünleri ve Geleneksel Bitki Terapileri (2025)",
        date: "2026-01-20",
        summaryEn: "Review of bee products — honey, propolis, royal jelly, and pollen — alongside traditional plant therapies for wound care.",
        summaryTr: "Yara bakımı için bal, propolis, arı sütü ve polen gibi arı ürünlerini geleneksel bitki terapileriyle birlikte inceleyen derleme.",
        categories: ["honey", "propolis", "royal-jelly", "pollen", "wound-healing"],
        url: "https://doi.org/10.3831/KPI.2025.28.4.255"
      },
      {
        titleEn: "Antioxidant and Anti-Inflammatory Properties of Bee Pollen from Acorn and Darae (2024)",
        titleTr: "Meşe ve Darae Arı Poleninin Antioksidan ve Anti-İnflamatuar Özellikleri (2024)",
        date: "2026-01-12",
        summaryEn: "Research demonstrating strong antioxidant and anti-inflammatory activity of bee pollen sourced from acorn and darae.",
        summaryTr: "Meşe ve darae kaynaklı arı poleninin güçlü antioksidan ve anti-inflamatuar aktivitesini gösteren araştırma.",
        categories: ["pollen", "immunity"],
        url: "https://doi.org/10.3390/antiox13080981"
      },
      {
        titleEn: "Chemical Properties and Biological Activity of Bee Pollen (2023)",
        titleTr: "Arı Poleninin Kimyasal Özellikleri ve Biyolojik Aktivitesi (2023)",
        date: "2026-01-04",
        summaryEn: "Review of the chemical composition of bee pollen and its diverse biological activities.",
        summaryTr: "Arı poleninin kimyasal bileşimini ve çeşitli biyolojik aktivitelerini inceleyen derleme.",
        categories: ["pollen"],
        url: "https://doi.org/10.3390/molecules28237768"
      },
      {
        titleEn: "Antioxidant-Rich Polyfloral Bee Pollen Exerts Antimicrobial and Anti-Inflammatory Effects in Lung Epithelial Cells (2025)",
        titleTr: "Antioksidan Açısından Zengin Çok Çiçekli Arı Poleni Akciğer Epitel Hücrelerinde Antimikrobiyal ve Anti-İnflamatuar Etki Gösterir (2025)",
        date: "2025-12-27",
        summaryEn: "Research showing antioxidant-rich polyfloral bee pollen exerts antimicrobial and anti-inflammatory effects in A549 lung epithelial cells.",
        summaryTr: "Antioksidan açısından zengin çok çiçekli arı poleninin A549 akciğer epitel hücrelerinde antimikrobiyal ve anti-inflamatuar etki gösterdiğini ortaya koyan araştırma.",
        categories: ["pollen", "immunity"],
        url: "https://doi.org/10.3390/foods14050802"
      },
      {
        titleEn: "Chemical Composition of Egyptian Propolis and Antimicrobial Activity in Combination with Honey Against MDR Uropathogens (2025)",
        titleTr: "Mısır Propolisinin Kimyasal Bileşimi ve Bal ile Kombinasyon Halinde Çoklu İlaca Dirençli Üropatojenlere Karşı Antimikrobiyal Aktivitesi (2025)",
        date: "2025-12-19",
        summaryEn: "Research characterizing Egyptian propolis and demonstrating its antimicrobial activity, combined with honey, against multidrug-resistant uropathogens.",
        summaryTr: "Mısır propolisini karakterize eden ve bal ile birlikte çoklu ilaca dirençli üropatojenlere karşı antimikrobiyal aktivitesini gösteren araştırma.",
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

    // Category label mapping for bilingual tags
    const categoryLabels = {
      "honey": { en: "Honey", tr: "Bal" },
      "brain": { en: "Brain", tr: "Beyin" },
      "exercise": { en: "Exercise", tr: "Egzersiz" },
      "immunity": { en: "Immunity", tr: "Bağışıklık" },
      "wound-healing": { en: "Wound Healing", tr: "Yara İyileşmesi" },
      "propolis": { en: "Propolis", tr: "Propolis" },
      "royal-jelly": { en: "Royal Jelly", tr: "Arı Sütü" },
      "pollen": { en: "Pollen", tr: "Polen" }
    };

    function getFilteredArticles() {
      let filtered = currentCategory === "all"
        ? articles
        : articles.filter(function(a) { return a.categories.indexOf(currentCategory) !== -1; });
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
          '<h3 class="science-card-title">' + title + '</h3>' +
          '<span class="science-card-date">' + formatDate(article.date) + '</span>' +
          '<p class="science-card-summary">' + summary + '</p>' +
          '<div class="science-card-tags">' + tags + '</div>' +
          '<a href="' + article.url + '" target="_blank" rel="noopener noreferrer" class="science-card-link">' +
            readText +
            ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</a>' +
        '</div>';
      });

      grid.innerHTML = html;
      renderPagination(filtered.length, totalPages);
    }

    function renderPagination(total, totalPages) {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
      }

      var prevText = currentLang === "tr" ? "Önceki" : "Prev";
      var nextText = currentLang === "tr" ? "Sonraki" : "Next";

      var html = '<button class="pagination-btn' + (currentPage === 1 ? ' disabled' : '') + '" data-page="prev">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
        '</button>';

      for (var i = 1; i <= totalPages; i++) {
        html += '<button class="pagination-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
      }

      html += '<button class="pagination-btn' + (currentPage === totalPages ? ' disabled' : '') + '" data-page="next">' +
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
  updateLanguage("tr");

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
