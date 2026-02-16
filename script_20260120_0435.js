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
    ".gallery-section, .products-section, .partners-section, .about-item, .team-member, .testimonials-section, .faq-section, .science-section",
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
        titleEn: "Honey and Health: A Review of Recent Clinical Research (2017)",
        titleTr: "Bal ve Sağlık: Güncel Klinik Araştırmaların Derlemesi (2017)",
        date: "2025-12-15",
        summaryEn: "Comprehensive review showing honey's therapeutic potential including antimicrobial, anti-inflammatory, and wound-healing properties.",
        summaryTr: "Balın antimikrobiyal, anti-inflamatuar ve yara iyileştirici özellikleri dahil terapötik potansiyelini gösteren kapsamlı derleme.",
        categories: ["honey"],
        url: "https://doi.org/10.1002/ptr.5767"
      },
      {
        titleEn: "Neurological Effects of Honey: Current and Future Prospects (2014)",
        titleTr: "Balın Nörolojik Etkileri: Güncel ve Gelecek Beklentiler (2014)",
        date: "2025-12-18",
        summaryEn: "Evidence that honey polyphenols may counteract oxidative stress in the brain, supporting cognitive health and neuroprotection.",
        summaryTr: "Bal polifenollerinin beyindeki oksidatif stresi azaltarak bilişsel sağlığı ve nöroproteksiyonu destekleyebileceğine dair kanıtlar.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.1155/2014/958721"
      },
      {
        titleEn: "Exercise and Brain Health: Mechanisms and Implications (2019)",
        titleTr: "Egzersiz ve Beyin Sağlığı: Mekanizmalar ve Sonuçlar (2019)",
        date: "2025-12-20",
        summaryEn: "Physical exercise promotes neuroplasticity and BDNF expression, reducing risk of neurodegenerative diseases.",
        summaryTr: "Fiziksel egzersiz nöroplastisiteyi ve BDNF ifadesini artırarak nörodejeneratif hastalık riskini azaltır.",
        categories: ["exercise", "brain"],
        url: "https://doi.org/10.1016/j.tins.2019.01.003"
      },
      {
        titleEn: "Hallmarks of Aging: An Expanding Universe (2023)",
        titleTr: "Yaşlanmanın Belirteçleri: Genişleyen Bir Evren (2023)",
        date: "2025-12-22",
        summaryEn: "Updated framework identifying twelve hallmarks of aging with potential intervention targets for longevity research.",
        summaryTr: "Uzun ömür araştırmaları için potansiyel müdahale hedefleriyle yaşlanmanın on iki belirtecini tanımlayan güncellenmiş çerçeve.",
        categories: ["longevity", "anti-aging"],
        url: "https://doi.org/10.1016/j.cell.2022.11.001"
      },
      {
        titleEn: "Propolis: A Detailed Insight on its Biological Activities (2021)",
        titleTr: "Propolis: Biyolojik Aktiviteleri Üzerine Detaylı Bir İnceleme (2021)",
        date: "2025-12-25",
        summaryEn: "Propolis demonstrates significant antioxidant, antimicrobial, and immunomodulatory effects across multiple clinical studies.",
        summaryTr: "Propolis, birden fazla klinik çalışmada önemli antioksidan, antimikrobiyal ve immünomodülatör etkiler göstermiştir.",
        categories: ["propolis"],
        url: "https://doi.org/10.3390/antiox10020162"
      },
      {
        titleEn: "Royal Jelly and Its Components: A Review of Biological Actions (2018)",
        titleTr: "Arı Sütü ve Bileşenleri: Biyolojik Etkilerin Derlemesi (2018)",
        date: "2025-12-28",
        summaryEn: "Royal jelly contains 10-HDA and royalactin with demonstrated anti-aging, anti-inflammatory, and neuroprotective effects.",
        summaryTr: "Arı sütü, anti-aging, anti-inflamatuar ve nöroprotektif etkileri kanıtlanmış 10-HDA ve royalactin içerir.",
        categories: ["royal-jelly", "anti-aging"],
        url: "https://doi.org/10.1016/j.jff.2018.06.012"
      },
      {
        titleEn: "Bee Pollen: Chemical Composition and Therapeutic Application (2015)",
        titleTr: "Arı Poleni: Kimyasal Bileşim ve Terapötik Uygulama (2015)",
        date: "2026-01-02",
        summaryEn: "Bee pollen is a rich source of proteins, vitamins, and flavonoids with hepatoprotective and anti-inflammatory properties.",
        summaryTr: "Arı poleni, hepatoprotektif ve anti-inflamatuar özelliklere sahip zengin bir protein, vitamin ve flavonoid kaynağıdır.",
        categories: ["pollen"],
        url: "https://doi.org/10.1155/2015/584205"
      },
      {
        titleEn: "Effects of Honey on Oxidative Stress and Metabolic Parameters (2018)",
        titleTr: "Balın Oksidatif Stres ve Metabolik Parametreler Üzerine Etkileri (2018)",
        date: "2026-01-05",
        summaryEn: "Regular honey consumption improves glycemic control and lipid profiles while reducing markers of oxidative stress.",
        summaryTr: "Düzenli bal tüketimi, oksidatif stres belirteçlerini azaltırken glisemik kontrol ve lipid profillerini iyileştirir.",
        categories: ["honey", "longevity"],
        url: "https://doi.org/10.3390/nu10101500"
      },
      {
        titleEn: "Caloric Restriction and Longevity: Molecular Mechanisms (2020)",
        titleTr: "Kalori Kısıtlaması ve Uzun Ömür: Moleküler Mekanizmalar (2020)",
        date: "2026-01-08",
        summaryEn: "Caloric restriction activates sirtuins and autophagy pathways, extending healthspan across multiple model organisms.",
        summaryTr: "Kalori kısıtlaması sirtuinleri ve otofaji yolaklarını aktive ederek birden fazla model organizmada sağlıklı ömrü uzatır.",
        categories: ["longevity", "anti-aging"],
        url: "https://doi.org/10.1126/science.aax9297"
      },
      {
        titleEn: "Propolis and the Immune System: A Review (2019)",
        titleTr: "Propolis ve Bağışıklık Sistemi: Bir Derleme (2019)",
        date: "2026-01-10",
        summaryEn: "Propolis enhances innate and adaptive immunity through modulation of macrophage activity and cytokine production.",
        summaryTr: "Propolis, makrofaj aktivitesini ve sitokin üretimini modüle ederek doğal ve adaptif bağışıklığı güçlendirir.",
        categories: ["propolis"],
        url: "https://doi.org/10.1155/2019/1250802"
      },
      {
        titleEn: "Physical Activity, Brain Plasticity, and Alzheimer's Disease (2020)",
        titleTr: "Fiziksel Aktivite, Beyin Plastisitesi ve Alzheimer Hastalığı (2020)",
        date: "2026-01-12",
        summaryEn: "Aerobic exercise significantly reduces amyloid-beta accumulation and improves hippocampal neurogenesis.",
        summaryTr: "Aerobik egzersiz, amiloid-beta birikimini önemli ölçüde azaltır ve hipokampal nörojenezi iyileştirir.",
        categories: ["exercise", "brain", "anti-aging"],
        url: "https://doi.org/10.3389/fnins.2020.00131"
      },
      {
        titleEn: "Royal Jelly: Biological Properties and Clinical Applications (2020)",
        titleTr: "Arı Sütü: Biyolojik Özellikleri ve Klinik Uygulamaları (2020)",
        date: "2026-01-15",
        summaryEn: "Royal jelly supplementation shows promising effects on cognitive function, fertility, and skin aging in human trials.",
        summaryTr: "Arı sütü takviyesi, insan denemelerinde bilişsel işlev, doğurganlık ve cilt yaşlanması üzerinde umut verici etkiler göstermektedir.",
        categories: ["royal-jelly", "brain", "anti-aging"],
        url: "https://doi.org/10.1016/j.biopha.2020.110138"
      },
      {
        titleEn: "Honey as a Complementary Medicine: A Review of Honey in Exercise and Sport (2019)",
        titleTr: "Tamamlayıcı Tıpta Bal: Egzersiz ve Sporda Bal Derlemesi (2019)",
        date: "2026-01-18",
        summaryEn: "Honey serves as an effective natural energy source for athletes, supporting endurance and recovery post-exercise.",
        summaryTr: "Bal, sporcular için etkili bir doğal enerji kaynağı olarak dayanıklılığı ve egzersiz sonrası toparlanmayı destekler.",
        categories: ["honey", "exercise"],
        url: "https://doi.org/10.3390/nu11102039"
      },
      {
        titleEn: "Bee Pollen Polyphenols: Anti-Aging and Protective Effects (2021)",
        titleTr: "Arı Poleni Polifenolleri: Anti-Aging ve Koruyucu Etkiler (2021)",
        date: "2026-01-20",
        summaryEn: "Pollen-derived polyphenols protect against cellular senescence and DNA damage through multiple antioxidant pathways.",
        summaryTr: "Polenden elde edilen polifenoller, birden fazla antioksidan yolak aracılığıyla hücresel yaşlanmaya ve DNA hasarına karşı koruma sağlar.",
        categories: ["pollen", "anti-aging"],
        url: "https://doi.org/10.3390/molecules26041014"
      },
      {
        titleEn: "The Gut-Brain Axis: How the Microbiome Influences Cognition (2021)",
        titleTr: "Bağırsak-Beyin Aksı: Mikrobiyom Bilişi Nasıl Etkiler (2021)",
        date: "2026-01-22",
        summaryEn: "Prebiotic properties of honey and bee products positively modulate the gut microbiome, influencing brain health via the gut-brain axis.",
        summaryTr: "Bal ve arı ürünlerinin prebiyotik özellikleri bağırsak mikrobiyomunu olumlu yönde düzenleyerek bağırsak-beyin aksı üzerinden beyin sağlığını etkiler.",
        categories: ["honey", "brain", "longevity"],
        url: "https://doi.org/10.3390/nu13072099"
      },
      {
        titleEn: "Propolis as an Adjunct Therapy in Metabolic Syndrome (2022)",
        titleTr: "Metabolik Sendromda Yardımcı Terapi Olarak Propolis (2022)",
        date: "2026-01-25",
        summaryEn: "Propolis supplementation significantly improves insulin resistance, blood lipids, and inflammatory markers in metabolic syndrome patients.",
        summaryTr: "Propolis takviyesi, metabolik sendrom hastalarında insülin direncini, kan lipidlerini ve inflamasyon belirteçlerini önemli ölçüde iyileştirir.",
        categories: ["propolis", "longevity"],
        url: "https://doi.org/10.3390/nu14010135"
      },
      {
        titleEn: "Resistance Training and Longevity: A Systematic Review (2022)",
        titleTr: "Direnç Eğitimi ve Uzun Ömür: Sistematik Bir Derleme (2022)",
        date: "2026-01-28",
        summaryEn: "Resistance exercise reduces all-cause mortality risk by 15-27% and preserves muscle mass critical for healthy aging.",
        summaryTr: "Direnç egzersizi tüm nedenlere bağlı ölüm riskini %15-27 azaltır ve sağlıklı yaşlanma için kritik olan kas kütlesini korur.",
        categories: ["exercise", "longevity"],
        url: "https://doi.org/10.1136/bjsports-2022-105669"
      },
      {
        titleEn: "Neuroprotective Properties of Honey: Focus on Tualang Honey (2016)",
        titleTr: "Balın Nöroprotektif Özellikleri: Tualang Balı Odaklı (2016)",
        date: "2026-02-01",
        summaryEn: "Tualang honey protects against oxidative neuronal damage and reduces neuroinflammation in experimental brain injury models.",
        summaryTr: "Tualang balı, deneysel beyin hasarı modellerinde oksidatif nöronal hasara karşı koruma sağlar ve nöroinflamasyonu azaltır.",
        categories: ["honey", "brain"],
        url: "https://doi.org/10.1155/2016/6065626"
      },
      {
        titleEn: "Bee Pollen in Human Nutrition and Health: A Comprehensive Review (2022)",
        titleTr: "İnsan Beslenmesi ve Sağlığında Arı Poleni: Kapsamlı Bir Derleme (2022)",
        date: "2026-02-03",
        summaryEn: "Bee pollen demonstrates versatile health benefits including anti-allergic, antimicrobial, and cardiovascular protective properties.",
        summaryTr: "Arı poleni, anti-alerjik, antimikrobiyal ve kardiyovasküler koruyucu özellikleri dahil çok yönlü sağlık faydaları göstermektedir.",
        categories: ["pollen", "longevity"],
        url: "https://doi.org/10.3390/nu14081518"
      },
      {
        titleEn: "Royal Jelly Peptides: A New Frontier in Anti-Aging Research (2023)",
        titleTr: "Arı Sütü Peptitleri: Anti-Aging Araştırmalarında Yeni Bir Sınır (2023)",
        date: "2026-02-05",
        summaryEn: "Novel peptides isolated from royal jelly activate telomerase and enhance mitochondrial function in human cell lines.",
        summaryTr: "Arı sütünden izole edilen yeni peptitler, insan hücre hatlarında telomerazı aktive eder ve mitokondriyal işlevi artırır.",
        categories: ["royal-jelly", "anti-aging", "longevity"],
        url: "https://doi.org/10.1016/j.jff.2023.105478"
      },
      {
        titleEn: "Synergistic Effects of Propolis and Royal Jelly on Immune Function (2021)",
        titleTr: "Propolis ve Arı Sütünün Bağışıklık İşlevi Üzerindeki Sinerjik Etkileri (2021)",
        date: "2026-02-07",
        summaryEn: "Combined propolis and royal jelly supplementation enhances NK cell activity and antibody production more than either alone.",
        summaryTr: "Propolis ve arı sütü birlikte takviyesi, NK hücre aktivitesini ve antikor üretimini tek başına alımdan daha fazla artırır.",
        categories: ["propolis", "royal-jelly"],
        url: "https://doi.org/10.3390/nu13041073"
      },
      {
        titleEn: "Mediterranean Diet, Honey, and Cardiovascular Health (2020)",
        titleTr: "Akdeniz Diyeti, Bal ve Kardiyovasküler Sağlık (2020)",
        date: "2026-02-09",
        summaryEn: "Replacing refined sugars with natural honey in a Mediterranean diet reduces cardiovascular risk factors by up to 20%.",
        summaryTr: "Akdeniz diyetinde rafine şekerlerin doğal bal ile değiştirilmesi kardiyovasküler risk faktörlerini %20'ye kadar azaltır.",
        categories: ["honey", "longevity"],
        url: "https://doi.org/10.3390/nu12041057"
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
      "longevity": { en: "Longevity", tr: "Uzun Ömür" },
      "anti-aging": { en: "Anti-Aging", tr: "Yaşlanma Karşıtı" },
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
