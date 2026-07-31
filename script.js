const workData = window.portfolioWorks || [];
const featuredGrid = document.querySelector("#featured-work-grid");
const allWorkGrid = document.querySelector("#all-work-grid");
const categoryRoot = document.querySelector("#category-root");
const projectRoot = document.querySelector("#project-root");

const workCardTemplate = (work, linkMode = "category") => {
  const href =
    linkMode === "project"
      ? `project.html?slug=${encodeURIComponent(work.slug)}`
      : `category.html?category=${encodeURIComponent(work.category)}`;
  const label = linkMode === "project" ? `查看 ${work.title} 项目详情` : `查看 ${work.categoryLabel}项目集合`;

  return `
  <a class="work-card" data-category="${work.category}" href="${href}" aria-label="${label}">
    <div class="work-visual work-photo">
      <img src="${work.image}" alt="${work.alt}" loading="lazy" />
    </div>
    <div class="work-meta">
      <div>
        <h3>${work.title}</h3>
        <p>${work.description}</p>
      </div>
      <time>${work.year}</time>
    </div>
  </a>
`;
};

const renderWorkGrid = (container, works, linkMode = "category") => {
  if (!container) return;
  container.innerHTML = works.map((work) => workCardTemplate(work, linkMode)).join("");
};

renderWorkGrid(
  featuredGrid,
  workData.filter((work) => work.featured).slice(0, 8),
  "category",
);
renderWorkGrid(allWorkGrid, workData, "category");

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

const categoryCopy = {
  brand: "品牌识别与应用物料的完整视觉探索。",
  logo: "从概念提炼到视觉符号，建立清晰的品牌记忆点。",
  ecommerce: "围绕产品卖点与购买决策，构建更接近成交的视觉路径。",
  detail: "用清晰的版式与内容节奏，让产品价值更快被理解。",
  packaging: "把品牌气质、产品信息与货架表现装进每一个触点。",
  print: "在纸面、展会与传播场景中，探索信息与视觉的平衡。",
  ui: "从移动端界面到本地生活场景，建立轻量的使用体验。",
};

function renderCategoryPage() {
  if (!categoryRoot) return;

  const category = new URLSearchParams(window.location.search).get("category");
  const categoryWorks = workData.filter((work) => work.category === category);
  const categoryLabel = categoryWorks[0]?.categoryLabel || "作品分类";

  if (!categoryWorks.length) {
    categoryRoot.innerHTML = `
      <section class="section-wrap project-missing">
        <p class="eyebrow">作品分类</p>
        <h1>这个分类暂时还没有项目。</h1>
        <a class="button button-dark" href="works.html">返回全部作品</a>
      </section>
    `;
    return;
  }

  document.title = `${categoryLabel} | 泽霖印象`;
  categoryRoot.innerHTML = `
    <section class="section-wrap category-page-intro">
      <a class="back-link" href="works.html">← 返回全部作品</a>
      <p class="eyebrow">${categoryLabel} / ${categoryWorks.length} 个项目</p>
      <h1>${categoryLabel}<br />让同一种专业，拥有不同的表达。</h1>
      <p class="page-lead">${categoryCopy[category] || "浏览这一类别下的项目案例与视觉探索。"}</p>
    </section>
    <section class="section-wrap category-projects" aria-labelledby="category-projects-title">
      <div class="section-title">
        <h2 id="category-projects-title">${categoryLabel}项目</h2>
        <p>${categoryWorks.length} 个项目</p>
      </div>
      <div class="work-grid" id="category-work-grid"></div>
    </section>
  `;

  renderWorkGrid(document.querySelector("#category-work-grid"), categoryWorks, "project");
  categoryRoot.querySelectorAll(".section-wrap").forEach((section) => section.classList.add("reveal"));
}

renderCategoryPage();

function renderProjectPage() {
  if (!projectRoot) return;

  const slug = new URLSearchParams(window.location.search).get("slug");
  const workIndex = workData.findIndex((work) => work.slug === slug);
  const work = workData[workIndex];

  if (!work) {
    projectRoot.innerHTML = `
      <section class="section-wrap project-missing">
        <p class="eyebrow">项目不存在</p>
        <h1>这个项目还没有找到。</h1>
        <a class="button button-dark" href="works.html">返回全部作品</a>
      </section>
    `;
    return;
  }

  const previousWork = workData[(workIndex - 1 + workData.length) % workData.length];
  const nextWork = workData[(workIndex + 1) % workData.length];
  const detailImages = work.detailImages || [];
  const gallery = detailImages.length
    ? detailImages
        .map(
          (image, index) => `
            <figure class="project-gallery-item">
              <img src="${image.src}" alt="${image.alt || `${work.title} 详情配图 ${index + 1}`}" loading="lazy" />
            </figure>
          `,
        )
        .join("")
    : [1, 2, 3]
        .map(
          (index) => `
            <div class="project-gallery-placeholder">
              <span>DETAIL IMAGE 0${index}</span>
              <strong>详情配图待补充</strong>
              <p>可放置项目过程图、设计细节或应用场景图。</p>
            </div>
          `,
        )
        .join("");

  document.title = `${work.title} | 泽霖印象`;
  projectRoot.innerHTML = `
    <section class="section-wrap project-overview">
      <a class="back-link" href="category.html?category=${encodeURIComponent(work.category)}">← 返回${work.categoryLabel}项目</a>
      <div class="project-overview-copy">
        <p class="eyebrow">项目概览</p>
        <h2>${work.detailIntro}</h2>
      </div>
      <dl class="project-facts">
        <div><dt>项目类型</dt><dd>${work.categoryLabel}</dd></div>
        <div><dt>服务内容</dt><dd>${work.service}</dd></div>
        <div><dt>合作品牌</dt><dd>${work.client}</dd></div>
        <div><dt>项目年份</dt><dd>${work.year}</dd></div>
      </dl>
    </section>

    <section class="section-wrap project-gallery-section">
      <div class="section-title">
        <h2>项目细节</h2>
        <p>过程与应用展示</p>
      </div>
      <div class="project-gallery project-gallery-${work.slug}">${gallery}</div>
    </section>

    <nav class="section-wrap project-pagination" aria-label="项目切换">
      <a class="project-pagination-link" href="project.html?slug=${previousWork.slug}">
        <span>上一个项目</span>
        <strong>${previousWork.title}</strong>
      </a>
      <a class="project-pagination-link project-pagination-next" href="project.html?slug=${nextWork.slug}">
        <span>下一个项目</span>
        <strong>${nextWork.title} →</strong>
      </a>
    </nav>
  `;
}

renderProjectPage();

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
