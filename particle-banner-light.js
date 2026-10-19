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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
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
    ctx.fillStyle = "#f9fbfd";
    ctx.fillRect(0, 0, width, height);

    const focusX = width * 0.78 + Math.sin(time * 0.24) * 12;
    const focusY = height * 0.45 + Math.cos(time * 0.28) * 9;
    const pulse = 0.5 + Math.sin(time * 0.72) * 0.5;
    const focusRadius = Math.min(width * 0.3, 470);
    const focus = ctx.createRadialGradient(focusX, focusY, 0, focusX, focusY, focusRadius);
    focus.addColorStop(0, `rgba(178, 217, 247, ${0.2 + pulse * 0.035})`);
    focus.addColorStop(0.34, "rgba(214, 234, 250, 0.13)");
    focus.addColorStop(0.72, "rgba(232, 242, 250, 0.045)");
    focus.addColorStop(1, "rgba(249, 251, 253, 0)");
    ctx.fillStyle = focus;
    ctx.fillRect(0, 0, width, height);

    if (pointer.active) {
      const cx = pointer.smoothX * width;
      const cy = pointer.smoothY * height;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 190);
      glow.addColorStop(0, "rgba(183, 216, 244, 0.12)");
      glow.addColorStop(0.48, "rgba(210, 231, 248, 0.055)");
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

    ctx.lineWidth = 0.55;
    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols - 1; col += 1) {
        const a = gridPoints[row * gridCols + col];
        const b = gridPoints[row * gridCols + col + 1];
        const fade = Math.max(0, Math.min(1, (a.x / width - 0.48) / 0.2));
        if (fade <= 0) continue;
        ctx.strokeStyle = `rgba(44, 82, 125, ${0.045 * fade})`;
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
        const fade = Math.max(0, Math.min(1, (a.x / width - 0.48) / 0.2));
        if (fade <= 0) continue;
        ctx.strokeStyle = `rgba(44, 82, 125, ${0.045 * fade})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    gridPoints.forEach((point) => {
      const fade = Math.max(0, Math.min(1, (point.x / width - 0.48) / 0.2));
      if (fade <= 0) return;
      const near = pointer.active ? Math.max(0, 1 - Math.hypot(point.x - mx, point.y - my) / 180) : 0;
      const size = 1.35 + near * 1.8;
      ctx.globalAlpha = fade * (0.1 + near * 0.32);
      ctx.fillStyle = "#315d8a";
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
    if (width <= 920) return;
    if (!logoReady) return;

    const assembly = Math.min(1, time / 2.5);
    const eased = 1 - Math.pow(1 - assembly, 3);
    const mx = pointer.smoothX * width;
    const my = pointer.smoothY * height;
    const breathe = 1 + Math.sin(time * 0.7) * 0.026;
    const floatX = Math.sin(time * 0.38) * 11;
    const floatY = Math.cos(time * 0.46) * 9;
    const rotation = Math.sin(time * 0.26) * 0.032;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    particles.forEach((particle, index) => {
      let x = particle.scatterX + (particle.targetX - particle.scatterX) * eased;
      let y = particle.scatterY + (particle.targetY - particle.scatterY) * eased;
      const loose = (0.25 + particle.edge * 0.75) * eased;
      x += Math.sin(time * 0.58 + particle.seed) * 5.2 * loose;
      y += Math.cos(time * 0.48 + particle.seed * 0.7) * 5.2 * loose;

      const ox = (x - logoCenterX) * breathe;
      const oy = (y - logoCenterY) * breathe;
      x = logoCenterX + ox * cos - oy * sin + floatX * eased;
      y = logoCenterY + ox * sin + oy * cos + floatY * eased;

      const radialDistance = Math.min(1, Math.hypot(ox, oy) / 240);
      const waveClock = ((time - 3.1) % 6.8 + 6.8) % 6.8;
      const waveDistance = waveClock * 0.46;
      const wave = Math.exp(-Math.pow(radialDistance - waveDistance, 2) / 0.018) * (waveClock < 2.9 ? 1 : 0);
      const outwardLength = Math.hypot(ox, oy) || 1;
      x += (ox / outwardLength) * wave * (10 + particle.edge * 12);
      y += (oy / outwardLength) * wave * (10 + particle.edge * 12);

      if (pointer.active && eased > 0.8) {
        const dx = x - mx;
        const dy = y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 230 && dist > 0.1) {
          const force = Math.pow(1 - dist / 230, 2.6) * 88;
          const noise = Math.sin(index * 0.37 + time * 0.5) * 1.1;
          x += (dx / dist) * force + Math.cos(noise) * force * 0.18;
          y += (dy / dist) * force + Math.sin(noise) * force * 0.18;
        }
      }

      const shine = 0.76 + 0.24 * Math.sin(time * 1.7 + particle.tx * 7 + particle.ty * 3);
      ctx.globalAlpha = particle.opacity * (0.3 + eased * 0.66) * shine;
      ctx.fillStyle = particle.edge > 0.42 ? "#173e66" : "#285d8d";
      const size = (2.35 + particle.edge * 1.25 + wave * 0.45) * (0.96 + Math.sin(time * 0.95 + particle.seed) * 0.06);
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    });
    ctx.globalAlpha = 1;
  }

  buildGrid();
  loadLogoParticles();

  let start = performance.now();
  function render(now) {
    const time = prefersReduced ? 8 : (now - start) * 0.001;
    drawFluid(time);
    drawGrid();
    drawLogo(time);
    if (!prefersReduced) requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
