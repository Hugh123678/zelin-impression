(() => {
  const hero = document.querySelector(".hero");
  const fluidCanvas = document.querySelector(".particle-fluid-canvas");
  const gridCanvas = document.querySelector(".particle-grid-canvas");
  const logoCanvas = document.querySelector(".particle-logo-canvas");

  if (!hero || !fluidCanvas || !gridCanvas || !logoCanvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = {
    x: 0.72,
    y: 0.42,
    smoothX: 0.72,
    smoothY: 0.42,
    active: false,
    moved: false,
  };

  const logoSvg = `
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M36.5 35.5H65.167C65.9031 35.5002 66.4998 36.0969 66.5 36.833C66.5 41.6195 62.6195 45.5 57.833 45.5H36.5C33.7386 45.5 31.5 43.2614 31.5 40.5C31.5 37.7386 33.7386 35.5 36.5 35.5Z" fill="#262320" stroke="#262320"/>
      <path d="M92.167 104.5H113.5C116.261 104.5 118.5 106.739 118.5 109.5C118.5 112.261 116.261 114.5 113.5 114.5H84.833C84.0969 114.5 83.5002 113.903 83.5 113.167C83.5 108.53 87.1415 104.744 91.7207 104.512L92.167 104.5Z" fill="#262320" stroke="#262320"/>
      <path d="M89.8516 40.5H122.35C122.516 40.5 122.584 40.5394 122.619 40.5625C122.674 40.5991 122.747 40.6721 122.801 40.7861C122.855 40.9001 122.866 41.0015 122.859 41.0674C122.855 41.1089 122.842 41.1867 122.736 41.3164L71.377 104.175C68.6231 107.545 64.5008 109.5 60.1484 109.5H27.6504C27.4837 109.5 27.4158 109.461 27.3809 109.438C27.3257 109.401 27.2533 109.328 27.1992 109.214C27.1452 109.1 27.1341 108.998 27.1406 108.933C27.1448 108.891 27.1577 108.813 27.2637 108.684L78.623 45.8252C81.3769 42.4549 85.4992 40.5 89.8516 40.5Z" stroke="#262320" stroke-width="11"/>
      <rect x="5.5" y="5.5" width="139" height="139" rx="26.5" stroke="#262320" stroke-width="11"/>
    </svg>
  `;

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    const resize = () => {
      const rect = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width: rect.width, height: rect.height, dpr };
    };
    return { ctx, resize };
  }

  const fluid = setupCanvas(fluidCanvas);
  const grid = setupCanvas(gridCanvas);
  const logo = setupCanvas(logoCanvas);
  let bounds = fluid.resize();
  grid.resize();
  logo.resize();

  window.addEventListener(
    "mousemove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = pointer.x >= 0 && pointer.x <= 1 && pointer.y >= 0 && pointer.y <= 1;
      pointer.moved = true;
    },
    { passive: true },
  );

  window.addEventListener("mouseleave", () => {
    pointer.active = false;
  });

  window.addEventListener(
    "resize",
    () => {
      bounds = fluid.resize();
      grid.resize();
      logo.resize();
      buildGrid();
      placeParticles();
    },
    { passive: true },
  );

  const gridPoints = [];
  let gridCols = 0;
  let gridRows = 0;

  function buildGrid() {
    const { width, height } = bounds;
    gridCols = Math.ceil(width / 90) + 1;
    gridRows = Math.ceil(height / 90) + 1;
    const ox = (width - (gridCols - 1) * 90) / 2;
    const oy = (height - (gridRows - 1) * 90) / 2;
    gridPoints.length = 0;
    for (let y = 0; y < gridRows; y += 1) {
      for (let x = 0; x < gridCols; x += 1) {
        const px = ox + x * 90;
        const py = oy + y * 90;
        gridPoints.push({ restX: px, restY: py, x: px, y: py, vx: 0, vy: 0 });
      }
    }
  }

  function drawFluid(time) {
    const { ctx } = fluid;
    const { width, height } = bounds;
    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.08;
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.08;

    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#fbfcfe");
    bg.addColorStop(0.44, "#edf6ff");
    bg.addColorStop(1, "#f7f9fc");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const blobs = [
      [0.62, 0.12, 0.38, "#d7efff", 0.52, 0.18],
      [0.82, 0.36, 0.42, "#c4dcfb", 0.38, 0.12],
      [0.46, 0.76, 0.34, "#cae8ff", 0.46, 0.2],
      [0.72, 0.58, 0.24, "#f8e8bf", 0.22, 0.16],
    ];

    blobs.forEach(([x, y, radius, color, alpha, phase], index) => {
      const driftX = Math.sin(time * (0.25 + index * 0.07) + phase * 8) * width * 0.035;
      const driftY = Math.cos(time * (0.18 + index * 0.06) + phase * 5) * height * 0.035;
      const mx = pointer.active ? (pointer.smoothX - 0.5) * width * 0.08 : 0;
      const my = pointer.active ? (pointer.smoothY - 0.5) * height * 0.06 : 0;
      const cx = x * width + driftX + mx;
      const cy = y * height + driftY + my;
      const r = Math.max(width, height) * radius;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.52, color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    const beamCount = width < 760 ? 4 : 7;
    for (let index = 0; index < beamCount; index += 1) {
      const phase = index * 0.73;
      const progress = (time * (0.045 + index * 0.004) + phase) % 1;
      const beamX = -width * 0.2 + progress * width * 1.38;
      const beamY = height * (0.08 + (index % 4) * 0.16) + Math.sin(time * 0.18 + phase) * height * 0.05;
      const beamWidth = width * (0.13 + (index % 3) * 0.035);
      const beamLength = height * 1.45;
      const gradient = ctx.createLinearGradient(-beamWidth, 0, beamWidth, 0);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.28, "rgba(255,255,255,0.16)");
      gradient.addColorStop(0.5, index % 2 ? "rgba(130, 177, 238, 0.22)" : "rgba(255, 222, 150, 0.18)");
      gradient.addColorStop(0.72, "rgba(255,255,255,0.16)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.translate(beamX, beamY);
      ctx.rotate(-0.58 + Math.sin(time * 0.14 + phase) * 0.04);
      ctx.fillStyle = gradient;
      ctx.filter = "blur(22px)";
      ctx.fillRect(-beamWidth, -beamLength * 0.5, beamWidth * 2, beamLength);
      ctx.filter = "none";
      ctx.globalAlpha = 0.16;
      ctx.fillRect(-beamWidth * 0.2, -beamLength * 0.48, beamWidth * 0.4, beamLength * 0.96);
      ctx.restore();
    }

    if (pointer.active) {
      const cx = pointer.smoothX * width;
      const cy = pointer.smoothY * height;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 240);
      glow.addColorStop(0, "rgba(255, 214, 132, 0.26)");
      glow.addColorStop(0.44, "rgba(91, 142, 214, 0.16)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalAlpha = 1;
  }

  function drawGrid() {
    const { ctx } = grid;
    const { width, height } = bounds;
    const mx = pointer.smoothX * width;
    const my = pointer.smoothY * height;

    ctx.clearRect(0, 0, width, height);
    gridPoints.forEach((point) => {
      const dx = point.x - mx;
      const dy = point.y - my;
      const dist = Math.hypot(dx, dy);
      if (pointer.active && dist < 150 && dist > 0.1) {
        const force = (1 - dist / 150) * 30;
        point.vx += (dx / dist) * force * 0.1;
        point.vy += (dy / dist) * force * 0.1;
      }
      point.vx += (point.restX - point.x) * 0.05;
      point.vy += (point.restY - point.y) * 0.05;
      point.vx *= 0.85;
      point.vy *= 0.85;
      point.x += point.vx;
      point.y += point.vy;
    });

    ctx.strokeStyle = "rgba(34, 65, 112, 0.07)";
    ctx.lineWidth = 0.5;
    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols - 1; col += 1) {
        const a = gridPoints[row * gridCols + col];
        const b = gridPoints[row * gridCols + col + 1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (let col = 0; col < gridCols; col += 1) {
      for (let row = 0; row < gridRows - 1; row += 1) {
        const a = gridPoints[row * gridCols + col];
        const b = gridPoints[(row + 1) * gridCols + col];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    gridPoints.forEach((point) => {
      const near = pointer.active ? Math.max(0, 1 - Math.hypot(point.x - mx, point.y - my) / 150) : 0;
      const size = 1.7 + near * 2.1;
      ctx.globalAlpha = 0.16 + near * 0.38;
      ctx.fillStyle = "#2c528a";
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    });
    ctx.globalAlpha = 1;
  }

  const particles = [];
  let logoReady = false;
  let logoCenterX = 0;
  let logoCenterY = 0;

  function loadLogoParticles() {
    const image = new Image();
    image.onload = () => {
      const size = 82;
      const sampler = document.createElement("canvas");
      sampler.width = size;
      sampler.height = size;
      const ctx = sampler.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      const scale = Math.min(size / image.width, size / image.height) * 0.86;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      ctx.drawImage(image, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);
      const pixels = ctx.getImageData(0, 0, size, size).data;
      const mask = new Float32Array(size * size);

      for (let index = 0; index < size * size; index += 1) {
        const r = pixels[index * 4];
        const g = pixels[index * 4 + 1];
        const b = pixels[index * 4 + 2];
        mask[index] = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }

      particles.length = 0;
      const half = size / 2;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const value = mask[y * size + x];
          if (value < 0.18) continue;
          let edgeHits = 0;
          for (let oy = -1; oy <= 1; oy += 1) {
            for (let ox = -1; ox <= 1; ox += 1) {
              if (ox === 0 && oy === 0) continue;
              const nx = x + ox;
              const ny = y + oy;
              if (nx < 0 || ny < 0 || nx >= size || ny >= size || mask[ny * size + nx] < 0.18) {
                edgeHits += 1;
              }
            }
          }
          const angle = Math.random() * Math.PI * 2;
          const scatter = 170 + Math.random() * 180;
          particles.push({
            tx: (x - half) / half,
            ty: (y - half) / half,
            sx: Math.cos(angle) * scatter,
            sy: Math.sin(angle) * scatter * 0.75,
            edge: edgeHits / 8,
            opacity: Math.min(1, 0.42 + value * 0.68),
            seed: Math.random() * 1000,
          });
        }
      }

      logoReady = true;
      placeParticles();
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`;
  }

  function placeParticles() {
    if (!logoReady) return;
    const { width, height } = bounds;
    const logoSize = Math.min(width * 0.34, 390);
    const cx = width * (width < 760 ? 0.72 : 0.78);
    const cy = height * (width < 760 ? 0.42 : 0.47);
    logoCenterX = cx;
    logoCenterY = cy;
    particles.forEach((particle) => {
      particle.targetX = cx + particle.tx * logoSize * 0.5;
      particle.targetY = cy + particle.ty * logoSize * 0.5;
      particle.scatterX = particle.targetX + particle.sx;
      particle.scatterY = particle.targetY + particle.sy;
    });
  }

  function drawLogo(time) {
    const { ctx } = logo;
    const { width, height } = bounds;
    ctx.clearRect(0, 0, width, height);
    if (width <= 680) return;
    if (!logoReady) return;

    const assembly = Math.min(1, time / 2.5);
    const eased = 1 - Math.pow(1 - assembly, 3);
    const mx = pointer.smoothX * width;
    const my = pointer.smoothY * height;
    const breathe = 1 + Math.sin(time * 0.62) * 0.018;
    const floatX = Math.sin(time * 0.34) * 8;
    const floatY = Math.cos(time * 0.41) * 7;
    const rotation = Math.sin(time * 0.22) * 0.025;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    particles.forEach((particle, index) => {
      let x = particle.scatterX + (particle.targetX - particle.scatterX) * eased;
      let y = particle.scatterY + (particle.targetY - particle.scatterY) * eased;
      const loose = (0.25 + particle.edge * 0.75) * eased;
      x += Math.sin(time * 0.5 + particle.seed) * 3.6 * loose;
      y += Math.cos(time * 0.42 + particle.seed * 0.7) * 3.6 * loose;

      const ox = (x - logoCenterX) * breathe;
      const oy = (y - logoCenterY) * breathe;
      x = logoCenterX + ox * cos - oy * sin + floatX * eased;
      y = logoCenterY + ox * sin + oy * cos + floatY * eased;

      if (pointer.active && eased > 0.8) {
        const dx = x - mx;
        const dy = y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 190 && dist > 0.1) {
          const force = Math.pow(1 - dist / 190, 3) * 66;
          const noise = Math.sin(index * 0.37 + time * 0.5) * 1.1;
          x += (dx / dist) * force + Math.cos(noise) * force * 0.18;
          y += (dy / dist) * force + Math.sin(noise) * force * 0.18;
        }
      }

      const shine = 0.68 + 0.32 * Math.sin(time * 1.5 + particle.tx * 7 + particle.ty * 3);
      ctx.globalAlpha = particle.opacity * (0.15 + eased * 0.72) * shine;
      ctx.fillStyle = "#25466f";
      const size = (2.1 + particle.edge * 1.2) * (0.96 + Math.sin(time * 0.9 + particle.seed) * 0.05);
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    });
    ctx.globalAlpha = 1;
  }

  buildGrid();
  loadLogoParticles();

  let start = performance.now();
  function render(now) {
    const time = (now - start) * 0.001;
    drawFluid(time);
    drawGrid();
    drawLogo(time);
    if (!prefersReduced) requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
