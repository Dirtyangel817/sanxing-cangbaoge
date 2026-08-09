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
  const runway = document.getElementById("runway");
  const runner = document.getElementById("runner");
  const runnerSprite = document.getElementById("runner-sprite");
  const runBack = document.getElementById("run-back");
  const runMid = document.getElementById("run-mid");
  const trackWorld = document.getElementById("track-world");

  const HERO_SRC = {
    red: "assets/little-red.png",
    blue: "assets/little-blue.png",
  };
  const COIN_SRC = "assets/money.png";
  const HEIGHTS = [72, 110, 150, 196];
  const SPEED = 2.6;
  const GRAVITY = 0.72;
  /* 相对原 13.5：高度翻倍 → 初速 ×√2 */
  const JUMP_V = 13.5 * Math.SQRT2;
  const MAX_JUMPS = 2;
  const LAND_TOL = 36;
  const GAP_SAFE_RATIO = 0.8;
  const FORCE_ZERO_GAP = false;

  /**
   * 用与游戏相同的逐帧物理，模拟「起跳 + 顶点二连跳 + 落回原高度」的最大滞空帧数。
   * 水平跨距 = 滞空帧数 × SPEED；缝隙上限再取 80%。
   */
  function maxDoubleJumpAirFrames() {
    let y = 0;
    let vy = JUMP_V;
    let jumpsLeft = MAX_JUMPS - 1;
    let usedSecond = false;
    let frames = 0;
    for (let i = 0; i < 600; i++) {
      frames += 1;
      /* 接近顶点时二连跳，对应最大滞空 */
      if (!usedSecond && jumpsLeft > 0 && vy <= 0) {
        vy = JUMP_V;
        jumpsLeft -= 1;
        usedSecond = true;
      }
      vy -= GRAVITY;
      y += vy;
      if (frames > 2 && y <= 0 && vy <= 0) return frames;
    }
    return frames;
  }

  const MAX_SAFE_GAP = maxDoubleJumpAirFrames() * SPEED * GAP_SAFE_RATIO;

  function maxSafeGap() {
    return MAX_SAFE_GAP;
  }

  function randomGap(minRatio = 0.35) {
    if (FORCE_ZERO_GAP) return 0;
    const maxG = maxSafeGap();
    const minG = Math.min(maxG, Math.max(24, maxG * minRatio));
    const gap = minG + Math.random() * (maxG - minG);
    return Math.min(maxG, gap);
  }

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const cursorPos = { x: -40, y: -40, tx: -40, ty: -40 };
  /* 开发期直接进跑酷；要恢复选角/加载页时改回 false */
  const SKIP_INTRO = true;

  const runScroll = { back: 0, mid: 0, world: 0 };
  const hero = { y: 110, vy: 0, onGround: true, dead: false, jumpsLeft: MAX_JUMPS };
  const platforms = [];
  const coins = [];
  let coinCount = 0;
  let nextX = 0;
  let selected = "red";
  let started = false;
  let running = false;
  let coinImgUrl = COIN_SRC;

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

  function punchSpriteBg(img, whiteThreshold = 248) {
    const c = document.createElement("canvas");
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;

    const isWhite = (i) =>
      px[i] >= whiteThreshold && px[i + 1] >= whiteThreshold && px[i + 2] >= whiteThreshold;
    /* 仅去掉连通到画面边缘的近黑底，保留角色内部黑发 */
    const isEdgeBlack = (i) => px[i] <= 28 && px[i + 1] <= 28 && px[i + 2] <= 28;

    for (let i = 0; i < px.length; i += 4) {
      if (isWhite(i)) px[i + 3] = 0;
    }

    const seen = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (seen[p]) return;
      const i = p * 4;
      if (px[i + 3] === 0) {
        seen[p] = 1;
        return;
      }
      if (!isEdgeBlack(i)) return;
      seen[p] = 1;
      stack.push(p);
    };

    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }

    while (stack.length) {
      const p = stack.pop();
      const i = p * 4;
      px[i + 3] = 0;
      const x = p % w;
      const y = (p - x) / w;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }

    ctx.putImageData(data, 0, 0);
    return c;
  }

  async function setRunnerSprite(heroId) {
    const src = HERO_SRC[heroId] || HERO_SRC.red;
    const img = await loadImage(src);
    const punched = punchSpriteBg(img, 248);
    runnerSprite.src = punched.toDataURL("image/png");
    runner.dataset.hero = heroId;
  }

  async function prepareCoinArt() {
    try {
      const img = await loadImage(COIN_SRC);
      const punched = punchSpriteBg(img, 248);
      coinImgUrl = punched.toDataURL("image/png");
    } catch (_) {
      coinImgUrl = COIN_SRC;
    }
  }

  function heroScreenX() {
    const raw = getComputedStyle(runway).getPropertyValue("--hero-x").trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 120;
  }

  function formatCoins(n) {
    return `x${String(Math.min(999, Math.max(0, n))).padStart(3, "0")}`;
  }

  function clearTrack() {
    platforms.length = 0;
    coins.length = 0;
    trackWorld.innerHTML = "";
    nextX = 0;
    runScroll.world = 0;
    trackWorld.style.transform = "translate3d(0,0,0)";
  }

  function addPlatform(x, w, h) {
    const el = document.createElement("div");
    el.className = "plat";
    if (h >= 180) el.classList.add("plat--high");
    else if (h <= 90) el.classList.add("plat--low");
    el.style.left = `${x}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.innerHTML = '<div class="plat__cap"></div><div class="plat__dirt"></div>';
    trackWorld.appendChild(el);
    const plat = { x, w, h, el };
    platforms.push(plat);
    return plat;
  }

  function addCoin(x, y) {
    const el = document.createElement("img");
    el.className = "pickup-coin";
    el.src = coinImgUrl;
    el.alt = "";
    el.draggable = false;
    el.style.left = `${x}px`;
    el.style.bottom = `${y}px`;
    trackWorld.appendChild(el);
    coins.push({ x, y, el, got: false });
  }

  function spawnCoinsOnPlat(plat) {
    if (plat.w < 100 || Math.random() < 0.22) return;
    const count = 3 + Math.floor(Math.random() * 4);
    const start = plat.x + 36;
    const span = Math.max(40, plat.w - 72);
    const step = span / Math.max(1, count - 1);
    const arc = Math.random() < 0.45;
    for (let i = 0; i < count; i++) {
      const cx = start + step * i;
      const lift = arc ? Math.sin((i / (count - 1 || 1)) * Math.PI) * 42 : 18;
      addCoin(cx, plat.h + 10 + lift);
    }
  }

  function generateSegment() {
    const roll = Math.random();
    /* 零缝测试时不能只加 gap 就 return，否则 nextX 不增长会死循环 */
    if (!FORCE_ZERO_GAP && roll < 0.24 && nextX > 420) {
      nextX += randomGap(0.45);
      return;
    }
    const lastH = platforms.length ? platforms[platforms.length - 1].h : 110;
    let h = HEIGHTS[Math.floor(Math.random() * HEIGHTS.length)];
    /* 升高地形前必须留缝：不跳就会掉，避免无缝高台把人堵住 */
    if (h > lastH + 4) {
      nextX += randomGap(0.4);
    } else if (lastH - h > 40) {
      nextX += randomGap(0.3);
    } else if (Math.random() < 0.18 && nextX > 420) {
      nextX += randomGap(0.3);
    }
    const w = 150 + Math.floor(Math.random() * 240);
    const plat = addPlatform(nextX, w, h);
    spawnCoinsOnPlat(plat);
    nextX += w;
  }

  function ensureTrackAhead() {
    const need = runScroll.world + (runway.clientWidth || 900) + 900;
    while (nextX < need) generateSegment();
  }

  function pruneTrack() {
    const cut = runScroll.world - 280;
    while (platforms.length && platforms[0].x + platforms[0].w < cut) {
      platforms.shift().el.remove();
    }
    while (coins.length && (coins[0].got || coins[0].x < cut)) {
      const c = coins.shift();
      if (c.el.isConnected) c.el.remove();
    }
  }

  function surfaceAt(worldX) {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (worldX >= p.x && worldX < p.x + p.w) return p.h;
    }
    return null;
  }

  /**
   * 脚底区间与台面有任意水平重叠即算接触。
   * 更高台且人还在其下：不能站这台（当墙跳过），但不取消其它平地支撑，避免接缝处掉落。
   */
  function findLandingSurface(prevY, nextY, xLeft, xRight) {
    const yRef = Math.max(prevY, nextY);
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const overlap = Math.min(xRight, p.x + p.w) - Math.max(xLeft, p.x);
      if (overlap <= 0) continue;

      const top = p.h;
      /* 人明显低于该台面 → 这是立面，不能当地板；继续看别的台 */
      if (yRef < top - 10 && prevY < top - LAND_TOL) continue;

      const stayOn = Math.abs(prevY - top) <= 6 && nextY <= top + 16;
      const crossed = prevY >= top - LAND_TOL && nextY <= top + 16;
      if (!stayOn && !crossed) continue;

      const dist = Math.abs(top - prevY);
      if (dist < bestDist) {
        bestDist = dist;
        best = top;
      }
    }
    return best;
  }

  function resetHeroOnTrack() {
    hero.y = 110;
    hero.vy = 0;
    hero.onGround = true;
    hero.dead = false;
    hero.jumpsLeft = MAX_JUMPS;
    runner.classList.remove("is-air");
    const hx = runScroll.world + heroScreenX() + 40;
    const s = surfaceAt(hx);
    if (s != null) hero.y = s;
    runner.style.bottom = `${hero.y}px`;
  }

  function tryJump() {
    if (!running || hero.dead || hero.jumpsLeft <= 0) return;
    hero.vy = JUMP_V;
    hero.jumpsLeft -= 1;
    hero.onGround = false;
    runner.classList.add("is-air");
  }

  function collectCoins(heroWorldX) {
    const hx = heroWorldX;
    const hy = hero.y;
    for (const c of coins) {
      if (c.got) continue;
      if (Math.abs(c.x - hx) < 34 && Math.abs(c.y - (hy + 36)) < 44) {
        c.got = true;
        c.el.classList.add("is-got");
        coinCount += 1;
        drawCoinCount(formatCoins(coinCount));
        setTimeout(() => c.el.remove(), 280);
      }
    }
  }

  function initTrack() {
    clearTrack();
    coinCount = 0;
    drawCoinCount(formatCoins(0));
    addPlatform(0, 520, 110);
    nextX = 520;
    ensureTrackAhead();
    resetHeroOnTrack();
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
    void loadingPage.offsetWidth;
    loadingPage.classList.add("is-show");
    loadingPage.classList.remove("is-leave");
  }

  function hideLoadingPage() {
    loadingPage.classList.add("is-leave");
    loadingPage.classList.remove("is-show");
    return new Promise((resolve) => {
      setTimeout(() => {
        loadingPage.hidden = true;
        resolve();
      }, 700);
    });
  }

  function selectHero(id) {
    if (running || started) return;
    selected = id;
    document.querySelectorAll(".hero-slot").forEach((btn) => {
      const on = btn.dataset.hero === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  async function enterRunMode() {
    started = true;
    await Promise.all([setRunnerSprite(selected), prepareCoinArt()]);
    runway.hidden = false;
    game.classList.add("is-running");
    runner.classList.add("is-running");
    initTrack();
    running = true;
    if (!loadingPage.hidden) await hideLoadingPage();
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
    await new Promise((r) => setTimeout(r, 1100));
    await enterRunMode();
  }

  function onPointerMove(e) {
    mouse.tx = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
    mouse.ty = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
    cursorPos.tx = e.clientX;
    cursorPos.ty = e.clientY;
    cursor.classList.add("is-on");
  }

  function tickSideRun() {
    if (hero.dead) return;

    runScroll.world += SPEED;
    runScroll.back += SPEED * 0.22;
    runScroll.mid += SPEED * 0.48;
    trackWorld.style.transform = `translate3d(${-runScroll.world}px, 0, 0)`;
    runBack.style.backgroundPosition = `${-runScroll.back}px 38%`;
    runMid.style.backgroundPosition = `${-runScroll.mid}px 70%`;

    ensureTrackAhead();
    pruneTrack();

    const heroW = runner.offsetWidth || 90;
    const feetCenter = runScroll.world + heroScreenX() + heroW * 0.5;
    const feetLeft = feetCenter - heroW * 0.42;
    const feetRight = feetCenter + heroW * 0.42;
    const prevY = hero.y;
    hero.vy -= GRAVITY;
    hero.y += hero.vy;

    hero.onGround = false;
    if (hero.vy <= 0) {
      const surface = findLandingSurface(prevY, hero.y, feetLeft, feetRight);
      if (surface != null) {
        hero.y = surface;
        hero.vy = 0;
        hero.onGround = true;
        hero.jumpsLeft = MAX_JUMPS;
      }
    }

    if (hero.onGround) runner.classList.remove("is-air");
    else runner.classList.add("is-air");

    runner.style.bottom = `${hero.y}px`;
    collectCoins(feetCenter);

    if (hero.y < -80) {
      hero.dead = true;
      setTimeout(() => {
        const rescue = platforms.find((p) => p.x > feetCenter + 40) || platforms[platforms.length - 1];
        if (rescue) {
          runScroll.world = Math.max(0, rescue.x - heroScreenX() + 20);
          trackWorld.style.transform = `translate3d(${-runScroll.world}px, 0, 0)`;
        }
        resetHeroOnTrack();
        ensureTrackAhead();
      }, 350);
    }
  }

  function tick() {
    mouse.x += (mouse.tx - mouse.x) * 0.14;
    mouse.y += (mouse.ty - mouse.y) * 0.14;
    cursorPos.x += (cursorPos.tx - cursorPos.x) * 0.32;
    cursorPos.y += (cursorPos.ty - cursorPos.y) * 0.32;

    if (!running) {
      const dx = (mouse.x - 0.5) * 2;
      const dy = (mouse.y - 0.5) * 2;
      const maxShift = Math.min(window.innerWidth, window.innerHeight) * 0.11;

      for (const layer of layers) {
        const depth = Number(layer.dataset.depth) || 0.2;
        const x = -dx * maxShift * depth;
        const y = -dy * maxShift * depth * 0.9;
        layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
    } else {
      tickSideRun();
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
    window.addEventListener("pointerdown", (e) => {
      cursor.classList.add("is-press");
      if (running) {
        e.preventDefault();
        tryJump();
      }
    });
    window.addEventListener("pointerup", () => cursor.classList.remove("is-press"));

    document.querySelectorAll(".hero-slot").forEach((btn) => {
      btn.addEventListener("click", () => selectHero(btn.dataset.hero));
    });
    startBtn.addEventListener("click", startGame);
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (running) tryJump();
        else startGame();
      }
      if (!running) {
        if (e.code === "ArrowLeft") selectHero("red");
        if (e.code === "ArrowRight") selectHero("blue");
      }
    });
  }

  async function init() {
    bind();
    requestAnimationFrame(tick);
    drawCoinCount("x000");

    if (SKIP_INTRO) {
      boot.remove();
      loadingPage.hidden = true;
      game.hidden = false;
      await prepareAssets();
      await enterRunMode();
      return;
    }

    boot.classList.add("is-done");
    game.hidden = false;
    setTimeout(() => boot.remove(), 350);
    await prepareAssets();
  }

  init();
})();