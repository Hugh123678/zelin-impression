const filterButtons = document.querySelectorAll("[data-filter]");
const workCards = document.querySelectorAll(".work-card");
const siteHeader = document.querySelector(".site-header");
const revealSections = document.querySelectorAll(".section-wrap, .site-footer");
const beamsCanvas = document.querySelector(".beams-canvas");
const heroSequenceFrame = document.querySelector(".hero-sequence-frame");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const staggerGroups = [
  ".service-grid article",
  ".work-card",
  ".process-list > div",
  ".contact-grid a",
  ".tag-list span",
];

revealSections.forEach((section) => section.classList.add("reveal"));

staggerGroups.forEach((selector) => {
  document.querySelectorAll(selector).forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--delay", `${Math.min(index * 70, 420)}ms`);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -8% 0px",
  },
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const updateHeaderDivider = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 8);
};

updateHeaderDivider();
window.addEventListener("scroll", updateHeaderDivider, { passive: true });

function initBeams(canvas) {
  const ctx = canvas.getContext("2d");
  const beams = Array.from({ length: 14 }, (_, index) => ({
    x: (index / 13) * 1.25 - 0.12,
    width: 46 + (index % 4) * 18,
    speed: 0.18 + (index % 5) * 0.045,
    phase: index * 0.68,
    alpha: 0.16 + (index % 3) * 0.035,
  }));
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrame = null;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawBeam = (beam, time) => {
    const drift = Math.sin(time * beam.speed + beam.phase) * width * 0.08;
    const topX = beam.x * width + drift;
    const bottomX = topX - width * 0.22 + Math.cos(time * 0.26 + beam.phase) * width * 0.05;
    const gradient = ctx.createLinearGradient(topX, 0, bottomX, height);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${beam.alpha})`);
    gradient.addColorStop(0.38, `rgba(230, 111, 82, ${beam.alpha * 0.52})`);
    gradient.addColorStop(0.72, `rgba(255, 224, 200, ${beam.alpha * 0.3})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(topX, -height * 0.12);
    ctx.rotate(-0.24 + Math.sin(time * 0.18 + beam.phase) * 0.035);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-beam.width * 0.35, 0);
    ctx.lineTo(beam.width * 0.65, 0);
    ctx.lineTo(beam.width * 2.8, height * 1.25);
    ctx.lineTo(-beam.width * 2.2, height * 1.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawNoise = (time) => {
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "#2a211d";
    for (let i = 0; i < 120; i += 1) {
      const x = (Math.sin(i * 14.13 + time) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 9.71 + time * 0.7) * 0.5 + 0.5) * height;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  };

  const render = (timeMs = 0) => {
    const time = timeMs * 0.001;
    ctx.clearRect(0, 0, width, height);

    beams.forEach((beam) => drawBeam(beam, time));
    drawNoise(time);

    if (!prefersReducedMotion) {
      animationFrame = requestAnimationFrame(render);
    }
  };

  resize();
  render();
  window.addEventListener("resize", () => {
    resize();
    if (prefersReducedMotion) render();
  });
}

if (beamsCanvas) {
  initBeams(beamsCanvas);
}

function initHeroSequence(frame) {
  const frameSources = Array.from({ length: 8 }, (_, index) => `sppt/${index + 1}.png`);
  const preloadedFrames = frameSources.map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  let previousX = null;
  let frameIndex = 0;

  const setFrame = (index) => {
    const nextIndex = Math.max(0, Math.min(frameSources.length - 1, index));
    if (nextIndex === frameIndex) return;
    frameIndex = nextIndex;
    frame.src = frameSources[frameIndex];
  };

  const stepFrame = (clientX) => {
    if (previousX === null) {
      previousX = clientX;
      return;
    }

    const delta = clientX - previousX;
    previousX = clientX;

    if (Math.abs(delta) < 18) return;
    setFrame(frameIndex + Math.sign(delta));
  };

  window.addEventListener("mousemove", (event) => stepFrame(event.clientX));
  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) stepFrame(touch.clientX);
    },
    { passive: true },
  );
  window.addEventListener("mouseleave", () => {
    previousX = null;
  });
}

if (heroSequenceFrame && !prefersReducedMotion) {
  initHeroSequence(heroSequenceFrame);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    workCards.forEach((card) => {
      const isMatch = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !isMatch);

      if (isMatch) {
        card.classList.remove("is-visible");
        requestAnimationFrame(() => card.classList.add("is-visible"));
      }
    });
  });
});
