(() => {
  "use strict";

  const boot = document.getElementById("boot");
  const game = document.getElementById("game");
  const frame = document.getElementById("scene-frame");
  const layers = [...frame.querySelectorAll(".layer")];
  const cursor = document.getElementById("cursor");
  const startBtn = document.getElementById("start-btn");
  const toast = document.getElementById("toast");
  const loadingPage = document.getElementById("loading-page");

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const cursorPos = { x: -40, y: -40, tx: -40, ty: -40 };
  let selected = "red";
  let started = false;

  /* 细长、方正点阵字（对照 ref_money） */
  const PIXEL_GLYPHS = {
    x: ["1...1", ".1.1.", "..1..", ".1.1.", "1...1"],
    "0": [
      ".111.",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      ".111.",
    ],
    "1": [
      "..1..", ".11..", "..1..", "..1..", "..1..", "..1..",
      "..1..", "..1..", "..1..", "..1..", "..1..", "..1..", ".111.",
    ],
    "2": [
      ".111.", "1...1", "....1", "....1", "...1.", "..1..", ".1...",
      "1....", "1....", "1....", "1....", "1....", "11111",
    ],
    "3": [
      ".111.", "1...1", "....1", "....1", "...1.", "..11.", "....1",
      "....1", "....1", "....1", "1...1", "1...1", ".111.",
    ],
    "4": [
      "1...1", "1...1", "1...1", "1...1", "1...1", "1...1", ".1111",
      "....1", "....1", "....1", "....1", "....1", "....1",
    ],
    "5": [
      "11111", "1....", "1....", "1....", "1....", "1111.", "....1",
      "....1", "....1", "....1", "....1", "1...1", ".111.",
    ],
    "6": [
      ".111.", "1...1", "1....", "1....", "1....", "1111.", "1...1",
      "1...1", "1...1", "1...1", "1...1", "1...1", ".111.",
    ],
    "7": [
      "11111", "....1", "....1", "...1.", "...1.", "..1..", "..1..",
      ".1...", ".1...", "1....", "1....", "1....", "1....",
    ],
    "8": [
      ".111.", "1...1", "1...1", "1...1", "1...1", ".111.", "1...1",
      "1...1", "1...1", "1...1", "1...1", "1...1", ".111.",
    ],
    "9": [
      ".111.", "1...1", "1...1", "1...1", "1...1", "1...1", ".1111",
      "....1", "....1", "....1", "....1", "1...1", ".111.",
    ],
  };

  function drawCoinCount(text) {
    const canvas = document.getElementById("coin-count");
    if (!canvas) return;

    const FILL = "#f3ebb0";
    const INNER = "#7eb8e8";
    const OUT = "#2a58b0";
    const SCALE = 4.4;
    const GAP = 4;
    const glyphH = 13;
    const pad = 1;

    const chars = String(text).split("");
    const prepared = chars.map((ch) => {
      let rows = (PIXEL_GLYPHS[ch] || PIXEL_GLYPHS["0"]).slice();
      while (rows.length < glyphH) {
        rows.unshift(".....");
        if (rows.length < glyphH) rows.push(".....");
      }
      if (rows.length > glyphH) {
        const cut = Math.floor((rows.length - glyphH) / 2);
        rows = rows.slice(cut, cut + glyphH);
      }
      return { rows, w: rows[0].length };
    });

    let totalW = prepared.reduce((s, g) => s + g.w, 0) + GAP * (prepared.length - 1);
    const mapW = totalW + pad * 2;
    const mapH = glyphH + pad * 2;
    const map = Array.from({ length: mapH }, () => Array(mapW).fill(0));

    let ox = pad;
    for (const g of prepared) {
      const y0 = pad;
      for (let y = 0; y < g.rows.length; y++) {
        for (let x = 0; x < g.w; x++) {
          if (g.rows[y][x] === "1") map[y0 + y][ox + x] = 1;
        }
      }
      ox += g.w + GAP;
    }

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] !== 1) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (ny < 0 || nx < 0 || ny >= mapH || nx >= mapW) continue;
            if (map[ny][nx] === 0) map[ny][nx] = 2;
          }
        }
      }
    }

    canvas.width = mapW * SCALE;
    canvas.height = mapH * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const put = (x, y, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    };

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] === 2) put(x, y, OUT);
      }
    }
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] !== 1) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny < 0 || nx < 0 || ny >= mapH || nx >= mapW) continue;
          if (map[ny][nx] === 2) put(nx, ny, INNER);
        }
      }
    }
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] === 1) put(x, y, FILL);
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function punchWhite(img, threshold) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] >= threshold && px[i + 1] >= threshold && px[i + 2] >= threshold) {
        px[i + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
    return c;
  }

  async function replacePunched(imgEl) {
    const threshold = Number(imgEl.dataset.punch);
    if (!threshold) return;
    try {
      const src = imgEl.currentSrc || imgEl.src;
      const img = await loadImage(src);
      const canvas = punchWhite(img, threshold);
      canvas.className = imgEl.className;
      canvas.draggable = false;
      if (imgEl.classList.contains("sprite")) {
        canvas.style.width = getComputedStyle(imgEl).width;
        canvas.style.height = "auto";
      }
      imgEl.replaceWith(canvas);
    } catch (err) {
      imgEl.style.mixBlendMode = "multiply";
      console.warn("punch skip", err);
    }
  }

  async function prepareAssets() {
    const nodes = [...document.querySelectorAll("[data-punch]")];
    await Promise.all(nodes.map(replacePunched));
  }

  function showToast(msg, duration = 1600) {
    return new Promise((resolve) => {
      toast.hidden = false;
      toast.textContent = msg;
      toast.classList.add("is-show");
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => {
        toast.hidden = true;
        toast.classList.remove("is-show");
        resolve();
      }, duration);
    });
  }

  function showLoadingPage() {
    loadingPage.hidden = false;
    // force reflow so transition runs
    void loadingPage.offsetWidth;
    loadingPage.classList.add("is-show");
  }

  function selectHero(id) {
    selected = id;
    document.querySelectorAll(".hero-slot").forEach((btn) => {
      const on = btn.dataset.hero === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  async function startGame() {
    if (started) return;
    started = true;
    const name = selected === "red" ? "钟离权" : "吕洞宾";
    startBtn.querySelector(".start-btn__label").textContent = "潜入中…";
    startBtn.disabled = true;

    await showToast(`${name}潜入宝阁……`, 1600);
    await new Promise((r) => setTimeout(r, 300));
    showLoadingPage();
  }

  function onPointerMove(e) {
    mouse.tx = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
    mouse.ty = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
    cursorPos.tx = e.clientX;
    cursorPos.ty = e.clientY;
    cursor.classList.add("is-on");
  }

  function tick() {
    mouse.x += (mouse.tx - mouse.x) * 0.14;
    mouse.y += (mouse.ty - mouse.y) * 0.14;
    cursorPos.x += (cursorPos.tx - cursorPos.x) * 0.32;
    cursorPos.y += (cursorPos.ty - cursorPos.y) * 0.32;

    const dx = (mouse.x - 0.5) * 2;
    const dy = (mouse.y - 0.5) * 2;
    const maxShift = Math.min(window.innerWidth, window.innerHeight) * 0.11;

    for (const layer of layers) {
      const depth = Number(layer.dataset.depth) || 0.2;
      const x = -dx * maxShift * depth;
      const y = -dy * maxShift * depth * 0.9;
      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }

    const press = cursor.classList.contains("is-press") ? " scale(0.88)" : "";
    cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)${press}`;
    requestAnimationFrame(tick);
  }

  function bind() {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", () => {
      mouse.tx = 0.5;
      mouse.ty = 0.5;
      cursor.classList.remove("is-on");
    });
    window.addEventListener("pointerdown", () => cursor.classList.add("is-press"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-press"));

    document.querySelectorAll(".hero-slot").forEach((btn) => {
      btn.addEventListener("click", () => selectHero(btn.dataset.hero));
    });
    startBtn.addEventListener("click", startGame);
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        startGame();
      }
      if (e.code === "ArrowLeft") selectHero("red");
      if (e.code === "ArrowRight") selectHero("blue");
    });
  }

  async function init() {
    bind();
    requestAnimationFrame(tick);
    drawCoinCount("x000");

    boot.classList.add("is-done");
    game.hidden = false;
    setTimeout(() => boot.remove(), 350);

    await prepareAssets();
  }

  init();
})();