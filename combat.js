(() => {
  "use strict";

  const boot = document.getElementById("boot");
  const game = document.getElementById("game");
  const frame = document.getElementById("scene-frame");
  const layers = frame ? [...frame.querySelectorAll(".layer")] : [];
  const cursor = document.getElementById("cursor");
  const startBtn = document.getElementById("start-btn");
  const toast = document.getElementById("toast");
  const loadingPage = document.getElementById("loading-page");
  /* BUILD: click-only-attack — no auto attack */

  function forceShowGame() {
    if (boot && boot.isConnected) boot.remove();
    if (loadingPage) {
      loadingPage.hidden = true;
      loadingPage.classList.remove("is-show");
    }
    if (game) game.hidden = false;
  }

  /* 防止异常卡死在 LOADING */
  setTimeout(forceShowGame, 2200);

  const runway = document.getElementById("runway");
  const runner = document.getElementById("runner");
  const runnerSprite = document.getElementById("runner-sprite");
  const comboStage = document.getElementById("combo-stage");
  const playerFootLeft = document.getElementById("player-foot-left");
  const playerFootRight = document.getElementById("player-foot-right");
  const playerFeetEl = document.getElementById("player-feet");
  const swordRack = document.getElementById("weapon-rack");
  const weaponRack = swordRack;
  const runBack = document.getElementById("run-back");
  const runMid = document.getElementById("run-mid");
  const runFront = document.getElementById("run-front");
  const trackWorld = document.getElementById("track-world");
  const pauseOverlay = document.getElementById("pause-overlay");
  const gameoverOverlay = document.getElementById("gameover-overlay");
  const gameoverContinueBtn = document.getElementById("gameover-continue");
  const gameoverQuitBtn = document.getElementById("gameover-quit");
  const gameoverTitleEl = document.getElementById("gameover-title");
  const gameoverHintEl = document.getElementById("gameover-hint");
  const stageTimerEl = document.getElementById("stage-timer");
  const stageLabelEl = document.getElementById("stage-label");
  const stageTimeEl = document.getElementById("stage-time");
  const shopEl = document.getElementById("shop");
  const shopGoldEl = document.getElementById("shop-gold");
  const shopNextBtn = document.getElementById("shop-next");
  const shopBuyBtn = document.getElementById("shop-buy");
  const shopTipEl = document.getElementById("shop-tip");
  const shopTipName = document.getElementById("shop-tip-name");
  const shopTipDesc = document.getElementById("shop-tip-desc");
  const shopSlots = [...document.querySelectorAll(".shop-slot")];
  const bagBtn = document.getElementById("bag-btn");
  const bagPanel = document.getElementById("bag-panel");
  const bagList = document.getElementById("bag-list");
  const bagEmpty = document.getElementById("bag-empty");
  const bagCloseBtn = document.getElementById("bag-close");

  const runBackArt = runBack && runBack.querySelector(".run-parallax__art");
  const runMidArt = runMid && runMid.querySelector(".run-parallax__art");
  const runFrontArt = runFront && runFront.querySelector(".run-parallax__art");

  const HERO_SRC = {
    red: "assets/little-red.png",
    blue: "assets/gedoudongzuo/08.gif",
  };
  /** 吕洞宾全身攻击帧（剑+弧光已画进图）；待机已改用连招 GIF，不再用旧身体/脚 */
  const BLUE_BODY_ATK = {
    idle: "assets/gedoudongzuo/08.gif",
    2: "assets/renwudongzuo/2.png",
    3: "assets/renwudongzuo/3.png",
    4: "assets/renwudongzuo/4.png",
    5: "assets/renwudongzuo/5.png",
    6: "assets/renwudongzuo/6.png",
  };
  const PLAYER_FOOT_SRC = {
    left: "assets/left foot.png",
    right: "assets/rightfoot.png",
    /** 停止时默认站姿参考（左右脚 local 归零对齐此图） */
    middle: "assets/middlefoot.png",
  };
  const FOOT_STEP_MS = 120; /* 每步 0.10–0.13s */
  const FOOT_FWD_PX = 6; /* 前脚幅度 */
  const FOOT_BACK_PX = 3; /* 后脚幅度 */
  const COIN_SRC = "assets/money.png";
  const ENEMY_SRC = "assets/tianbing1.png?v=2";
  const ENEMY_FLASH_SRC = encodeURI("assets/tianbing baishan.png");
  const enemyFlashPreload = new Image();
  enemyFlashPreload.src = ENEMY_FLASH_SRC;
  const ENEMY_WEAPON_SRC = "assets/wuqi.png";
  const KNIFE_SRC = "assets/bishou.png";
  const FLOOR_SRC = "assets/main/main_floor1.png";
  const FLOOR_SRC_W = 276;
  const FLOOR_SRC_H = 597;
  /* 侧面宽度（源图像素），拼接时下一块重叠上去 */
  const FLOOR_SIDE_OVERLAP = 40;
  /* 地形显示宽度 */
  const FLOOR_UNIT_W = 176;
  const FLOOR_UNIT_H = Math.round((FLOOR_UNIT_W * FLOOR_SRC_H) / FLOOR_SRC_W);
  const FLOOR_STEP = FLOOR_UNIT_W * ((FLOOR_SRC_W - FLOOR_SIDE_OVERLAP) / FLOOR_SRC_W);
  /* 地面高度（比上一版略低） */
  const HEIGHTS = [84, 108, 132, 156, 180, 204];
  /* 脚底相对实体顶面下移（只改碰撞，不挪贴图） */
  const SURFACE_NUDGE = 20;
  /* 天兵与主角同高站立，不再额外抬高 */
  const ENEMY_Y_NUDGE = 0;
  const MOVE_SPEED = 4.37; /* 原 9.5 减慢 60% 后为 3.8，再加快 15% */
  const TAP_DASH_MS = 300;
  const TAP_DASH_MUL = 1.2;
  const GRAVITY = 0.85; /* 原 1.7，减半 */
  /* 相对初始设定，一段跳高度约为原来的一半 */
  const JUMP_V = 13.5 * Math.SQRT2 * Math.sqrt(GRAVITY / (0.72 * 2));
  const MAX_JUMPS = 2;
  const LAND_TOL = 14;
  const MAX_WALK_STEP = 3;
  const GAP_SAFE_RATIO = 0.75;
  const FORCE_ZERO_GAP = false;
  /* 临时：全场同一高度，只留一个洞 */
  const FLAT_ARENA = true;
  const MAX_HP = 100;
  const START_LIVES = 3;
  const PLAYER_ATK = 20;
  const BOSS_MOVE = 1.05;
  const BOSS_CHASE = 1.425;
  const BOSS_AGGRO_X = 560;
  const BOSS_AGGRO_Y = 240;
  /** 追到该水平距离内停下，贴近用武器戳 */
  const BOSS_ATTACK_GAP = 78;
  const BOSS_HURT_FRAMES = 36;
  const BOSS_JUMP_COOLDOWN = 70;
  /** 各关普通怪：血量 / 攻击 / 本关刷新总数 */
  /* 一套完整连招 15+20+22+28（均暴击）刚好打空 */
  const COMBO_KILL_HP = Math.floor(
    PLAYER_ATK * (1.1 * 1.5 + 1.25 * 1.55 + 1.45 * 1.6 + 1.9 * 1.7)
  );
  const STAGE_MOB = {
    1: { hp: COMBO_KILL_HP, atk: 5, count: 12 },
    2: { hp: COMBO_KILL_HP, atk: 6, count: 16 },
    3: { hp: COMBO_KILL_HP, atk: 7, count: 20 },
    4: { hp: COMBO_KILL_HP, atk: 8, count: 24 },
    5: { hp: COMBO_KILL_HP, atk: 9, count: 28 },
    6: { hp: COMBO_KILL_HP, atk: 10, count: 32 },
    7: { hp: COMBO_KILL_HP, atk: 11, count: 36 },
    8: { hp: COMBO_KILL_HP, atk: 13, count: 40 },
    9: { hp: COMBO_KILL_HP, atk: 15, count: 44 },
    10: { hp: COMBO_KILL_HP, atk: 18, count: 48 },
  };
  const ATTACK_FRAMES = 26;
  const HURT_IFRAMES = 45;
  const ATTACK_REACH = 96 * 1.5; /* 原 96*3，缩小一倍 */
  const SWORD_CD_MS = 500; /* 已废弃：宝剑不再自动冷却攻击 */
  const FAN_CD_MS = 1000; /* 已废弃：扇子不再自动冷却攻击 */

  /**
   * 吕洞宾连击：全身帧 assets/renwudongzuo（剑与弧光已合成）
   * 初始站立 dongzuo1；双击→2；三次→3+4 连贯；四次→5+6
   */
  const SWORD_COMBO = {
    resetMs: 700,
    bufferWindowMs: 160,
    damageMul: 1,
    critDamageMul: 1,
    attackSpeedMul: 1,
    /** 连招已改用 gedoudongzuo GIF，不再切旧全身 PNG */
    useBodyFrames: false,
    showSlashVfx: false,
    steps: [
      {
        id: "a1",
        label: "双击斩",
        durationMs: 280,
        chargeMs: 0,
        activeStartMs: 60,
        activeEndMs: 200,
        bodyFrames: [2],
        damageMul: 1,
        reachMul: 1.05,
        arc: { min: -70, max: 20 },
        hitStopMs: 30,
        knockback: 2.4,
        bodyNudgePx: 2,
        lean: 1,
      },
      {
        id: "a2",
        label: "三连",
        durationMs: 360,
        chargeMs: 0,
        activeStartMs: 50,
        activeEndMs: 280,
        bodyFrames: [3, 4],
        damageMul: 1.15,
        reachMul: 1.18,
        arc: { min: -20, max: 90 },
        hitStopMs: 34,
        knockback: 3,
        bodyNudgePx: 2,
        lean: 0,
      },
      {
        id: "a3",
        label: "四连",
        durationMs: 420,
        chargeMs: 40,
        activeStartMs: 80,
        activeEndMs: 340,
        bodyFrames: [5, 6],
        damageMul: 1.9,
        reachMul: 1.4,
        arc: { min: -75, max: 25 },
        hitStopMs: 70,
        knockback: 6.2,
        bodyNudgePx: 3,
        lean: 2,
        shakePx: 3.5,
        isCrit: true,
      },
    ],
  };

  /**
   * 单击：08 → 14 → 15 → 16，回到待机。
   * 两击：08 → … → 16 → 17 → 20 → 21 → 22 → 26 → 27 → 28，回到待机。
   * 08→14 = 0.1s，14→15 = 0.2s，15 维持 0.3s，16→17 = 0.1s，
   * 17→20 = 0.1s，20 维持 0.3s，21→22 = 0.1s，22 维持 0.4s，
   * 26→27 = 0.1s，27 维持 0.4s，28 维持 0.3s。
   */
  const COMBO_CLICK_GAP = 350;
  const COMBO_SCALE = 0.441;
  const comboFrames = [
    { src: "assets/gedoudongzuo/08.gif", duration: 100 },
    { src: "assets/gedoudongzuo/14.png", duration: 200 },
    { src: "assets/gedoudongzuo/15.png", duration: 300 },
    { src: "assets/gedoudongzuo/16.gif", duration: 100 },
    { src: "assets/gedoudongzuo/17.gif", duration: 100 },
    { src: "assets/gedoudongzuo/20.gif", duration: 300 },
    { src: "assets/gedoudongzuo/21.gif", duration: 100 },
    { src: "assets/gedoudongzuo/22.gif", duration: 400 },
    { src: "assets/gedoudongzuo/26.gif", duration: 100 },
    { src: "assets/gedoudongzuo/27.gif", duration: 400 },
    { src: "assets/gedoudongzuo/28.gif", duration: 300 },
  ];
  const comboActions = {
    attack1: { start: 0, end: 3 },
    attack2: { start: 4, end: 10 },
  };
  const COMBO_GIF_FILES = comboFrames.map((f) => f.src);
  const frameDurations = comboFrames.map((f) => f.duration);
  const COMBO_SWING_FRAMES = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 };
  const COMBO_GIF_HITS = {
    1: { damageMul: 1.1, reachMul: 1.2, knockback: 2.6, hitStopMs: 28, arc: { min: -40, max: 70 } },
    2: { damageMul: 1.2, reachMul: 1.25, knockback: 2.8, hitStopMs: 32, arc: { min: -28, max: 40 } },
    5: { damageMul: 1.25, reachMul: 1.3, knockback: 3.0, hitStopMs: 34, arc: { min: -28, max: 40 } },
    7: { damageMul: 1.6, reachMul: 1.4, knockback: 5.2, hitStopMs: 50, shakePx: 2.4, isCrit: true, arc: { min: -75, max: 30 } },
  };

  const comboGif = {
    ready: false,
    playing: false,
    done: false,
    frame: 0,
    startedAt: 0,
    lastNow: 0,
    raf: 0,
    images: [],
    current: null,
    queue: [],
    locked: { attack1: false, attack2: false },
  };
  const comboClick = {
    count: 0,
    lastAt: 0,
  };

  const swordCombo = {
    nextStep: 0,
    attacking: false,
    stepIndex: -1,
    attackStartedAt: 0,
    attackElapsed: 0,
    lastTickAt: 0,
    lastAttackAt: 0,
    buffered: false,
    hitStopUntil: 0,
    hitIds: null,
    nudgeX: 0,
    shakeAmp: 0,
    shakeUntil: 0,
    stepCfg: null,
    lastPoseFrame: 0,
    slashShown: false,
    slashPoseKey: "",
  };

  const comboArt = {
    ready: false,
    poseFrames: [],
    slashFrames: [],
    bodyFrames: Object.create(null),
    bodyIdle: "",
  };

  const armSocketEl = document.getElementById("arm-socket");
  const armWeaponEl = document.getElementById("arm-weapon");
  const slashVfxEl = document.getElementById("slash-vfx");
  const SHOP_PRICE = 20;
  const SHOP_CATALOG = {
    baojian: {
      name: "纯阳剑",
      price: SHOP_PRICE,
      icon: "assets/shop/baojian.png",
      desc: "点击挥砍单体斩击（左右皆可）；攻击力 +2。可多次购买叠加。",
      effect: "攻击力 +2",
      apply() {
        buffs.atk += 2;
      },
    },
    bajiaoshan: {
      name: "芭蕉扇",
      price: SHOP_PRICE,
      icon: "assets/shop/bajiaoshan.png",
      desc: "点击挥砍范围扇击；范围 +48。可多次购买叠加。",
      effect: "攻击范围 +48",
      apply() {
        buffs.reach += 48;
      },
    },
    fenghuolun: {
      name: "风火轮",
      price: SHOP_PRICE,
      icon: "assets/shop/fenghuolun.png",
      desc: "脚踏风火，移动速度 +0.7。可多次购买叠加。",
      effect: "移动速度 +0.7",
      apply() {
        buffs.speed += 0.7;
      },
    },
  };
  /* 攻击扇区（相对水平向前，y 轴向上），单位度 */
  const KNIFE_ARC = { min: -22, max: 22 }; /* 旧前刺扇区（保留） */
  const SWORD_SLASH_ARC = { min: -48, max: 52 }; /* 吕洞宾：横向挥砍 */
  const THRUST_FRAMES = 12; /* ≈0.2s，与天兵前刺一致 */
  const FAN_VERT_ARC = { min: 18, max: 112 }; /* 钟离权：纵向弧 */
  const MIN_GAP_SPACING = 420;
  const MIN_BOSS_SPACING = 1400;
  const MIN_COIN_GAP = 110;
  /* 可活动世界宽度 ≈ 1.5 屏：满屏走完后还剩约半屏 */
  const ARENA_SCREEN_RATIO = 1.5;
  const ARENA_EDGE_PAD = 48;
  let arenaWidth = 1350;

  /**
   * 用与游戏相同的逐帧物理，模拟「起跳 + 顶点二连跳 + 落回原高度」的最大滞空帧数。
   * 水平跨距按角色移速估算；缝隙上限再取比例。
   */
  function maxDoubleJumpAirFrames() {
    let y = 0;
    let vy = JUMP_V;
    let jumpsLeft = MAX_JUMPS - 1;
    let usedSecond = false;
    let frames = 0;
    for (let i = 0; i < 600; i++) {
      frames += 1;
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

  const MAX_SAFE_GAP = maxDoubleJumpAirFrames() * MOVE_SPEED * GAP_SAFE_RATIO;

  function maxSafeGap() {
    return MAX_SAFE_GAP;
  }

  function randomGap(minRatio = 0.35) {
    if (FORCE_ZERO_GAP || TEST_ACTIONS) return 0;
    const maxG = maxSafeGap();
    const minG = Math.min(maxG, Math.max(24, maxG * minRatio));
    const gap = minG + Math.random() * (maxG - minG);
    return Math.min(maxG, gap);
  }

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const cursorPos = { x: -40, y: -40, tx: -40, ty: -40 };
  /* 开发期直接进格斗；正式游玩保持 false 以显示选人页 */
  const SKIP_INTRO = false;
  /* 开发期：跳过游玩，直接打开关卡间法宝商店；正式游玩改回 false */
  const SKIP_TO_SHOP = false;
  /* 测动作：无限倒计时、不刷怪；测完改回 false */
  const TEST_ACTIONS = false;

  const runScroll = { world: 0 };
  /* 场景视差平滑状态（避免跳跃时背景跟着抖） */
  const viewFx = { x: 0, y: 0 };
  const keys = { w: false, a: false, s: false, d: false };
  const tapDash = { lastKey: "", lastAt: 0, dir: 0 };
  const hero = {
    x: 180,
    y: 110,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    dead: false,
    jumpsLeft: MAX_JUMPS,
    jumpLock: 0,
    jumpBufferedUntil: 0,
    coyoteUntil: 0,
    airGroundY: null,
    hp: MAX_HP,
    swordAnimFrames: 0,
    fanAnimFrames: 0,
    swordReadyAt: 0,
    fanReadyAt: 0,
    hurtFrames: 0,
    moveDirX: 0,
    moveDirY: 0,
  };
  /** 脚部行走：位移只改 local，且始终相对初始位置，禁止累积 */
  const footWalk = {
    enabled: false,
    phase: 0,
    phaseElapsed: 0,
    active: false,
    leftBase: { x: 0, y: 0 },
    rightBase: { x: 0, y: 0 },
    lastOxL: null,
    lastOyL: null,
    lastOxR: null,
    lastOyR: null,
  };
  const platforms = [];
  const coins = [];
  const enemies = [];
  let coinCount = 0;
  let nextX = 0;
  let lastGapAt = -9999;
  let lastBossAt = -9999;
  let flatStreak = 0;
  let selected = "blue";
  let heroLives = START_LIVES;
  let gameOver = false;
  let started = false;
  let running = false;
  let paused = false;
  let stage = 1;
  let stageTimeLeft = 30;
  let stageClock = 0;
  let waveCooldown = 0;
  let stageBusy = false;
  let inShop = false;
  let shopFocus = -1;
  let pendingNextStage = 2;
  let stageSpawned = 0;
  let stageEnemyTotal = 0;
  const buffs = { atk: 0, reach: 0, speed: 0 };
  const shopBought = { baojian: 0, bajiaoshan: 0, fenghuolun: 0 };
  let coinImgUrl = COIN_SRC;
  let enemyImgUrl = ENEMY_SRC;
  let enemyWeaponUrl = ENEMY_WEAPON_SRC;
  let knifeImgUrl = KNIFE_SRC;
  let floorImgUrl = FLOOR_SRC;
  /* 顶部透明区对应的显示像素，用于脚底对齐实体顶面 */
  let floorTopPad = 0;
  let audioCtx = null;

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

  function imageSize(img) {
    return {
      w: img.naturalWidth || img.width || 0,
      h: img.naturalHeight || img.height || 0,
    };
  }

  /** 大图先缩小再抠图，避免 1500px+ 立绘卡死主线程 */
  function downsampleImage(img, maxSide = 320) {
    const { w, h } = imageSize(img);
    if (!w || !h) return img;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    if (scale >= 0.999) return img;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function punchWhite(img, threshold) {
    const { w, h } = imageSize(img);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
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
    const { w, h } = imageSize(img);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
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

  function punchNearBlack(img, threshold = 18) {
    const { w, h } = imageSize(img);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] <= threshold && px[i + 1] <= threshold && px[i + 2] <= threshold) {
        px[i + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
    return c;
  }

  function sliceSheetFrames(img, cols) {
    const { w, h } = imageSize(img);
    const fw = Math.floor(w / cols);
    const frames = [];
    for (let i = 0; i < cols; i++) {
      const c = document.createElement("canvas");
      c.width = fw;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, i * fw, 0, fw, h, 0, 0, fw, h);
      frames.push(c.toDataURL("image/png"));
    }
    return frames;
  }

  /** 吕洞宾全身帧已抠好透明底，直接使用原图 */
  function loadBodySprite(src) {
    return src;
  }

  async function setRunnerSprite(heroId) {
    const src = HERO_SRC[heroId] || HERO_SRC.red;
    if (!runnerSprite || !runner) return;
    runner.dataset.hero = heroId;
    runnerSprite.src = src;
    runnerSprite.style.opacity = "1";
    runnerSprite.style.visibility = "visible";
    runner.style.opacity = "1";
    runner.style.visibility = "visible";
    if (heroId === "blue") {
      footWalk.enabled = false;
      runner.classList.add("is-combo-gif");
      runner.classList.remove("has-foot-walk");
      if (playerFeetEl) playerFeetEl.hidden = true;
      resetFootWalk(true);
    } else if (runner) {
      footWalk.enabled = false;
      runner.classList.remove("has-foot-walk", "is-combo-gif");
      if (playerFeetEl) playerFeetEl.hidden = true;
      resetFootWalk(true);
    }
  }

  function initPlayerFeet() {
    if (!playerFootLeft || !playerFootRight || !runner) return;
    playerFootLeft.src = PLAYER_FOOT_SRC.left;
    playerFootRight.src = PLAYER_FOOT_SRC.right;
    footWalk.leftBase = { x: -35, y: 0 };
    footWalk.rightBase = { x: -35, y: 0 };
    footWalk.enabled = true;
    runner.classList.add("has-foot-walk");
    if (playerFeetEl) playerFeetEl.hidden = false;
    resetFootWalk(true);
  }

  function setFootLocal(el, base, ox, oy, side) {
    if (!el) return;
    const x = (base.x + (ox | 0)) | 0;
    const y = (base.y + (oy | 0)) | 0;
    if (side === "L") {
      if (footWalk.lastOxL === x && footWalk.lastOyL === y) return;
      footWalk.lastOxL = x;
      footWalk.lastOyL = y;
    } else {
      if (footWalk.lastOxR === x && footWalk.lastOyR === y) return;
      footWalk.lastOxR = x;
      footWalk.lastOyR = y;
    }
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function resetFootWalk(force) {
    footWalk.phase = 0;
    footWalk.phaseElapsed = 0;
    footWalk.active = false;
    if (force) {
      footWalk.lastOxL = null;
      footWalk.lastOyL = null;
      footWalk.lastOxR = null;
      footWalk.lastOyR = null;
    }
    setFootLocal(playerFootLeft, footWalk.leftBase, 0, 0, "L");
    setFootLocal(playerFootRight, footWalk.rightBase, 0, 0, "R");
  }

  /** 读取 WASD 轴并 normalize；世界方向 +x 右、+y 上 */
  function readMoveIntent() {
    let ix = 0;
    let iy = 0;
    if (keys.a) ix -= 1;
    if (keys.d) ix += 1;
    if (keys.w) iy += 1;
    if (keys.s) iy -= 1;
    const len = Math.hypot(ix, iy);
    if (len > 0) {
      ix /= len;
      iy /= len;
    }
    return { ix, iy, moving: len > 0 };
  }

  /**
   * 脚部步进：沿当前移动方向摆动。
   * 本地位移相对初始 base，禁止累积；抵消 scaleX(-1) 镜像。
   */
  function updateFootWalk(dtMs) {
    if (!footWalk.enabled || !playerFootLeft || !playerFootRight) return;
    if (swordCombo.attacking && SWORD_COMBO.useBodyFrames) {
      if (footWalk.active) resetFootWalk(true);
      return;
    }

    const moving =
      (Math.abs(hero.moveDirX) > 0.001 || Math.abs(hero.moveDirY) > 0.001) &&
      !hero.dead &&
      hero.onGround;

    if (!moving) {
      if (footWalk.active) resetFootWalk(true);
      return;
    }

    if (!footWalk.active) {
      footWalk.active = true;
      footWalk.phase = 0;
      footWalk.phaseElapsed = 0;
    }

    footWalk.phaseElapsed += dtMs;
    while (footWalk.phaseElapsed >= FOOT_STEP_MS) {
      footWalk.phaseElapsed -= FOOT_STEP_MS;
      footWalk.phase = (footWalk.phase + 1) % 4;
    }

    const nx = hero.moveDirX;
    const ny = hero.moveDirY;
    const face = hero.facing < 0 ? -1 : 1;
    const fxl = nx * face;
    const fyl = -ny;

    let leftFwd = 0;
    let rightFwd = 0;
    switch (footWalk.phase) {
      case 0:
        leftFwd = FOOT_FWD_PX;
        rightFwd = -FOOT_BACK_PX;
        break;
      case 1:
        leftFwd = 0;
        rightFwd = 0;
        break;
      case 2:
        leftFwd = -FOOT_BACK_PX;
        rightFwd = FOOT_FWD_PX;
        break;
      default:
        leftFwd = 0;
        rightFwd = 0;
        break;
    }

    setFootLocal(
      playerFootLeft,
      footWalk.leftBase,
      Math.round(fxl * leftFwd),
      Math.round(fyl * leftFwd),
      "L"
    );
    setFootLocal(
      playerFootRight,
      footWalk.rightBase,
      Math.round(fxl * rightFwd),
      Math.round(fyl * rightFwd),
      "R"
    );
  }

  async function prepareCoinArt() {
    coinImgUrl = COIN_SRC;
  }

  async function prepareEnemyArt() {
    enemyImgUrl = ENEMY_SRC;
    enemyWeaponUrl = ENEMY_WEAPON_SRC;
  }

  async function prepareKnifeArt() {
    knifeImgUrl = KNIFE_SRC;
  }

  async function prepareComboGif() {
    if (!comboStage) {
      comboGif.ready = false;
      return;
    }
    try {
      comboStage.innerHTML = "";
      const imgs = await Promise.all(
        COMBO_GIF_FILES.map((src, i) =>
          loadImage(src).then(async (img) => {
            try {
              if (img.decode) await img.decode();
            } catch (_) {}
            img.className = "combo-stage__frame";
            img.alt = "";
            img.draggable = false;
            img.dataset.frame = String(i);
            comboStage.appendChild(img);
            return img;
          })
        )
      );
      comboGif.images = imgs;
      comboGif.ready = imgs.length === COMBO_GIF_FILES.length;
      drawComboGifFrame(0);
    } catch (err) {
      console.warn("combo gif prepare failed", err);
      comboGif.ready = false;
    }
  }

  function comboActionDuration(id) {
    const a = comboActions[id];
    let t = 0;
    for (let i = a.start; i <= a.end; i++) t += comboFrames[i].duration;
    return t;
  }

  function comboSegmentFrameAt(elapsed, start, end) {
    let t = 0;
    for (let i = start; i <= end; i++) {
      t += comboFrames[i].duration;
      if (elapsed < t) return i;
    }
    return end;
  }

  function drawComboGifFrame(index) {
    const imgs = comboGif.images;
    if (!imgs || !imgs.length) return;
    const idx = Math.max(0, Math.min(imgs.length - 1, index | 0));
    for (let i = 0; i < imgs.length; i++) {
      imgs[i].classList.toggle("is-on", i === idx);
    }
  }

  function stopComboGifRaf() {
    if (comboGif.raf) {
      cancelAnimationFrame(comboGif.raf);
      comboGif.raf = 0;
    }
  }

  function resetComboRoundState() {
    comboGif.current = null;
    comboGif.queue = [];
    comboGif.locked = { attack1: false, attack2: false };
    comboClick.count = 0;
    comboClick.lastAt = 0;
  }

  function groundYAt(x) {
    const s = surfaceAt(x);
    return s != null ? s : hero.y;
  }

  function comboHopping() {
    return !!(window.SwordCombat && SwordCombat.hopping && SwordCombat.state === "attack");
  }

  function jumpCamBase() {
    if (hero.airGroundY != null) return hero.airGroundY;
    return groundYAt(hero.x);
  }

  function cameraLookY() {
    const shake = window.SwordCamera ? SwordCamera.getShake() : { x: 0, y: 0 };
    if (!comboHopping() && !hero.onGround) return shake.y;
    const base = groundYAt(hero.x);
    return (window.SwordCamera ? SwordCamera.followY - base : 0) + shake.y;
  }

  function worldLookY() {
    const shake = window.SwordCamera ? SwordCamera.getShake() : { x: 0, y: 0 };
    if (!comboHopping() && !hero.onGround) return shake.y;
    return cameraLookY();
  }

  function snapHeroToGround() {
    if (!hero.onGround) return;
    const s = surfaceAt(hero.x);
    if (s == null) return;
    hero.y = s;
    hero.vy = 0;
  }

  function syncComboStagePos() {
    if (window.SwordCombat && SwordCombat.ready) {
      const camX = window.SwordCamera ? SwordCamera.getX() : runScroll.world;
      SwordCombat.syncPos(hero, camX, cameraLookY());
      return;
    }
    if (!comboStage || comboStage.hidden) return;
    const scale = COMBO_SCALE;
    const x = (hero._sx != null ? hero._sx : 0) - 510;
    const y = hero._sy != null ? hero._sy : 0;
    const sx = hero.facing < 0 ? -scale : scale;
    comboStage.style.transform = `translate3d(${x}px, ${-y}px, 0) scale(${sx}, ${scale})`;
    comboStage.style.transformOrigin = "510px 569px";
  }

  function showComboGifStage(on) {
    if (!runner || !comboStage) return;
    runner.classList.toggle("is-combo-gif", !!on);
    comboStage.hidden = !on;
    comboStage.classList.toggle("is-on", !!on);
    if (on) {
      setComboPoseMode(true);
      if (playerFeetEl) playerFeetEl.hidden = true;
      resetFootWalk(true);
      syncComboStagePos();
    }
  }

  /** 吕洞宾待机：连招画布第 1 帧，不用旧身体和脚 */
  function showComboIdle() {
    if (selected !== "blue" || !comboStage) return false;
    if (window.SwordCombat && SwordCombat.ready) {
      SwordCombat.showIdle();
      showComboGifStage(true);
      swordCombo.attacking = false;
      if (runner) runner.classList.remove("is-attacking", "is-attacking-sword", "is-thrusting", "combo-charging");
      return true;
    }
    if (!comboGif.ready) return false;
    stopComboGifRaf();
    comboGif.playing = false;
    comboGif.done = false;
    comboGif.frame = 0;
    drawComboGifFrame(0);
    showComboGifStage(true);
    resetComboRoundState();
    swordCombo.attacking = false;
    swordCombo.stepCfg = null;
    swordCombo.hitIds = null;
    if (runner) {
      runner.classList.remove("is-attacking", "is-attacking-sword", "is-thrusting", "combo-charging");
    }
    return true;
  }

  function hideComboGif() {
    if (window.SwordCombat && SwordCombat.ready) {
      SwordCombat.reset();
      window.SwordInput && SwordInput.reset();
      window.SwordHitstop && SwordHitstop.clearOnScene();
    }
    stopComboGifRaf();
    comboGif.playing = false;
    comboGif.done = false;
    comboGif.frame = 0;
    resetComboRoundState();
    swordCombo.attacking = false;
    swordCombo.stepCfg = null;
    if (showComboIdle()) return;
    showComboGifStage(false);
    if (typeof setComboPoseMode === "function") setComboPoseMode(false);
  }

  function beginComboGifCombat() {
    const now = performance.now();
    swordCombo.attacking = true;
    swordCombo.stepIndex = 0;
    swordCombo.stepCfg = {
      id: "gif14",
      durationMs: 2400,
      chargeMs: 0,
      activeStartMs: 0,
      activeEndMs: 2400,
      damageMul: 1,
      reachMul: 1.2,
      arc: { min: -60, max: 40 },
      hitStopMs: 28,
      knockback: 2.6,
    };
    swordCombo.attackStartedAt = now;
    swordCombo.attackElapsed = 0;
    swordCombo.lastTickAt = now;
    swordCombo.lastAttackAt = now;
    swordCombo.buffered = false;
    swordCombo.hitIds = new Set();
    swordCombo.nudgeX = 0;
    swordCombo.slashShown = false;
    if (runner) {
      runner.classList.add("is-attacking", "is-attacking-sword", "combo-a1");
    }
  }

  function resolveComboGifHits(frameIdx) {
    const spec = COMBO_GIF_HITS[frameIdx];
    if (!spec || !running || hero.dead) return;
    const heroW = (runner && runner.offsetWidth) || 90;
    const { ox, oy } = attackOrigin(heroW);
    const reach = swordReach() * (spec.reachMul || 1);
    const hits = enemiesInArc(ox, oy, hero.facing, reach, spec.arc || SWORD_SLASH_ARC);
    if (!hits.length) return;
    let landed = false;
    const dmgBase = playerAtk() * (spec.damageMul || 1) * (SWORD_COMBO.damageMul || 1);
    const dmg = spec.isCrit ? dmgBase * (SWORD_COMBO.critDamageMul || 1) : dmgBase;
    for (let i = 0; i < hits.length; i++) {
      const e = hits[i];
      if (!e || e.dead) continue;
      const id = e.el || e;
      if (swordCombo.hitIds && swordCombo.hitIds.has(id)) continue;
      if (swordCombo.hitIds) swordCombo.hitIds.add(id);
      hurtBoss(e, dmg, { knockback: spec.knockback || 2.4, facing: hero.facing });
      landed = true;
    }
    if (landed) {
      applyComboHitStop(spec.hitStopMs || 24);
      if (spec.shakePx) triggerComboShake(spec.shakePx, spec.isCrit ? 140 : 90);
    }
  }

  function returnComboToIdle() {
    swordCombo.lastAttackAt = performance.now();
    showComboIdle();
  }

  function startComboAction(id) {
    const a = comboActions[id];
    if (!a) return;
    comboGif.current = id;
    comboGif.playing = true;
    comboGif.done = false;
    comboGif.startedAt = performance.now();
    comboGif.lastNow = comboGif.startedAt;
    comboGif.frame = a.start;
    showComboGifStage(true);
    drawComboGifFrame(a.start);
    beginComboGifCombat();
    swordCombo.hitIds = new Set();
    playComboSwingSfx(a.start);
    if (!comboGif.raf) comboGif.raf = requestAnimationFrame(tickComboGif);
  }

  function enqueueComboAction(id) {
    if (comboGif.locked[id]) return;
    comboGif.locked[id] = true;
    if (!comboGif.current) {
      startComboAction(id);
      return;
    }
    comboGif.queue.push(id);
  }

  function onComboActionComplete() {
    const next = comboGif.queue.shift();
    if (next) {
      startComboAction(next);
      return;
    }
    returnComboToIdle();
  }

  function tickComboGif(now) {
    if (!comboGif.playing || !comboGif.current) return;
    if (paused) {
      comboGif.startedAt += now - comboGif.lastNow;
      comboGif.lastNow = now;
      comboGif.raf = requestAnimationFrame(tickComboGif);
      return;
    }
    comboGif.lastNow = now;
    const a = comboActions[comboGif.current];
    const elapsed = now - comboGif.startedAt;
    const dur = comboActionDuration(comboGif.current);
    if (elapsed >= dur) {
      onComboActionComplete();
      if (comboGif.playing && comboGif.current) {
        comboGif.raf = requestAnimationFrame(tickComboGif);
      } else {
        comboGif.raf = 0;
      }
      return;
    }
    const idx = comboSegmentFrameAt(elapsed, a.start, a.end);
    if (idx !== comboGif.frame) {
      comboGif.frame = idx;
      drawComboGifFrame(idx);
      swordCombo.hitIds = new Set();
      playComboSwingSfx(idx);
    }
    if (running && !hero.dead && !inShop) {
      resolveComboGifHits(comboGif.frame);
    }
    comboGif.raf = requestAnimationFrame(tickComboGif);
  }

  function playComboSwingSfx(idx) {
    if (COMBO_SWING_FRAMES[idx]) sfxWhoosh();
  }

  function applyComboClickUnlock(count) {
    if (count === 1) enqueueComboAction("attack1");
    else if (count >= 2) enqueueComboAction("attack2");
  }

  function isHeroComboTarget(e) {
    const x = e.clientX;
    const y = e.clientY;
    const hit = (el) => {
      if (!el || el.hidden) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    return hit(runner) || hit(comboStage);
  }

  function updateComboClickWindow() {}

  /**
   * 单击立刻播 08→16；同一轮再点一下则在 16 后衔接 17→28。
   * 不使用原生 dblclick。播放完整段期间多余点击忽略。
   */
  function handleComboClick() {
    if (window.SwordCombat && SwordCombat.ready) {
      return SwordCombat.requestAttack(1, performance.now());
    }
    return false;
  }

  function playCombo() {
    if (window.SwordCombat && SwordCombat.ready) {
      return SwordCombat.requestAttack(3, performance.now());
    }
    return false;
  }

  function bindSwordSystem() {
    if (!window.SwordCombat || !window.SwordInput) return;
    SwordCombat.bind({
      getHero: () => hero,
      getView() {
        return {
          camX: window.SwordCamera ? SwordCamera.followX : runScroll.world,
          viewW: viewWidth(),
          pad: 12,
        };
      },
      moveHero(x, y) {
        const prevX = hero.x;
        hero.x = x;
        hero.y = y;
        hero.vy = 0;
        clampActorX(hero);
        clampHeroToView(hero);
        const halfW = ((runner && runner.offsetWidth) || 90) * 0.42;
        if (!(window.SwordCombat && SwordCombat.dashing)) {
          resolveEnemySolids(hero, halfW, prevX);
        }
      },
      strike(frameId, hitIds) {
        const spec = SwordConfig.hits[frameId];
        if (!spec || !running || hero.dead) return;
        const hits = enemiesInComboHit(frameId, spec);
        for (let i = 0; i < hits.length; i++) {
          const e = hits[i];
          if (!e || e.dead) continue;
          const id = e.el || e;
          if (hitIds.has(id)) continue;
          hitIds.add(id);
          const crit = !!(spec.crit || (spec.critChance && Math.random() < spec.critChance));
          const dmg = playerAtk() * (spec.damageMul || 1) * (crit ? spec.critMul || 1.5 : 1);
          hurtBoss(e, dmg, {
            knockback: (spec.knockback || 2.4) * (crit ? 1.25 : 1),
            facing: hero.facing,
          });
          if (crit && (frameId === "15" || frameId === "20" || frameId === "22" || frameId === "28") && window.SwordCamera) {
            const shake = (window.SwordConfig && SwordConfig.shake[frameId]) || { amp: 16, ms: 100, kind: "impact" };
            SwordCamera.triggerShake(frameId, performance.now(), {
              amp: (shake.amp || 16) * 1.15,
              ms: shake.ms || 100,
              kind: "impact",
              facing: hero.facing,
            });
          }
          syncBossEl(e);
        }
      },
      onAttackStart() {
        swordCombo.attacking = true;
        if (runner) runner.classList.add("is-attacking", "is-attacking-sword");
      },
      onAttackEnd() {
        swordCombo.attacking = false;
        if (runner) runner.classList.remove("is-attacking", "is-attacking-sword", "is-thrusting");
        const halfW = ((runner && runner.offsetWidth) || 90) * 0.42;
        const surface = surfaceAt(hero.x);
        if (surface != null) {
          hero.y = surface;
          hero.vy = 0;
          hero.onGround = true;
        } else {
          const landed = findLandingSurface(hero.y + 48, hero.y - 48, hero.x - halfW, hero.x + halfW);
          if (landed != null) {
            hero.y = landed;
            hero.vy = 0;
            hero.onGround = true;
          }
        }
      },
    });
    SwordInput.onConfirm = (n) => {
      if (!running || paused || hero.dead || inShop || selected !== "blue") return;
      SwordCombat.requestAttack(n, performance.now());
    };
    SwordInput.canCollect = () => {
      if (!running || paused || inShop || hero.dead || gameOver) return false;
      if (selected !== "blue" || !SwordCombat.ready) return false;
      if (SwordCombat.isBusy() && SwordCombat.attackId !== 1) return false;
      return document.hasFocus();
    };
    SwordInput.isUiEvent = (e) => {
      const t = e.target;
      return !!(
        t &&
        t.closest &&
        (t.closest(".bag-btn") ||
          t.closest(".bag-panel") ||
          t.closest(".shop") ||
          t.closest(".pause-overlay") ||
          t.closest(".gameover-overlay") ||
          t.closest(".hud") ||
          t.closest("button") ||
          t.closest("a"))
      );
    };
  }

  async function prepareComboArt() {
    try {
      bindSwordSystem();
      if (window.SwordCombat && comboStage) {
        await SwordCombat.prepare(comboStage);
        if (window.SwordAudio && SwordAudio.prepare) await SwordAudio.prepare();
        comboGif.ready = SwordCombat.ready;
        comboArt.ready = SwordCombat.ready;
        showComboGifStage(true);
        return;
      }
      await prepareComboGif();
      comboArt.bodyIdle = BLUE_BODY_ATK.idle;
      comboArt.bodyFrames = Object.create(null);
      comboArt.poseFrames = [];
      comboArt.slashFrames = [];
      comboArt.ready = comboGif.ready;
    } catch (err) {
      console.warn("combo art prepare failed", err);
      comboArt.ready = false;
    }
  }

  async function prepareFloorArt() {
    /* 真透明 PNG，直接使用；测量顶部透明高度以对齐站立面 */
    floorImgUrl = FLOOR_SRC;
    const img = await loadImage(FLOOR_SRC);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, w, h).data;
    let firstY = 0;
    outer: for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 16) {
          firstY = y;
          break outer;
        }
      }
    }
    floorTopPad = Math.round((firstY * FLOOR_UNIT_H) / h);
  }

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playTone({ freq, dur = 0.12, type = "square", vol = 0.07, slide = 0, delay = 0 }) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide > 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function sfxJump() {
    playTone({ freq: 280, dur: 0.1, type: "square", vol: 0.06, slide: 520 });
  }

  function sfxCoin() {
    playTone({ freq: 880, dur: 0.07, type: "triangle", vol: 0.08, slide: 1400 });
    playTone({ freq: 1320, dur: 0.1, type: "triangle", vol: 0.05, slide: 1800, delay: 0.05 });
  }

  function sfxAttack() {
    playTone({ freq: 420, dur: 0.14, type: "sawtooth", vol: 0.045, slide: 140 });
    playTone({ freq: 640, dur: 0.1, type: "square", vol: 0.035, slide: 220, delay: 0.02 });
  }

  /** 挥剑划破空气的破风声 */
  function sfxWhoosh() {
    if (window.SwordAudio) {
      SwordAudio.playSlash("15");
      return;
    }
    const ctx = ensureAudio();
    if (!ctx) return;
    const dur = 0.2;
    const t0 = ctx.currentTime;
    const n = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const env = 1 - i / n;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(2200, t0);
    filter.frequency.exponentialRampToValueAtTime(320, t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    playTone({ freq: 1100, dur: 0.11, type: "sawtooth", vol: 0.04, slide: 160 });
  }

  /** 天兵武器划破风声（略短，便于 0.2s 连刺） */
  function sfxEnemySlash() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const dur = 0.14;
    const t0 = ctx.currentTime;
    const n = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const env = 1 - i / n;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.85;
    filter.frequency.setValueAtTime(2600, t0);
    filter.frequency.exponentialRampToValueAtTime(380, t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    playTone({ freq: 980, dur: 0.08, type: "sawtooth", vol: 0.022, slide: 180 });
  }

  function sfxHit() {
    playTone({ freq: 180, dur: 0.08, type: "square", vol: 0.07, slide: 90 });
  }

  /** 连招每一击：破风 + 命中顿挫 */
  function sfxComboStrike() {
    sfxWhoosh();
    playTone({ freq: 220, dur: 0.09, type: "square", vol: 0.08, slide: 70 });
    playTone({ freq: 90, dur: 0.11, type: "sawtooth", vol: 0.05, slide: 55, delay: 0.012 });
  }

  /** 掉命：短促偏高两声（类马里奥踩怪，无下滑、不闷） */
  function sfxLifeLost() {
    playTone({ freq: 1175, dur: 0.045, type: "square", vol: 0.085 });
    playTone({ freq: 1568, dur: 0.05, type: "square", vol: 0.08, delay: 0.075 });
  }

  function flashPortraitOnLifeLost() {
    const member = document.querySelector(`.party .member[data-hero="${selected}"]`);
    if (!member) return;
    const portrait = member.querySelector(".portrait");
    if (!portrait) return;
    portrait.classList.remove("is-life-flash");
    void portrait.offsetWidth;
    portrait.classList.add("is-life-flash");
    const clear = () => portrait.classList.remove("is-life-flash");
    portrait.addEventListener("animationend", clear, { once: true });
  }

  function pointInAttackArc(ox, oy, px, py, facing, reach, arc) {
    const dx = (px - ox) * (facing < 0 ? -1 : 1);
    const dy = py - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > reach || dist < 10) return false;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const min = arc && arc.min != null ? arc.min : KNIFE_ARC.min;
    const max = arc && arc.max != null ? arc.max : KNIFE_ARC.max;
    return deg >= min && deg <= max;
  }

  function swordReach() {
    return ATTACK_REACH + buffs.reach;
  }

  function fanReach() {
    return ATTACK_REACH + buffs.reach;
  }

  function attackOrigin(heroW) {
    return {
      ox: hero.x + hero.facing * heroW * 0.12,
      oy: hero.y + 46,
    };
  }

  function enemiesInComboHit(frameId, spec) {
    const shift = (window.SwordConfig && SwordConfig.frameShift && SwordConfig.frameShift[frameId]) || {};
    const facing = hero.facing < 0 ? -1 : 1;
    const shiftX =
      window.SwordCombat && SwordCombat.appliedShiftX != null ? SwordCombat.appliedShiftX : shift.x || 0;
    const reach = swordReach() * ((spec && spec.reachMul) || 1) + shiftX * 0.65 + 48;
    const hits = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead) continue;
      const dx = (e.x - hero.x) * facing;
      const dy = Math.abs((e.y || 0) - hero.y);
      if (dx < -36 || dx > reach) continue;
      if (dy > 96) continue;
      hits.push(e);
    }
    return hits;
  }

  function enemiesInArc(ox, oy, facing, reach, arc) {
    const hits = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const eCx = e.x;
      const eCy = e.y + e.h * 0.42;
      if (pointInAttackArc(ox, oy, eCx, eCy, facing, reach, arc)) hits.push(e);
    }
    return hits;
  }

  function nearestEnemy(list, ox, oy) {
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const d = Math.hypot(e.x - ox, e.y + e.h * 0.42 - oy);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function activeHpBar() {
    const member = document.querySelector(`.party .member[data-hero="${selected}"]`);
    return member ? member.querySelector(".bar") : null;
  }

  function renderHp() {
    const bar = activeHpBar();
    if (!bar) return;
    const pills = bar.querySelectorAll("i");
    const n = pills.length || 1;
    const filled = Math.ceil((Math.max(0, hero.hp) / MAX_HP) * n);
    pills.forEach((el, i) => {
      el.classList.toggle("is-empty", i >= filled);
    });
  }

  function renderLives() {
    document.querySelectorAll(".party .member").forEach((member) => {
      const n = member.querySelector(".lives__n");
      if (n) n.textContent = String(Math.max(0, heroLives));
      member.classList.toggle("is-out", heroLives <= 0);
    });
  }

  function syncPartyHud() {
    // 选人/加载中：红蓝头像+血条都显示；真正进入关卡页后才只留出战角色（命数同时出现）
    const single = running || game.classList.contains("is-running");
    document.querySelectorAll(".party .member").forEach((member) => {
      if (!single) {
        member.hidden = false;
        return;
      }
      member.hidden = member.dataset.hero !== selected;
    });
    renderHp();
    renderLives();
  }

  function openGameOver(reason = "lives") {
    gameOver = true;
    paused = true;
    hero.dead = true;
    hero.vx = 0;
    hero.vy = 0;
    stageBusy = true;
    if (toast) {
      toast.hidden = true;
      toast.classList.remove("is-show");
    }
    if (pauseOverlay) pauseOverlay.hidden = true;
    if (shopEl) shopEl.hidden = true;
    inShop = false;
    game.classList.remove("is-shop");
    runway.classList.add("is-paused");
    if (bagBtn) bagBtn.hidden = true;
    setBagOpen(false);
    if (gameoverTitleEl) {
      gameoverTitleEl.textContent = reason === "timeout" ? "时间到" : "命数耗尽";
    }
    if (gameoverHintEl) {
      gameoverHintEl.textContent =
        reason === "timeout"
          ? "未能在通关时间内消灭全部天兵"
          : "是否再来一局挑战宝阁？";
    }
    if (gameoverContinueBtn) gameoverContinueBtn.textContent = "再来一局";
    if (gameoverOverlay) {
      gameoverOverlay.hidden = false;
      gameoverOverlay.removeAttribute("hidden");
    }
    game.classList.add("is-gameover");
    cursor.classList.remove("is-on");
    renderLives();
  }

  /** 再来一局：从第 1 关重新开始 */
  function continueChallenge() {
    if (!gameOver) return;
    gameOver = false;
    if (gameoverOverlay) gameoverOverlay.hidden = true;
    game.classList.remove("is-gameover");
    if (bagBtn) bagBtn.hidden = false;
    inShop = false;
    stageBusy = false;
    if (shopEl) shopEl.hidden = true;
    game.classList.remove("is-shop");
    heroLives = START_LIVES;
    hero.hp = MAX_HP;
    hero.dead = false;
    hero.hurtFrames = 0;
    resetRunBuffs();
    grantStartingLoadout();
    coinCount = 0;
    drawCoinCount(formatCoins(0));
    renderHp();
    renderLives();
    initTrack();
    running = true;
    setPaused(false);
    syncHeroEl();
    syncPartyHud();
    showToast("再来一局 · 第 1 关", 1100);
  }

  /** 退出游戏：回到初始选人页 */
  function quitGame() {
    window.location.reload();
  }

  function heroScreenX() {
    const raw = getComputedStyle(runway).getPropertyValue("--hero-x").trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 120;
  }

  function formatCoins(n) {
    return `x${String(Math.min(999, Math.max(0, n))).padStart(3, "0")}`;
  }

  function playerAtk() {
    return PLAYER_ATK + buffs.atk;
  }

  function tapDashActive() {
    return (tapDash.dir < 0 && keys.a && !keys.d) || (tapDash.dir > 0 && keys.d && !keys.a);
  }

  function noteMoveTap(key, now) {
    if (key !== "a" && key !== "d") return;
    const dir = key === "a" ? -1 : 1;
    if (tapDash.lastKey === key && now - tapDash.lastAt <= TAP_DASH_MS) tapDash.dir = dir;
    else if (tapDash.dir && tapDash.dir !== dir) tapDash.dir = 0;
    tapDash.lastKey = key;
    tapDash.lastAt = now;
  }

  function playerMoveSpeed() {
    return (MOVE_SPEED + buffs.speed) * (tapDashActive() ? TAP_DASH_MUL : 1);
  }

  function resetRunBuffs() {
    buffs.atk = 0;
    buffs.reach = 0;
    buffs.speed = 0;
    shopBought.baojian = 0;
    shopBought.bajiaoshan = 0;
    shopBought.fenghuolun = 0;
  }

  function hasSword() {
    return (shopBought.baojian || 0) > 0 || slotsHaveWeaponKind("sword");
  }

  function hasFan() {
    return (shopBought.bajiaoshan || 0) > 0 || slotsHaveWeaponKind("fan");
  }

  function hasMeleeVisual() {
    return hasSword() || hasFan();
  }

  function itemVisualCount(id) {
    return Math.min(6, Math.max(0, shopBought[id] | 0));
  }

  /* ========== Weapon Slot 系统（总数固定 6，锚点可自由分配）========== */
  const ANCHOR_TYPE = {
    LeftHand: "LeftHand",
    RightHand: "RightHand",
    Feet: "Feet",
  };

  /** 身体锚点基准（相对 .runner__body：left%/bottom% + 像素微调） */
  const ANCHOR_BASE = {
    RightHand: { leftPct: 100, bottomPct: 42, ox: -18, oy: -13 },
    LeftHand: { leftPct: 18, bottomPct: 44, ox: 6, oy: -10 },
    Feet: { leftPct: 50, bottomPct: 6, ox: 0, oy: 2 },
  };

  const WEAPON_SLOT_COUNT = 6;
  /** Debug：显示 6 个槽位标记；游戏内按 F9 开关 */
  let WEAPON_SLOT_DEBUG = false;

  function makeEmptySlot(anchorType, localPos, renderOrder) {
    return {
      anchorType: anchorType || ANCHOR_TYPE.RightHand,
      localPosition: {
        x: (localPos && localPos.x) || 0,
        y: (localPos && localPos.y) || 0,
      },
      localRotation: 0,
      localScale: 1,
      renderOrder: renderOrder != null ? renderOrder : 0,
      equippedWeapon: null,
      _el: null,
      _marker: null,
    };
  }

  /** 默认布局：1 右手 + 1 左手 + 4 脚（脚部错开，避免重叠） */
  function createDefaultWeaponSlots() {
    return [
      makeEmptySlot(ANCHOR_TYPE.RightHand, { x: 0, y: 0 }, 5),
      makeEmptySlot(ANCHOR_TYPE.LeftHand, { x: 0, y: 0 }, 4),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: -14, y: 0 }, 1),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: 14, y: 0 }, 2),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: -7, y: 5 }, 3),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: 7, y: 5 }, 0),
    ];
  }

  const WeaponSlots = createDefaultWeaponSlots();

  function createWeaponInstance(itemId, overrides) {
    const catalog = SHOP_CATALOG[itemId];
    const kind =
      itemId === "baojian" ? "sword" : itemId === "bajiaoshan" ? "fan" : itemId === "fenghuolun" ? "wheel" : "sword";
    return {
      id: itemId,
      kind,
      name: (overrides && overrides.name) || (catalog && catalog.name) || itemId,
      icon:
        (overrides && overrides.icon) ||
        (catalog && catalog.icon) ||
        "assets/shop/baojian.png",
    };
  }

  function slotsHaveWeaponKind(kind) {
    for (let i = 0; i < WeaponSlots.length; i++) {
      const w = WeaponSlots[i].equippedWeapon;
      if (w && w.kind === kind) return true;
    }
    return false;
  }

  function preferredAnchorsForWeapon(weapon) {
    if (!weapon) return [ANCHOR_TYPE.RightHand];
    if (weapon.kind === "wheel") return [ANCHOR_TYPE.Feet, ANCHOR_TYPE.RightHand, ANCHOR_TYPE.LeftHand];
    if (weapon.kind === "fan") return [ANCHOR_TYPE.LeftHand, ANCHOR_TYPE.RightHand, ANCHOR_TYPE.Feet];
    return [ANCHOR_TYPE.RightHand, ANCHOR_TYPE.LeftHand, ANCHOR_TYPE.Feet];
  }

  function findSlotForEquip(weapon) {
    const prefs = preferredAnchorsForWeapon(weapon);
    for (let p = 0; p < prefs.length; p++) {
      const anchor = prefs[p];
      for (let i = 0; i < WeaponSlots.length; i++) {
        const s = WeaponSlots[i];
        if (s.anchorType === anchor && !s.equippedWeapon) return i;
      }
    }
    for (let i = 0; i < WeaponSlots.length; i++) {
      if (!WeaponSlots[i].equippedWeapon) return i;
    }
    return -1;
  }

  function equipWeapon(slotIndex, weapon) {
    if (slotIndex < 0 || slotIndex >= WEAPON_SLOT_COUNT) return false;
    if (!weapon) return false;
    WeaponSlots[slotIndex].equippedWeapon = {
      id: weapon.id,
      kind: weapon.kind,
      name: weapon.name,
      icon: weapon.icon,
    };
    renderWeaponSlots();
    return true;
  }

  function unequipWeapon(slotIndex) {
    if (slotIndex < 0 || slotIndex >= WEAPON_SLOT_COUNT) return false;
    WeaponSlots[slotIndex].equippedWeapon = null;
    renderWeaponSlots();
    return true;
  }

  function setSlotAnchor(slotIndex, anchorType) {
    if (slotIndex < 0 || slotIndex >= WEAPON_SLOT_COUNT) return false;
    if (!ANCHOR_BASE[anchorType]) return false;
    WeaponSlots[slotIndex].anchorType = anchorType;
    renderWeaponSlots();
    return true;
  }

  function clearAllWeaponSlots() {
    for (let i = 0; i < WeaponSlots.length; i++) {
      WeaponSlots[i].equippedWeapon = null;
    }
  }

  function ensureWeaponSlotElements() {
    if (!weaponRack) return;
    weaponRack.hidden = false;
    if (weaponRack.dataset.slotSystem === "1" && weaponRack.childElementCount >= WEAPON_SLOT_COUNT) {
      return;
    }
    weaponRack.innerHTML = "";
    weaponRack.dataset.slotSystem = "1";
    for (let i = 0; i < WEAPON_SLOT_COUNT; i++) {
      const el = document.createElement("div");
      el.className = "wslot";
      el.dataset.slot = String(i);

      const arm = document.createElement("div");
      arm.className = "weapon-arm";
      const arc = document.createElement("div");
      arc.className = "weapon-arc";
      arc.setAttribute("aria-hidden", "true");
      const img = document.createElement("img");
      img.className = "weapon-sprite";
      img.alt = "";
      img.draggable = false;
      arm.appendChild(arc);
      arm.appendChild(img);
      el.appendChild(arm);

      const marker = document.createElement("div");
      marker.className = "wslot__marker";
      marker.textContent = String(i);
      marker.setAttribute("aria-hidden", "true");
      el.appendChild(marker);

      weaponRack.appendChild(el);
      WeaponSlots[i]._el = el;
      WeaponSlots[i]._marker = marker;
    }
  }

  function renderWeaponSlots() {
    if (!weaponRack || !runner) return;
    ensureWeaponSlotElements();

    let anyWeapon = false;
    let anySword = false;
    let anyFan = false;

    const order = WeaponSlots.map((s, i) => i).sort(
      (a, b) => (WeaponSlots[a].renderOrder | 0) - (WeaponSlots[b].renderOrder | 0)
    );

    for (let o = 0; o < order.length; o++) {
      const i = order[o];
      const slot = WeaponSlots[i];
      let el = slot._el;
      if (!el || !el.isConnected) {
        ensureWeaponSlotElements();
        el = slot._el;
      }
      if (!el) continue;

      const base = ANCHOR_BASE[slot.anchorType] || ANCHOR_BASE.RightHand;
      const lx = (slot.localPosition && slot.localPosition.x) || 0;
      const ly = (slot.localPosition && slot.localPosition.y) || 0;
      const rot = slot.localRotation || 0;
      const scale = slot.localScale != null ? slot.localScale : 1;

      el.style.left = `${base.leftPct}%`;
      el.style.bottom = `${base.bottomPct}%`;
      el.style.zIndex = String(10 + (slot.renderOrder | 0));
      el.style.setProperty("--wx", `${(base.ox || 0) + lx}px`);
      el.style.setProperty("--wy", `${-((base.oy || 0) + ly)}px`);
      el.style.setProperty("--wrot", `${rot}deg`);
      el.style.setProperty("--wscale", String(scale));
      el.dataset.anchor = slot.anchorType;

      const arm = el.querySelector(".weapon-arm");
      const arc = el.querySelector(".weapon-arc");
      const img = el.querySelector(".weapon-sprite");
      const marker = slot._marker || el.querySelector(".wslot__marker");
      const weapon = slot.equippedWeapon;

      if (weapon && img && arm && arc) {
        anyWeapon = true;
        const kind = weapon.kind || "sword";
        if (kind === "sword") anySword = true;
        if (kind === "fan") anyFan = true;
        arm.className = `weapon-arm weapon-arm--${kind}`;
        arc.className = `weapon-arc weapon-arc--${kind}`;
        img.className = `weapon-sprite weapon-sprite--${kind}`;
        img.src = weapon.icon;
        img.hidden = false;
        arm.hidden = false;
      } else if (img && arm) {
        img.removeAttribute("src");
        img.hidden = true;
        arm.className = "weapon-arm";
        if (arc) arc.className = "weapon-arc";
      }

      if (marker) {
        marker.hidden = !WEAPON_SLOT_DEBUG;
        marker.dataset.anchor = slot.anchorType;
        marker.title = `Slot${i} · ${slot.anchorType}${weapon ? ` · ${weapon.name}` : " · empty"}`;
      }
    }

    weaponRack.hidden = !anyWeapon && !WEAPON_SLOT_DEBUG;
    weaponRack.classList.toggle("is-debug", WEAPON_SLOT_DEBUG);
    runner.classList.toggle("has-sword", anySword);
    runner.classList.toggle("has-fan", anyFan);
    runner.classList.toggle("has-melee", anySword || anyFan);
    runner.classList.toggle("is-knife-hero", selected === "blue");
    runner.classList.toggle("is-fan-hero", selected === "red");
  }

  /**
   * 按库存重建 6 槽装备（默认武器 + 商店购入）。
   * 数量上限仍为 6；超出部分只保留数值 buff，不再显示。
   */
  function syncWeaponVisual() {
    clearAllWeaponSlots();

    /* 吕洞宾全身帧已含佩剑，不再叠武器架剑 */
    if (selected === "blue" && SWORD_COMBO.useBodyFrames) {
      renderWeaponSlots();
      if (weaponRack) weaponRack.hidden = true;
      runner.classList.remove("has-sword", "has-fan", "has-melee");
      runner.classList.add("is-knife-hero");
      runner.classList.remove("is-fan-hero");
      return;
    }

    const needSword = Math.max(shopBought.baojian | 0, selected === "blue" ? 1 : 0);
    const needFan = Math.max(shopBought.bajiaoshan | 0, selected === "red" ? 1 : 0);
    const needWheel = shopBought.fenghuolun | 0;

    for (let n = 0; n < needSword; n++) {
      const w =
        selected === "blue" && n === 0
          ? createWeaponInstance("baojian")
          : createWeaponInstance("baojian");
      const idx = findSlotForEquip(w);
      if (idx < 0) break;
      WeaponSlots[idx].equippedWeapon = w;
    }
    for (let n = 0; n < needFan; n++) {
      const w =
        selected === "red" && n === 0
          ? createWeaponInstance("bajiaoshan", { icon: "assets/shanzi.png" })
          : createWeaponInstance("bajiaoshan");
      const idx = findSlotForEquip(w);
      if (idx < 0) break;
      WeaponSlots[idx].equippedWeapon = w;
    }
    for (let n = 0; n < needWheel; n++) {
      const w = createWeaponInstance("fenghuolun");
      const idx = findSlotForEquip(w);
      if (idx < 0) break;
      WeaponSlots[idx].equippedWeapon = w;
    }

    renderWeaponSlots();
  }

  /** 开局按角色显示默认兵器外观（不计入商店已购） */
  function grantStartingLoadout() {
    syncWeaponVisual();
  }

  function setWeaponSlotDebug(on) {
    WEAPON_SLOT_DEBUG = !!on;
    renderWeaponSlots();
  }

  function toggleWeaponSlotDebug() {
    setWeaponSlotDebug(!WEAPON_SLOT_DEBUG);
    showToast(WEAPON_SLOT_DEBUG ? "Weapon Slot Debug ON" : "Weapon Slot Debug OFF", 900);
  }

  /* 控制台 / 外部调试用 */
  window.WeaponSlotAPI = {
    slots: WeaponSlots,
    equipWeapon,
    unequipWeapon,
    setSlotAnchor,
    setDebug: setWeaponSlotDebug,
    render: renderWeaponSlots,
    ANCHOR_TYPE,
    ANCHOR_BASE,
  };
  window.playCombo = playCombo;

  function ownedShopSummary() {
    const parts = [];
    Object.keys(SHOP_CATALOG).forEach((id) => {
      const qty = shopBought[id] | 0;
      if (qty > 0) parts.push(`${SHOP_CATALOG[id].name}×${qty}`);
    });
    return parts.join(" · ");
  }

  function syncShopTip() {
    if (shopFocus < 0 || !shopSlots[shopFocus]) {
      if (shopTipEl) shopTipEl.classList.remove("is-detail");
      if (shopTipName) {
        shopTipName.hidden = false;
        shopTipName.textContent = "点击商品查看详情";
      }
      if (shopTipDesc) {
        shopTipDesc.textContent = "选中后点购买；备好后点「进入下一关」继续闯关";
      }
      return;
    }
    const id = shopSlots[shopFocus].dataset.item;
    const item = SHOP_CATALOG[id];
    if (!item) return;
    if (shopTipEl) shopTipEl.classList.add("is-detail");
    if (shopTipName) shopTipName.hidden = true;
    if (shopTipDesc) {
      const owned = shopBought[id] || 0;
      const effect = item.effect || item.desc;
      shopTipDesc.textContent =
        owned > 0 ? `${effect}（已拥有 x${owned}）` : effect;
    }
  }

  function syncShopUi() {
    if (shopGoldEl) shopGoldEl.textContent = String(coinCount);
    shopSlots.forEach((btn, i) => {
      const id = btn.dataset.item;
      const item = SHOP_CATALOG[id];
      if (!item) return;
      const owned = shopBought[id] | 0;
      btn.classList.toggle("is-focus", i === shopFocus);
      btn.classList.toggle("is-broke", coinCount < item.price);
      btn.classList.toggle("is-owned", owned > 0);
      const priceEl = btn.querySelector(".shop-slot__price b");
      if (priceEl) priceEl.textContent = String(item.price);
      const frame = btn.querySelector(".shop-slot__frame");
      let ownedEl = btn.querySelector(".shop-slot__owned");
      if (!ownedEl && frame) {
        ownedEl = document.createElement("span");
        ownedEl.className = "shop-slot__owned";
        frame.appendChild(ownedEl);
      }
      if (ownedEl) {
        ownedEl.textContent = `x${owned}`;
        ownedEl.hidden = owned <= 0;
      }
    });
    if (shopBuyBtn) {
      const sel = shopFocus >= 0 ? shopSlots[shopFocus] : null;
      const item = sel && SHOP_CATALOG[sel.dataset.item];
      shopBuyBtn.disabled = !item || coinCount < item.price;
    }
    syncShopTip();
  }

  function renderBagPanel() {
    if (!bagList) return;
    bagList.innerHTML = "";
    let total = 0;
    Object.keys(SHOP_CATALOG).forEach((id) => {
      const qty = shopBought[id] | 0;
      if (qty <= 0) return;
      total += qty;
      const item = SHOP_CATALOG[id];
      const row = document.createElement("div");
      row.className = "bag-item";
      row.innerHTML = `
        <img src="${item.icon}" alt="" draggable="false" />
        <div class="bag-item__meta">
          <strong>${item.name}</strong>
          <span>${item.desc}</span>
        </div>
        <span class="bag-item__qty">x${qty}</span>
      `;
      bagList.appendChild(row);
    });
    if (bagEmpty) bagEmpty.hidden = total > 0;
  }

  function setBagOpen(on) {
    if (!bagPanel) return;
    if (on) {
      renderBagPanel();
      bagPanel.hidden = false;
    } else {
      bagPanel.hidden = true;
    }
  }

  function toggleBag() {
    if (!running) return;
    setBagOpen(bagPanel && bagPanel.hidden);
  }

  function openShop(nextStage) {
    inShop = true;
    stageBusy = true;
    pendingNextStage = nextStage;
    shopFocus = -1;
    setBagOpen(false);
    if (shopEl) {
      shopEl.hidden = false;
      shopEl.removeAttribute("hidden");
    }
    if (stageTimerEl) stageTimerEl.hidden = true;
    if (bagBtn) bagBtn.hidden = true;
    if (shopNextBtn) shopNextBtn.innerHTML = `进入第 <span class="shop__next-n">${nextStage}</span> 关`;
    game.classList.add("is-shop");
    cursor.classList.remove("is-on");
    syncShopUi();
    showToast("宝阁商店开张", 1000);
  }

  function closeShopAndContinue() {
    if (!inShop) return;
    const next = pendingNextStage;
    inShop = false;
    if (shopEl) shopEl.hidden = true;
    game.classList.remove("is-shop");
    setBagOpen(false);
    if (bagBtn) bagBtn.hidden = false;
    showToast(`第 ${next} 关 · 开始！`, 1200);
    beginStage(next, false);
  }

  function selectShopItem(index) {
    if (!inShop || index < 0 || index >= shopSlots.length) return;
    shopFocus = index;
    syncShopUi();
  }

  function buySelectedShopItem() {
    if (!inShop || shopFocus < 0) {
      showToast("请先选择商品", 900);
      return false;
    }
    const id = shopSlots[shopFocus] && shopSlots[shopFocus].dataset.item;
    return buyShopItem(id);
  }

  function buyShopItem(id) {
    const item = SHOP_CATALOG[id];
    if (!item || !inShop) return false;
    if (coinCount < item.price) {
      showToast("金币不足", 900);
      syncShopUi();
      return false;
    }
    coinCount -= item.price;
    drawCoinCount(formatCoins(coinCount));
    item.apply();
    shopBought[id] = (shopBought[id] || 0) + 1;
    sfxCoin();
    showToast(`购得${item.name}`, 1000);
    syncWeaponVisual();
    syncShopUi();
    if (bagPanel && !bagPanel.hidden) renderBagPanel();
    return true;
  }

  function stageDuration(n) {
    if (n <= 1) return 30;
    if (n <= 2) return 40;
    return 60;
  }

  function stageMobStats(n) {
    const s = Math.max(1, n | 0);
    if (STAGE_MOB[s]) return STAGE_MOB[s];
    const base = STAGE_MOB[10];
    const extra = s - 10;
    return {
      hp: Math.round(base.hp + extra * 22),
      atk: Math.round(base.atk + extra * 3),
      count: base.count + extra * 4,
    };
  }

  function bossHpForStage(n) {
    return stageMobStats(n).hp;
  }

  function bossAtkForStage(n) {
    return stageMobStats(n).atk;
  }

  /** 单波刷怪数量（不超过本关剩余配额） */
  function waveSizeForStage(n) {
    const total = stageMobStats(n).count;
    return Math.min(8, Math.max(4, Math.ceil(total / 3)));
  }

  function livingEnemyCount() {
    let n = 0;
    for (let i = 0; i < enemies.length; i++) {
      if (!enemies[i].dead) n += 1;
    }
    return n;
  }

  function clearEnemies() {
    while (enemies.length) {
      const e = enemies.pop();
      if (e.el && e.el.isConnected) e.el.remove();
    }
  }

  function updateStageHud() {
    if (stageLabelEl) stageLabelEl.textContent = TEST_ACTIONS ? "测试" : `第 ${stage} 关`;
    if (stageTimeEl) {
      stageTimeEl.textContent = TEST_ACTIONS ? "∞" : String(Math.max(0, Math.ceil(stageTimeLeft)));
    }
    if (stageTimerEl) {
      stageTimerEl.classList.toggle("is-urgent", !TEST_ACTIONS && stageTimeLeft <= 5 && stageTimeLeft > 0);
    }
  }

  function dropCoinsFromBoss(boss) {
    const drops = 2 + ((Math.random() * 3) | 0) + Math.min(4, Math.max(0, stage - 1));
    for (let i = 0; i < drops; i++) {
      const ox = (Math.random() - 0.5) * 56;
      const oy = 36 + Math.random() * 48;
      addCoin(boss.x + ox, boss.y + oy, true);
    }
  }

  function spawnWave(count) {
    const plats = platforms.filter((p) => p.w >= 120);
    const left = Math.max(0, stageEnemyTotal - stageSpawned);
    count = Math.min(count | 0, left);
    if (!plats.length || count <= 0) return;
    for (let i = 0; i < count; i++) {
      const plat = plats[i % plats.length];
      const span = Math.max(24, plat.w - 100);
      let x = plat.x + 50 + ((i / Math.max(1, count)) + Math.random() * 0.18) * span;
      x = Math.min(arenaMaxX(), Math.max(arenaMinX(), x));
      if (Math.abs(x - hero.x) < 90) {
        x = Math.min(arenaMaxX(), Math.max(arenaMinX(), hero.x + (i % 2 === 0 ? 140 : -140)));
      }
      addBoss(x, plat.h);
      stageSpawned += 1;
    }
    waveCooldown = 55 + ((Math.random() * 35) | 0);
  }

  function beginStage(n, resetCoins) {
    stage = Math.max(1, n | 0);
    stageBusy = false;
    inShop = false;
    if (shopEl) shopEl.hidden = true;
    clearEnemies();
    if (resetCoins) {
      coinCount = 0;
      drawCoinCount(formatCoins(0));
      resetRunBuffs();
      grantStartingLoadout();
    }
    const mob = stageMobStats(stage);
    stageEnemyTotal = TEST_ACTIONS ? 0 : mob.count;
    stageSpawned = 0;
    stageTimeLeft = TEST_ACTIONS ? Infinity : stageDuration(stage);
    stageClock = performance.now();
    waveCooldown = 20;
    if (stageTimerEl) stageTimerEl.hidden = false;
    if (bagBtn) bagBtn.hidden = false;
    updateStageHud();
    if (!TEST_ACTIONS) spawnWave(waveSizeForStage(stage));
    showToast(TEST_ACTIONS ? "动作测试 · 无倒计时 · 无天兵" : `第 ${stage} 关 · 天兵×${mob.count}`, 1200);
  }

  function updateStageSystem() {
    if (!running || paused || hero.dead || stageBusy || inShop || gameOver) return;
    if (TEST_ACTIONS) {
      updateStageHud();
      return;
    }
    const now = performance.now();
    if (!stageClock) stageClock = now;
    const dt = Math.min(0.05, (now - stageClock) / 1000);
    stageClock = now;
    stageTimeLeft -= dt;

    const cleared =
      stageEnemyTotal > 0 &&
      stageSpawned >= stageEnemyTotal &&
      livingEnemyCount() === 0;

    if (cleared) {
      stageBusy = true;
      updateStageHud();
      showToast("清敌成功 · 进入宝阁商店", 1100);
      setTimeout(() => openShop(stage + 1), 700);
      return;
    }

    if (stageTimeLeft <= 0) {
      stageTimeLeft = 0;
      updateStageHud();
      stageBusy = true;
      clearEnemies();
      showToast("时间到 · 闯关失败", 1100);
      setTimeout(() => openGameOver("timeout"), 700);
      return;
    }

    updateStageHud();
    if (waveCooldown > 0) waveCooldown -= 1;
    else if (stageSpawned < stageEnemyTotal && livingEnemyCount() < Math.ceil(waveSizeForStage(stage) * 0.5)) {
      spawnWave(waveSizeForStage(stage));
    }
  }

  function clearTrack() {
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    trackWorld.innerHTML = "";
    nextX = 0;
    lastGapAt = -9999;
    lastBossAt = -9999;
    flatStreak = 0;
    runScroll.world = 0;
    viewFx.x = 0;
    viewFx.y = 0;
    trackWorld.style.transform = "translate3d(0,0,0)";
    runner.style.transform = "";
    [runBackArt, runMidArt, runFrontArt].forEach((el) => {
      if (el) el.style.transform = "translate3d(0,0,0)";
    });
  }

  function addPlatform(x, unitCount, h) {
    const units = Math.max(1, unitCount | 0);
    /* 步进 = 整宽 - 侧面重叠，下一块叠在上一块侧面之上 */
    const totalW = FLOOR_UNIT_W + Math.max(0, units - 1) * FLOOR_STEP;
    const surfaceH = h - SURFACE_NUDGE;
    const el = document.createElement("div");
    el.className = "plat";
    el.style.setProperty("--floor-unit-w", `${FLOOR_UNIT_W}px`);
    el.style.left = `${x}px`;
    el.style.width = `${totalW}px`;
    el.style.height = `${FLOOR_UNIT_H}px`;
    /* 贴图按实体顶对齐；碰撞面再低 60px 到跑道中线 */
    el.style.bottom = `${h - FLOOR_UNIT_H + floorTopPad}px`;
    /* 右边永远盖住左边（只按 x，不按高度） */
    el.style.zIndex = String(10 + Math.floor(x));

    const row = document.createElement("div");
    row.className = "plat__row";
    for (let i = 0; i < units; i++) {
      const tile = document.createElement("img");
      tile.className = "plat__tile";
      tile.src = floorImgUrl;
      tile.alt = "";
      tile.draggable = false;
      tile.style.left = `${i * FLOOR_STEP}px`;
      /* 段内同样：右侧单元压左侧 */
      tile.style.zIndex = String(i + 1);
      row.appendChild(tile);
    }
    el.appendChild(row);
    trackWorld.appendChild(el);
    const plat = { x, w: totalW, h: surfaceH, visualH: h, units, el };
    platforms.push(plat);
    return plat;
  }

  /** 下一段与上一段侧面重叠衔接（非整段并排） */
  function advanceNextX(plat) {
    nextX = plat.x + plat.units * FLOOR_STEP;
  }

  function addCoin(x, y, magnet) {
    const el = document.createElement("img");
    el.className = "pickup-coin";
    el.src = coinImgUrl;
    el.alt = "";
    el.draggable = false;
    const ix = (x + 0.5) | 0;
    const iy = (y + 0.5) | 0;
    el.style.transform = `translate3d(${ix}px, ${-iy}px, 0)`;
    trackWorld.appendChild(el);
    coins.push({ x, y, el, got: false, magnet: !!magnet });
  }

  function spawnCoinsOnPlat(plat) {
    if (plat.w < 160 || Math.random() < 0.28) return;
    const pad = 48;
    const span = Math.max(0, plat.w - pad * 2);
    if (span < MIN_COIN_GAP) return;
    const maxCount = Math.floor(span / MIN_COIN_GAP) + 1;
    const count = Math.max(1, Math.min(3, maxCount));
    const step = count === 1 ? 0 : Math.max(MIN_COIN_GAP, span / (count - 1));
    const start = plat.x + pad;
    const arc = Math.random() < 0.4;
    for (let i = 0; i < count; i++) {
      const cx = start + step * i;
      const lift = arc ? Math.sin((i / (count - 1 || 1)) * Math.PI) * 36 : 22;
      addCoin(cx, plat.h + 14 + lift);
    }
  }

  function syncBossEl(boss) {
    const x = (boss.x + 0.5) | 0;
    const y = (boss.y + 0.5) | 0;
    if (boss._sx !== x || boss._sy !== y) {
      boss._sx = x;
      boss._sy = y;
      boss.el.style.transform = `translate3d(${x}px, ${-y}px, 0)`;
    }
    const faceLeft = boss.facing < 0;
    if (boss._faceLeft !== faceLeft) {
      boss._faceLeft = faceLeft;
      boss.el.classList.toggle("is-facing-left", faceLeft);
    }
    const hurt = boss.hurtFrames > 0;
    if (boss._hurt !== hurt) {
      boss._hurt = hurt;
      boss.el.classList.toggle("is-hurt", hurt);
    }
    const air = !boss.onGround;
    if (boss._air !== air) {
      boss._air = air;
      boss.el.classList.toggle("is-air", air);
    }
  }

  function tryBossJump(boss) {
    if (boss.dead || boss.jumpsLeft <= 0 || (boss.jumpCd || 0) > 0) return false;
    boss.vy = JUMP_V;
    boss.jumpsLeft -= 1;
    boss.onGround = false;
    boss.jumpCd = BOSS_JUMP_COOLDOWN;
    return true;
  }

  /** 前方是否空洞（含脚边） */
  function bossGapDist(e, facing) {
    const half = e.w * 0.28;
    for (let d = 2; d <= 64; d += 2) {
      if (surfaceAt(e.x + facing * (half * 0.35 + d)) == null) return d;
    }
    return 0;
  }

  /** 两点之间水平路径上是否有空洞 */
  function pathHasGapBetween(x0, x1) {
    const dir = x1 >= x0 ? 1 : -1;
    const span = Math.abs(x1 - x0);
    for (let d = 4; d <= span; d += 6) {
      if (surfaceAt(x0 + dir * d) == null) return true;
    }
    return false;
  }

  /** 碰到 gap：立刻掉头并退回实心地面，锁定朝向（优先于追击主角） */
  function turnBossFromGap(e, useChase) {
    e.facing *= -1;
    for (let i = 0; i < 12; i++) {
      const nx = e.x + e.facing * 8;
      if (surfaceAt(nx) == null) break;
      e.x = nx;
    }
    e.targetX = e.x + e.facing * 220;
    e.vx = e.facing * (useChase ? BOSS_CHASE : BOSS_MOVE);
    e.gapLock = 70;
    e.think = 50;
  }

  function pickBossTargetX(boss) {
    const pad = 50;
    const nearby = platforms.filter(
      (p) => Math.abs(p.x + p.w * 0.5 - boss.x) < 520 && p.w > 120
    );
    const pool = nearby.length ? nearby : platforms;
    if (!pool.length) return boss.x;
    const plat = pool[(Math.random() * pool.length) | 0];
    const lo = Math.max(arenaMinX(), plat.x + pad);
    const hi = Math.min(arenaMaxX(), plat.x + plat.w - pad);
    if (hi <= lo) return Math.min(arenaMaxX(), Math.max(arenaMinX(), plat.x + plat.w * 0.5));
    return lo + Math.random() * (hi - lo);
  }

  function addBoss(x, groundY) {
    const y = groundY + ENEMY_Y_NUDGE;
    const mob = stageMobStats(stage);
    const maxHp = mob.hp;
    const wrap = document.createElement("div");
    wrap.className = "enemy boss";
    wrap.style.transform = `translate3d(${(x + 0.5) | 0}px, ${-((y + 0.5) | 0)}px, 0)`;
    wrap.style.zIndex = "8000";
    const img = document.createElement("img");
    img.className = "enemy__sprite";
    img.src = enemyImgUrl;
    img.alt = "天兵";
    img.draggable = false;
    const weapon = document.createElement("img");
    weapon.className = "enemy-weapon";
    weapon.src = enemyWeaponUrl;
    weapon.alt = "";
    weapon.draggable = false;
    const arc = document.createElement("div");
    arc.className = "enemy-weapon-arc";
    arc.setAttribute("aria-hidden", "true");
    const hold = document.createElement("div");
    hold.className = "enemy-weapon-hold";
    hold.appendChild(weapon);
    hold.appendChild(arc);
    const body = document.createElement("div");
    body.className = "enemy__body";
    const flash = document.createElement("img");
    flash.className = "enemy__flash";
    flash.src = ENEMY_FLASH_SRC;
    flash.alt = "";
    flash.draggable = false;
    body.appendChild(img);
    body.appendChild(flash);
    body.appendChild(hold);
    const hpBar = document.createElement("div");
    hpBar.className = "boss-hp is-thicker";
    hpBar.innerHTML = "<i></i>";
    wrap.appendChild(hpBar);
    wrap.appendChild(body);
    trackWorld.appendChild(wrap);
    const boss = {
      x,
      y,
      vy: 0,
      vx: 0,
      facing: Math.random() < 0.5 ? -1 : 1,
      w: 135,
      h: 229,
      el: wrap,
      spriteEl: img,
      flashEl: flash,
      weaponEl: weapon,
      weaponHoldEl: hold,
      arcEl: arc,
      thrustAt: 0,
      hpBar: hpBar.querySelector("i"),
      dead: false,
      hp: maxHp,
      maxHp,
      atk: mob.atk,
      hurtFrames: 0,
      flashLeft: 0,
      flashPlaying: false,
      think: 20 + ((Math.random() * 40) | 0),
      targetX: x,
      onGround: true,
      jumpsLeft: MAX_JUMPS,
      jumpCd: 20 + ((Math.random() * 30) | 0),
      gapLock: 0,
      _sx: (x + 0.5) | 0,
      _sy: (y + 0.5) | 0,
      _faceLeft: null,
      _hurt: null,
      _air: null,
    };
    enemies.push(boss);
    lastBossAt = x;
    renderBossHp(boss);
    syncBossEl(boss);
  }

  function renderBossHp(boss) {
    if (!boss.hpBar) return;
    const pct = Math.max(0, boss.hp / (boss.maxHp || 1));
    boss.hpBar.style.transform = `scaleX(${pct})`;
  }

  function placeGap(minRatio) {
    nextX += randomGap(minRatio);
    lastGapAt = nextX;
  }

  function pickNextHeight(lastVisualH) {
    let idx = HEIGHTS.indexOf(lastVisualH);
    if (idx < 0) {
      idx = 1;
      let best = Infinity;
      for (let i = 0; i < HEIGHTS.length; i++) {
        const d = Math.abs(HEIGHTS[i] - lastVisualH);
        if (d < best) {
          best = d;
          idx = i;
        }
      }
    }
    /* 平地过长则强制改高度（最长平地约为原先一半） */
    const forceChange = flatStreak >= 1;
    const roll = Math.random();
    let next = idx;
    if (!forceChange && roll < 0.18) {
      next = idx;
    } else if (roll < 0.5) {
      next = Math.min(HEIGHTS.length - 1, idx + 1);
    } else if (roll < 0.82) {
      next = Math.max(0, idx - 1);
    } else {
      const jump = Math.random() < 0.5 ? 2 : -2;
      next = Math.max(0, Math.min(HEIGHTS.length - 1, idx + jump));
    }
    if (forceChange && next === idx) {
      next = idx >= HEIGHTS.length - 1 ? idx - 1 : idx + 1;
    }
    return HEIGHTS[next];
  }

  function viewWidth() {
    return runway.clientWidth || 900;
  }

  function refreshArenaWidth() {
    arenaWidth = Math.max(640, viewWidth() * ARENA_SCREEN_RATIO);
  }

  function arenaMinX() {
    if (platforms.length) return platforms[0].x + 12;
    return 12;
  }

  function arenaMaxX() {
    return Math.max(arenaMinX() + 80, arenaWidth - ARENA_EDGE_PAD);
  }

  function resolveEnemySolids(actor, halfW, prevX) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead) continue;
      if (Math.abs((e.y || 0) - actor.y) > 56) continue;
      const eHalf = (e.w || 80) * 0.28;
      const bodyL = actor.x - halfW;
      const bodyR = actor.x + halfW;
      const eL = e.x - eHalf;
      const eR = e.x + eHalf;
      if (bodyR <= eL || bodyL >= eR) continue;
      const prevL = prevX - halfW;
      const prevR = prevX + halfW;
      if (prevR <= eL + 0.5 && bodyR > eL) {
        actor.x = eL - halfW;
        if (actor.vx > 0) actor.vx = 0;
      } else if (prevL >= eR - 0.5 && bodyL < eR) {
        actor.x = eR + eHalf;
        if (actor.vx < 0) actor.vx = 0;
      }
    }
  }

  function clampHeroToView(actor) {
    const viewW = viewWidth();
    const camX = window.SwordCamera ? SwordCamera.followX : runScroll.world;
    const pad = 12;
    const lo = Math.max(arenaMinX(), camX + pad);
    const hi = Math.min(arenaMaxX(), camX + viewW - pad);
    if (hi <= lo) return;
    if (actor.x < lo) {
      actor.x = lo;
      if (actor.vx < 0) actor.vx = 0;
    } else if (actor.x > hi) {
      actor.x = hi;
      if (actor.vx > 0) actor.vx = 0;
    }
  }

  function clampActorX(actor) {
    const lo = arenaMinX();
    const hi = arenaMaxX();
    if (actor.x < lo) {
      actor.x = lo;
      if (actor.vx < 0) actor.vx = 0;
    } else if (actor.x > hi) {
      actor.x = hi;
      if (actor.vx > 0) actor.vx = 0;
    }
  }

  function generateSegment() {
    if (nextX >= arenaWidth) return;
    if (FLAT_ARENA) {
      const h = HEIGHTS[2];
      const gapAt = arenaWidth * 0.52;
      const gapW = Math.max(72, Math.min(100, maxSafeGap() * 0.45));
      if (lastGapAt < 0 && nextX >= gapAt && nextX < arenaWidth - 220) {
        nextX += gapW;
        lastGapAt = nextX;
        return;
      }
      let units = 2;
      const remain = arenaWidth - nextX;
      if (remain < FLOOR_UNIT_W * 1.2) units = 1;
      const plat = addPlatform(nextX, units, h);
      spawnCoinsOnPlat(plat);
      advanceNextX(plat);
      return;
    }
    const roll = Math.random();
    const canOptionalGap =
      !FORCE_ZERO_GAP &&
      !TEST_ACTIONS &&
      nextX > 220 &&
      nextX < arenaWidth - 220 &&
      nextX - lastGapAt >= MIN_GAP_SPACING;
    if (canOptionalGap && roll < 0.22) {
      const gap = Math.min(randomGap(0.35), arenaWidth - nextX - 160);
      if (gap > 24) {
        nextX += gap;
        lastGapAt = nextX;
        flatStreak = 0;
      }
      return;
    }
    const lastVisual = platforms.length
      ? platforms[platforms.length - 1].visualH
      : HEIGHTS[2];
    const h = TEST_ACTIONS
      ? HEIGHTS[2]
      : platforms.length
        ? pickNextHeight(lastVisual)
        : HEIGHTS[2];
    /* 格斗场略宽一些，方便与 Boss 周旋 */
    let units = Math.random() < 0.55 ? 2 : Math.random() < 0.82 ? 1 : 3;
    /* 末段尽量接到场地右缘 */
    const remain = arenaWidth - nextX;
    if (remain < FLOOR_UNIT_W * 1.2) units = 1;
    const plat = addPlatform(nextX, units, h);
    if (platforms.length > 1 && h === lastVisual) flatStreak += 1;
    else flatStreak = 0;
    spawnCoinsOnPlat(plat);
    advanceNextX(plat);
  }

  /** 一次性铺满约 1.5 屏的有限场地，不再无限延伸 */
  function buildArena() {
    refreshArenaWidth();
    let guard = 0;
    while (nextX < arenaWidth && guard++ < 120) generateSegment();
    if (!platforms.length) {
      addPlatform(0, 3, HEIGHTS[2]);
    } else {
      const last = platforms[platforms.length - 1];
      const end = last.x + last.w;
      if (end < arenaWidth - 40) {
        addPlatform(Math.max(nextX, end - FLOOR_STEP), 2, last.visualH);
      }
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
   * 只能从上落下或站稳，禁止步行自动走上更高台阶。
   */
  function findLandingSurface(prevY, nextY, xLeft, xRight) {
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const overlap = Math.min(xRight, p.x + p.w) - Math.max(xLeft, p.x);
      if (overlap <= 0) continue;

      const top = p.h;
      /* 人明显低于该台面 → 立面，不能当地板 */
      if (prevY < top - MAX_WALK_STEP && nextY < top - MAX_WALK_STEP) continue;

      const stayOn = Math.abs(prevY - top) <= 6 && nextY <= top + 16;
      /* 下落落到台面即可（含跳高台）；步行上台仍由 resolveLedgeWalls 挡住 */
      const crossed =
        prevY >= top - LAND_TOL &&
        nextY <= top + 16 &&
        prevY >= nextY;
      if (!stayOn && !crossed) continue;

      const dist = Math.abs(top - prevY);
      if (dist < bestDist) {
        bestDist = dist;
        best = top;
      }
    }
    return best;
  }

  /** 贴地走进更高台阶时当墙挡住，必须跳上去 */
  function resolveLedgeWalls(actor, halfW, yNudge, prevX) {
    const feetY = actor.y - yNudge;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.h <= feetY + MAX_WALK_STEP) continue;

      const left = p.x;
      const right = p.x + p.w;
      const bodyL = actor.x - halfW;
      const bodyR = actor.x + halfW;
      if (bodyR <= left || bodyL >= right) continue;

      const prevL = prevX - halfW;
      const prevR = prevX + halfW;
      if (prevR <= left + 0.5 && bodyR > left) {
        actor.x = left - halfW;
        if (actor.vx > 0) actor.vx = 0;
      } else if (prevL >= right - 0.5 && bodyL < right) {
        actor.x = right + halfW;
        if (actor.vx < 0) actor.vx = 0;
      }
    }
  }

  function syncHeroEl() {
    const camX = window.SwordCamera ? SwordCamera.getX() : runScroll.world;
    const lookY = cameraLookY();
    const sx = ((hero.x - camX) + 0.5) | 0;
    const sy = ((hero.y - lookY) + 0.5) | 0;
    const visX = sx;
    const visY = sy;
    if (
      hero._sx !== visX ||
      hero._sy !== visY ||
      swordCombo.shakeAmp > 0
    ) {
      hero._sx = visX;
      hero._sy = visY;
      runner.style.transform = `translate3d(${visX}px, ${-visY}px, 0)`;
    }
    const faceLeft = hero.facing < 0;
    if (hero._faceLeft !== faceLeft) {
      hero._faceLeft = faceLeft;
      runner.classList.toggle("is-facing-left", faceLeft);
    }
    const moving =
      (Math.abs(hero.vx) > 0.15 || Math.abs(hero.moveDirY) > 0.001) &&
      hero.onGround &&
      !swordCombo.attacking;
    if (hero._moving !== moving) {
      hero._moving = moving;
      runner.classList.toggle("is-moving", moving);
    }
    syncComboStagePos();
  }

  function updateParallax() {
    /* 背景水平移动距离 = 人物/镜头世界位移的一半；远中近略做层次差 */
    const cam = runScroll.world;
    const place = (el, rate, depthY) => {
      if (!el) return;
      const x = ((-cam * rate) + 0.5) | 0;
      const y = ((-viewFx.y * depthY) * 2 + 0.5) | 0;
      if (el._px === x && el._py === y) return;
      el._px = x;
      el._py = y;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    place(runBackArt, 0.21, 0.18);
    place(runMidArt, 0.25, 0.45);
    place(runFrontArt, 0.29, 0.82);
  }

  function updateCamera() {
    const viewW = viewWidth();
    const now = performance.now();
    if (!hero._camTickAt) hero._camTickAt = now;
    const dtSec = Math.min(0.05, Math.max(0, (now - hero._camTickAt) / 1000));
    hero._camTickAt = now;

    if (window.SwordCamera) {
      const combo = window.SwordCombat;
      const comboHop = comboHopping();
      const comboLand = !!(combo && combo.landing && !comboHop);
      const normalJump = !hero.onGround && !comboHop;
      SwordCamera.tick(now, dtSec, {
        heroX: hero.x,
        groundY: normalJump ? jumpCamBase() : groundYAt(hero.x),
        hopY: comboHop ? combo.poseY || 0 : 0,
        lockGroundY: !!(combo && combo.currentFrame === "16") || normalJump,
        facing: hero.facing,
        H: (combo && combo.H) || 140,
        viewW,
        arenaW: arenaWidth,
        dashing: !!(combo && combo.dashing),
        hopping: comboHop,
        landing: comboLand && !normalJump,
        normalJump,
      });
      runScroll.world = SwordCamera.followX;
    } else {
      const maxCam = Math.max(0, arenaWidth - viewW);
      const focus = Math.min(maxCam, Math.max(0, hero.x - viewW * 0.38));
      runScroll.world += (focus - runScroll.world) * 0.48;
      if (runScroll.world < 0) runScroll.world = 0;
      if (runScroll.world > maxCam) runScroll.world = maxCam;
    }

    const maxCam = Math.max(0, arenaWidth - viewW);
    const maxCamSafe = Math.max(1, maxCam);
    const camT = runScroll.world / maxCamSafe;
    const span = Math.max(1, arenaMaxX() - arenaMinX());
    const heroT = Math.min(1, Math.max(0, (hero.x - arenaMinX()) / span));
    const targetX = camT * 0.35 + heroT * 0.65 - 0.5;
    const yBase = 110;
    const targetY =
      !hero.onGround && !comboHopping()
        ? 0
        : Math.min(12, Math.max(-8, (hero.y - yBase) * 0.12));
    viewFx.x += (targetX - viewFx.x) * 0.22;
    viewFx.y += (targetY - viewFx.y) * 0.12;

    const shake = window.SwordCamera ? SwordCamera.getShake() : { x: 0, y: 0 };
    const lookY = window.SwordCamera ? worldLookY() - shake.y : 0;
    const camX = ((window.SwordCamera ? SwordCamera.getX() : runScroll.world) + 0.5) | 0;
    const camY = (lookY + shake.y + 0.5) | 0;
    if (trackWorld._camX !== camX || trackWorld._camY !== camY) {
      trackWorld._camX = camX;
      trackWorld._camY = camY;
      trackWorld.style.transform = `translate3d(${-camX}px, ${camY}px, 0)`;
    }
    updateParallax();
  }

  function resetHeroOnTrack() {
    hero.vy = 0;
    hero.vx = 0;
    hero.onGround = true;
    hero.dead = false;
    hero.jumpsLeft = MAX_JUMPS;
    hero.jumpLock = 0;
    hero.jumpBufferedUntil = 0;
    hero.coyoteUntil = 0;
    hero.airGroundY = null;
    hero.swordAnimFrames = 0;
    hero.fanAnimFrames = 0;
    hero.swordReadyAt = 0;
    hero.fanReadyAt = 0;
    hero.hurtFrames = 0;
    hero.facing = 1;
    endSwordComboAttack();
    hideComboGif();
    if (window.SwordCamera) SwordCamera.reset(hero.x, hero.y, viewWidth());
    resetSwordComboChain();
    swordCombo.lastAttackAt = 0;
    swordCombo.hitStopUntil = 0;
    swordCombo.shakeAmp = 0;
    swordCombo.shakeUntil = 0;
    runner.classList.remove(
      "is-air",
      "is-attacking",
      "is-attacking-sword",
      "is-attacking-fan",
      "is-thrusting",
      "is-hurt",
      "is-moving"
    );
    if (!platforms.length) {
      hero.x = 180;
      hero.y = 110;
    } else {
      const rescue =
        platforms.find((p) => p.x + p.w > hero.x - 40) || platforms[0];
      hero.x = rescue.x + Math.min(120, rescue.w * 0.35);
      hero.y = rescue.h;
    }
    updateCamera();
    syncHeroEl();
    stageClock = performance.now();
  }

  function setPaused(on) {
    if (!running || gameOver) return;
    paused = !!on;
    runway.classList.toggle("is-paused", paused);
    if (pauseOverlay) pauseOverlay.hidden = !paused;
    if (!paused) stageClock = performance.now();
  }

  function togglePause() {
    if (!running || inShop || gameOver) return;
    setPaused(!paused);
  }

  function tryJump() {
    if (!running || paused || hero.dead) return;
    const now = performance.now();
    const grounded = hero.onGround || now < (hero.coyoteUntil || 0);
    if (selected === "blue" && window.SwordCombat && SwordCombat.isBusy() && grounded) {
      hero.jumpBufferedUntil = now + 140;
      return;
    }
    if (grounded) hero.jumpsLeft = MAX_JUMPS;
    if (hero.jumpsLeft <= 0) {
      hero.jumpBufferedUntil = now + 140;
      return;
    }
    if (hero.airGroundY == null) {
      const s = surfaceAt(hero.x);
      hero.airGroundY = s != null ? s : hero.y;
    }
    hero.vy = JUMP_V;
    hero.jumpsLeft -= 1;
    hero.onGround = false;
    hero.jumpLock = 16;
    hero.coyoteUntil = 0;
    hero.jumpBufferedUntil = 0;
    runner.classList.add("is-air");
    sfxJump();
  }

  function playWeaponAnim(kind) {
    const cls = kind === "fan" ? "is-attacking-fan" : "is-attacking-sword";
    if (kind === "fan") hero.fanAnimFrames = ATTACK_FRAMES;
    else hero.swordAnimFrames = kind === "thrust" ? THRUST_FRAMES : ATTACK_FRAMES;
    runner.classList.remove(cls, "is-thrusting");
    void runner.offsetWidth;
    runner.classList.add("is-attacking", cls);
    if (kind === "thrust") {
      runner.classList.add("is-thrusting");
      sfxEnemySlash();
    } else if (kind === "sword") sfxWhoosh();
    else sfxAttack();
  }

  function clearSwordComboClasses() {
    if (!runner) return;
    runner.classList.remove(
      "combo-a1",
      "combo-a2",
      "combo-a3",
      "combo-a4",
      "combo-a5",
      "combo-a6",
      "combo-charging",
      "combo-body-mode",
      "is-thrusting"
    );
    runner.style.removeProperty("--combo-dur");
    runner.style.removeProperty("--slash-scale");
    runner.style.removeProperty("--combo-lean");
  }

  function resetSwordComboChain() {
    swordCombo.nextStep = 0;
    swordCombo.buffered = false;
  }

  function hideSlashVfx() {
    if (!slashVfxEl) return;
    slashVfxEl.hidden = true;
    slashVfxEl.classList.remove("is-show");
    slashVfxEl.style.backgroundImage = "";
    swordCombo.slashPoseKey = "";
  }

  function resolveSlashCfg(poseIdx, step) {
    if (step && step.slashOverride) return step.slashOverride;
    const base =
      (SWORD_COMBO.poseSlash && SWORD_COMBO.poseSlash[poseIdx]) || null;
    if (!base) return null;
    if (!step || !step.slashBoost) return base;
    return {
      frame: base.frame,
      rot: step.slashBoost.rot != null ? step.slashBoost.rot : base.rot,
      scale: (base.scale || 1) * (step.slashBoost.scale || 1),
      ox: (base.ox || 0) + (step.slashBoost.ox || 0),
      oy: (base.oy || 0) + (step.slashBoost.oy || 0),
    };
  }

  function setArmPoseFrame(frameIndex) {
    if (!armWeaponEl || !comboArt.poseFrames.length) return;
    const idx = Math.max(0, Math.min(comboArt.poseFrames.length - 1, frameIndex | 0));
    const pivot = (SWORD_COMBO.posePivots && SWORD_COMBO.posePivots[idx]) || { x: 0.5, y: 0.5 };
    const ox = (pivot.x * 100).toFixed(2);
    const oy = (pivot.y * 100).toFixed(2);
    const gx = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.x) || 0;
    const gy = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.y) || 0;
    armWeaponEl.src = comboArt.poseFrames[idx];
    armWeaponEl.style.transformOrigin = `${ox}% ${oy}%`;
    /* 握点对准 WeaponSocket，再整体右下偏移 */
    armWeaponEl.style.transform = `translate(calc(-${ox}% + ${gx}px), calc(-${oy}% + ${gy}px))`;
    swordCombo.lastPoseFrame = idx;
  }

  function setArmSocketPose(localX, localY, leanPx) {
    if (!armSocketEl) return;
    const base = ANCHOR_BASE.RightHand || { leftPct: 100, bottomPct: 42, ox: -18, oy: -13 };
    const sx = (base.ox || 0) + ((SWORD_COMBO.socketBase && SWORD_COMBO.socketBase.x) || 0) + (localX || 0);
    const sy = (base.oy || 0) + ((SWORD_COMBO.socketBase && SWORD_COMBO.socketBase.y) || 0) + (localY || 0);
    armSocketEl.style.left = `${base.leftPct}%`;
    armSocketEl.style.bottom = `${base.bottomPct}%`;
    armSocketEl.style.transform = `translate3d(${sx}px, ${-sy}px, 0)`;
    if (runner) {
      runner.style.setProperty("--combo-lean", `${leanPx || 0}px`);
    }
  }

  /** 弧光贴合当前姿态剑尖（zuhefangfa：内侧对准剑尖，剑压在弧上） */
  function showSlashVfx(poseIdx, step) {
    if (!SWORD_COMBO.showSlashVfx) {
      hideSlashVfx();
      return;
    }
    if (!slashVfxEl || !comboArt.slashFrames.length) return;
    const cfg = resolveSlashCfg(poseIdx, step);
    if (!cfg) {
      hideSlashVfx();
      return;
    }
    const fi = Math.max(0, Math.min(comboArt.slashFrames.length - 1, cfg.frame | 0));
    const tip = (SWORD_COMBO.poseTips && SWORD_COMBO.poseTips[poseIdx]) || { x: 0.85, y: 0.45 };
    const pivot = (SWORD_COMBO.posePivots && SWORD_COMBO.posePivots[poseIdx]) || { x: 0.5, y: 0.5 };
    const gx = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.x) || 0;
    const gy = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.y) || 0;
    const dw = (armWeaponEl && armWeaponEl.offsetWidth) || 110;
    const dh = (armWeaponEl && armWeaponEl.offsetHeight) || 110;
    const tipX = (tip.x - pivot.x) * dw + gx + (cfg.ox || 0);
    const tipY = (tip.y - pivot.y) * dh + gy + (cfg.oy || 0);
    const key = `${poseIdx}:${fi}:${tipX.toFixed(1)}:${tipY.toFixed(1)}:${cfg.rot || 0}:${cfg.scale || 1}`;
    const durMs = Math.max(
      160,
      ((step && step.activeEndMs) || 160) - ((step && step.activeStartMs) || 0) + 40
    );

    slashVfxEl.style.setProperty("--svfx-x", `${tipX.toFixed(1)}px`);
    slashVfxEl.style.setProperty("--svfx-y", `${tipY.toFixed(1)}px`);
    slashVfxEl.style.setProperty("--svfx-rot", `${cfg.rot || 0}deg`);
    slashVfxEl.style.setProperty("--svfx-scale", String(cfg.scale || 1));
    slashVfxEl.style.setProperty("--svfx-dur", `${durMs}ms`);
    slashVfxEl.style.backgroundImage = `url("${comboArt.slashFrames[fi]}")`;
    slashVfxEl.hidden = false;
    if (swordCombo.slashPoseKey !== key) {
      slashVfxEl.classList.remove("is-show");
      void slashVfxEl.offsetWidth;
      slashVfxEl.classList.add("is-show");
      swordCombo.slashPoseKey = key;
    }
  }

  function setBlueBodyFrame(frameKey) {
    if (!runnerSprite || !comboArt.bodyFrames) return;
    const url =
      frameKey == null || frameKey === "idle"
        ? comboArt.bodyIdle
        : comboArt.bodyFrames[frameKey];
    if (url) runnerSprite.src = url;
  }

  function setComboPoseMode(on) {
    if (!runner) return;
    runner.classList.toggle("combo-pose-mode", !!on);
    runner.classList.toggle("combo-body-mode", !!(on && SWORD_COMBO.useBodyFrames));
    if (SWORD_COMBO.useBodyFrames) {
      /* 全身帧已含剑与弧光，隐藏手臂层与武器架 */
      if (armSocketEl) armSocketEl.hidden = true;
      hideSlashVfx();
      if (weaponRack) {
        weaponRack.classList.toggle("is-combo-hidden", !!on);
        if (on) weaponRack.hidden = true;
        else if (selected === "blue") weaponRack.hidden = true;
      }
      if (!on) setBlueBodyFrame("idle");
      return;
    }
    if (armSocketEl) armSocketEl.hidden = !on;
    if (weaponRack) {
      weaponRack.classList.toggle("is-combo-hidden", !!on);
    }
    if (!on) {
      hideSlashVfx();
      if (armSocketEl) armSocketEl.hidden = true;
    }
  }

  function endSwordComboAttack() {
    swordCombo.attacking = false;
    swordCombo.stepIndex = -1;
    swordCombo.stepCfg = null;
    swordCombo.hitIds = null;
    swordCombo.nudgeX = 0;
    swordCombo.slashShown = false;
    hero.swordAnimFrames = 0;
    if (comboGif.playing) hideComboGif();
    else if (!comboGif.done) hideComboGif();
    clearSwordComboClasses();
    setComboPoseMode(false);
    if (runner) {
      runner.classList.remove(
        "is-attacking",
        "is-attacking-sword",
        "is-thrusting",
        "combo-body-mode"
      );
      runner.style.removeProperty("--combo-lean");
    }
  }

  function comboStepDuration(step) {
    const spd = Math.max(0.35, SWORD_COMBO.attackSpeedMul || 1);
    return Math.max(80, (step.durationMs || 280) / spd);
  }

  function easeOutCubic(t) {
    const u = 1 - Math.min(1, Math.max(0, t));
    return 1 - u * u * u;
  }

  function updateComboPoseVisual() {
    const step = swordCombo.stepCfg;
    if (!step || !swordCombo.attacking) return;
    const dur = comboStepDuration(step);
    const charge = step.chargeMs || 0;
    let t = 0;
    if (swordCombo.attackElapsed <= charge) {
      t = 0;
      runner.classList.add("combo-charging");
    } else {
      runner.classList.remove("combo-charging");
      t = easeOutCubic((swordCombo.attackElapsed - charge) / Math.max(1, dur - charge));
    }

    if (SWORD_COMBO.useBodyFrames) {
      const frames = step.bodyFrames || [];
      if (frames.length) {
        const rawT =
          swordCombo.attackElapsed <= charge
            ? 0
            : (swordCombo.attackElapsed - charge) / Math.max(1, dur - charge);
        const idx =
          frames.length === 1
            ? 0
            : Math.min(frames.length - 1, Math.floor(Math.min(0.999, Math.max(0, rawT)) * frames.length));
        setBlueBodyFrame(frames[idx]);
      }
      if (runner) {
        runner.style.setProperty("--combo-lean", `${(step.lean || 0) * t}px`);
      }
      return;
    }

    const fromPose =
      step.poseFrom != null ? step.poseFrom : swordCombo.lastPoseFrame | 0;
    const toPose = step.poseTo != null ? step.poseTo : step.poseFrame || 0;
    const poseIdx = t < 0.3 ? fromPose : toPose;
    setArmPoseFrame(poseIdx);

    const from = step.socketFrom || { x: 0, y: 0 };
    const to = step.socketTo || { x: 0, y: 0 };
    const lx = from.x + (to.x - from.x) * t;
    const ly = from.y + (to.y - from.y) * t;
    const lean = (step.lean || 0) * t;
    setArmSocketPose(lx, ly, lean);

    const activeAt = charge + (step.activeStartMs || 0);
    if (swordCombo.attackElapsed >= activeAt) {
      const slashCfg = resolveSlashCfg(poseIdx, step);
      if (slashCfg) {
        swordCombo.slashShown = true;
        showSlashVfx(poseIdx, step);
      } else {
        hideSlashVfx();
      }
    } else {
      hideSlashVfx();
    }
  }

  function beginSwordComboStep(stepIndex) {
    const steps = SWORD_COMBO.steps;
    if (!steps || !steps.length) return false;
    const idx = ((stepIndex % steps.length) + steps.length) % steps.length;
    const step = steps[idx];
    const now = performance.now();
    const dur = comboStepDuration(step);

    swordCombo.attacking = true;
    swordCombo.stepIndex = idx;
    swordCombo.stepCfg = step;
    swordCombo.attackStartedAt = now;
    swordCombo.attackElapsed = 0;
    swordCombo.lastTickAt = now;
    swordCombo.lastAttackAt = now;
    swordCombo.buffered = false;
    swordCombo.hitIds = new Set();
    swordCombo.nudgeX = step.bodyNudgePx || 0;
    swordCombo.slashShown = false;
    swordCombo.nextStep = (idx + 1) % steps.length;

    clearSwordComboClasses();
    runner.classList.add("is-attacking", "is-attacking-sword", `combo-${step.id}`);
    runner.style.setProperty("--slash-scale", "1");
    runner.style.setProperty("--combo-dur", `${dur}ms`);

    const frames = Math.max(8, Math.round(dur / 16.67));
    hero.swordAnimFrames = frames;
    hero.fanAnimFrames = 0;

    if (comboArt.ready) {
      setComboPoseMode(true);
      if (SWORD_COMBO.useBodyFrames) {
        const bf = step.bodyFrames && step.bodyFrames[0];
        if (bf != null) setBlueBodyFrame(bf);
      } else {
        const fromPose =
          step.poseFrom != null ? step.poseFrom : swordCombo.lastPoseFrame | 0;
        setArmPoseFrame(fromPose);
        const sock = step.socketFrom || { x: 0, y: 0 };
        setArmSocketPose(sock.x, sock.y, 0);
      }
    }

    if (step.motion === "thrust") {
      runner.classList.add("is-thrusting");
      sfxEnemySlash();
    } else if (step.isCrit) {
      sfxWhoosh();
      playTone({ freq: 180, dur: 0.08, type: "square", vol: 0.05, slide: 90 });
    } else {
      sfxWhoosh();
    }

    if (step.chargeMs > 0) runner.classList.add("combo-charging");

    const nudge = (step.bodyNudgePx || 0) * hero.facing;
    if (nudge) {
      hero.x += nudge;
      clampActorX(hero);
    }

    updateComboPoseVisual();
    return true;
  }

  function requestSwordCombo() {
    if (!running || paused || hero.dead || inShop) return false;
    if (selected === "blue" && window.SwordCombat && SwordCombat.ready) return false;
    const now = performance.now();

    if (swordCombo.attacking) {
      const step = swordCombo.stepCfg;
      const dur = step ? comboStepDuration(step) : 280;
      const remain = dur - swordCombo.attackElapsed;
      if (remain <= (SWORD_COMBO.bufferWindowMs || 160) || swordCombo.attackElapsed >= dur * 0.45) {
        swordCombo.buffered = true;
      }
      return true;
    }

    if (swordCombo.lastAttackAt && now - swordCombo.lastAttackAt > SWORD_COMBO.resetMs) {
      resetSwordComboChain();
    }

    return beginSwordComboStep(swordCombo.nextStep);
  }

  function applyComboHitStop(ms) {
    if (!ms || ms <= 0) return;
    const now = performance.now();
    swordCombo.hitStopUntil = Math.max(swordCombo.hitStopUntil, now + ms);
  }

  function triggerComboShake(px, ms) {
    if (!px || px <= 0) return;
    swordCombo.shakeAmp = px;
    swordCombo.shakeUntil = performance.now() + (ms || 120);
  }

  function resolveSwordComboHits() {
    const step = swordCombo.stepCfg;
    if (!step || !swordCombo.hitIds) return;
    const elapsed = swordCombo.attackElapsed;
    const charge = step.chargeMs || 0;
    if (elapsed >= charge) runner.classList.remove("combo-charging");
    if (elapsed < charge + (step.activeStartMs || 0)) return;
    if (elapsed > charge + (step.activeEndMs || step.durationMs)) return;

    const heroW = runner.offsetWidth || 90;
    const { ox, oy } = attackOrigin(heroW);
    const reach = swordReach() * (step.reachMul || 1);
    const hits = enemiesInArc(ox, oy, hero.facing, reach, step.arc || SWORD_SLASH_ARC);
    if (!hits.length) return;

    let landed = false;
    const dmgBase = playerAtk() * (step.damageMul || 1) * (SWORD_COMBO.damageMul || 1);
    const dmg = step.isCrit
      ? dmgBase * (SWORD_COMBO.critDamageMul || 1)
      : dmgBase;

    for (let i = 0; i < hits.length; i++) {
      const e = hits[i];
      if (!e || e.dead) continue;
      const id = e.el || e;
      if (swordCombo.hitIds.has(id)) continue;
      swordCombo.hitIds.add(id);
      hurtBoss(e, dmg, { knockback: step.knockback || 2.4, facing: hero.facing });
      landed = true;
    }

    if (landed) {
      applyComboHitStop(step.hitStopMs || 30);
      if (step.shakePx) triggerComboShake(step.shakePx, step.isCrit ? 140 : 90);
    }
  }

  function updateSwordCombo(now) {
    if (window.SwordCombat && SwordCombat.ready) return;
    if (selected !== "blue") return;
    if (comboGif.playing || comboGif.current || comboGif.done) return;

    if (swordCombo.shakeUntil && now >= swordCombo.shakeUntil) {
      swordCombo.shakeAmp = 0;
      swordCombo.shakeUntil = 0;
    }

    if (!swordCombo.attacking) {
      if (swordCombo.lastAttackAt && now - swordCombo.lastAttackAt > SWORD_COMBO.resetMs) {
        resetSwordComboChain();
      }
      return;
    }

    const inHitStop = now < swordCombo.hitStopUntil;
    if (!swordCombo.lastTickAt) swordCombo.lastTickAt = now;
    if (!inHitStop) {
      swordCombo.attackElapsed += now - swordCombo.lastTickAt;
    }
    swordCombo.lastTickAt = now;

    const step = swordCombo.stepCfg;
    const dur = step ? comboStepDuration(step) : 280;

    if (!inHitStop) {
      updateComboPoseVisual();
      resolveSwordComboHits();
    }

    if (swordCombo.attackElapsed >= dur) {
      const buffered = swordCombo.buffered;
      const finishedIdx = swordCombo.stepIndex;
      if (step && step.poseTo != null) swordCombo.lastPoseFrame = step.poseTo;
      swordCombo.lastAttackAt = now;
      if (buffered) {
        swordCombo.attacking = false;
        swordCombo.stepCfg = null;
        swordCombo.hitIds = null;
        swordCombo.slashShown = false;
        hideSlashVfx();
        if (finishedIdx >= SWORD_COMBO.steps.length - 1) resetSwordComboChain();
        beginSwordComboStep(swordCombo.nextStep);
      } else {
        endSwordComboAttack();
        if (finishedIdx >= SWORD_COMBO.steps.length - 1) resetSwordComboChain();
      }
    }
  }

  function tickWeaponAnims() {
    if (selected === "blue" && swordCombo.attacking) {
      return;
    }
    if (hero.swordAnimFrames > 0) {
      hero.swordAnimFrames -= 1;
      if (hero.swordAnimFrames <= 0) {
        runner.classList.remove("is-attacking-sword", "is-thrusting");
      }
    }
    if (hero.fanAnimFrames > 0) {
      hero.fanAnimFrames -= 1;
      if (hero.fanAnimFrames <= 0) runner.classList.remove("is-attacking-fan");
    }
    if (hero.swordAnimFrames <= 0 && hero.fanAnimFrames <= 0) {
      runner.classList.remove("is-attacking");
    }
  }

  /** 点击攻击：吕洞宾六段剑连击；钟离权扇子纵向弧 */
  function tryPlayerAttack() {
    if (!running || paused || hero.dead || inShop) return false;

    if (selected === "blue") {
      return requestSwordCombo();
    }

    if (hero.swordAnimFrames > 0 || hero.fanAnimFrames > 0) return false;

    const heroW = runner.offsetWidth || 90;
    const { ox, oy } = attackOrigin(heroW);
    const hits = enemiesInArc(ox, oy, hero.facing, fanReach(), FAN_VERT_ARC);
    for (let i = 0; i < hits.length; i++) hurtBoss(hits[i], playerAtk(), { knockback: 2.2, facing: hero.facing });
    playWeaponAnim("fan");
    return true;
  }

  function loseLifeAndRespawn(delay = 450) {
    if (gameOver || hero.dead) return;
    hero.dead = true;
    heroLives = Math.max(0, heroLives - 1);
    renderLives();
    flashPortraitOnLifeLost();
    sfxLifeLost();
    if (heroLives <= 0) {
      /* 立刻弹出全屏结算页，不用底部 toast */
      openGameOver("lives");
      return;
    }
    showToast(`剩余命数 x${heroLives}`, 900);
    setTimeout(() => {
      if (gameOver) return;
      hero.hp = MAX_HP;
      renderHp();
      resetHeroOnTrack();
    }, delay);
  }

  /** 已关闭自动攻击：保留空函数以免旧调用报错 */
  function tryAutoAttacks() {
    return;
  }

  function takeDamage(amount) {
    if (hero.hurtFrames > 0 || hero.dead) return;
    hero.hp = Math.max(0, hero.hp - amount);
    hero.hurtFrames = HURT_IFRAMES;
    runner.classList.add("is-hurt");
    renderHp();
    sfxHit();
    if (hero.hp <= 0) loseLifeAndRespawn(450);
  }

  function defeatBoss(boss) {
    if (boss.dead) return;
    boss.dead = true;
    boss.el.classList.add("is-dead");
    dropCoinsFromBoss(boss);
    sfxHit();
    sfxCoin();
    setTimeout(() => {
      if (boss.el.isConnected) boss.el.remove();
    }, 360);
  }

  const HIT_FLASH_ON_MS = 140;
  const HIT_FLASH_GAP_MS = 50;

  function setEnemyFlashSprite(boss, on) {
    if (!boss || !boss.el) return;
    boss.el.classList.toggle("is-hit-flash", !!on);
  }

  function playNextEnemyFlash(boss) {
    const el = boss && boss.el;
    if (!el || !el.isConnected || (boss.flashLeft || 0) <= 0) {
      if (boss) {
        boss.flashPlaying = false;
        boss.flashLeft = 0;
        setEnemyFlashSprite(boss, false);
      }
      return;
    }
    boss.flashPlaying = true;
    boss.flashLeft -= 1;
    setEnemyFlashSprite(boss, false);
    void el.offsetWidth;
    setEnemyFlashSprite(boss, true);
    if (boss._flashTimer) clearTimeout(boss._flashTimer);
    boss._flashTimer = setTimeout(() => {
      setEnemyFlashSprite(boss, false);
      boss._flashTimer = setTimeout(() => playNextEnemyFlash(boss), HIT_FLASH_GAP_MS);
    }, HIT_FLASH_ON_MS);
  }

  function flashEnemyHit(boss) {
    if (!boss || !boss.el) return;
    boss.flashLeft = (boss.flashLeft || 0) + 1;
    if (!boss.flashPlaying) playNextEnemyFlash(boss);
  }

  function cancelEnemyThrust(boss) {
    if (!boss) return;
    if (boss._thrustClear) {
      clearTimeout(boss._thrustClear);
      boss._thrustClear = 0;
    }
    boss.thrustAt = 0;
    if (boss.el) boss.el.classList.remove("is-thrusting");
    if (boss.weaponHoldEl) boss.weaponHoldEl.classList.remove("is-thrusting");
  }

  function hurtBoss(boss, amount, opts) {
    if (boss.dead) return;
    const knock = opts && opts.knockback != null ? opts.knockback : 1.2;
    const pushDir = (opts && opts.facing != null ? opts.facing : hero.facing || 1) < 0 ? -1 : 1;
    boss.hp = Math.max(0, boss.hp - amount);
    boss.hurtFrames = Math.max(BOSS_HURT_FRAMES, 28 + ((knock * 4) | 0));
    boss.stunnedUntil = performance.now() + 480;
    boss.hitDir = pushDir;
    boss.vx = pushDir * (5.2 + knock * 1.4);
    boss.vy = 0;
    boss.facing = -pushDir;
    boss.gapLock = 0;
    const surface = surfaceAt(boss.x);
    if (surface != null) {
      boss.y = surface + ENEMY_Y_NUDGE;
      boss.onGround = true;
    }
    cancelEnemyThrust(boss);
    flashEnemyHit(boss);
    sfxHit();
    renderBossHp(boss);
    if (boss.hp <= 0) defeatBoss(boss);
  }

  function applyActorPhysics(actor, halfW, yNudge = 0, opts) {
    const prevY = actor.y;
    const prevX = actor.x;
    const wasGrounded = actor.onGround;
    actor.vy -= GRAVITY;
    actor.y += actor.vy;
    actor.x += actor.vx;
    clampActorX(actor);

    /* 人物贴地走、Y 跟台面；台阶墙只留给敌人，否则走下一级就回不去左边 */
    if (wasGrounded && actor.vy <= 0 && !(opts && opts.skipLedges)) {
      resolveLedgeWalls(actor, halfW, yNudge, prevX);
    }

    const feetLeft = actor.x - halfW;
    const feetRight = actor.x + halfW;
    if (actor.jumpLock > 0) actor.jumpLock -= 1;
    actor.onGround = false;
    if (actor.vy <= 0 && !(actor.jumpLock > 0)) {
      const surface = findLandingSurface(
        prevY - yNudge,
        actor.y - yNudge,
        feetLeft,
        feetRight
      );
      if (surface != null) {
        actor.y = surface + yNudge;
        actor.vy = 0;
        actor.onGround = true;
      }
    }
  }

  function updateBosses() {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;

      const dxHero = hero.x - e.x;
      const dyHero = hero.y - e.y;
      const distX = Math.abs(dxHero);
      const aggro =
        !hero.dead &&
        running &&
        !paused &&
        !inShop &&
        distX < BOSS_AGGRO_X &&
        Math.abs(dyHero) < BOSS_AGGRO_Y;

      if (e.gapLock > 0) e.gapLock -= 1;
      if (e.jumpCd > 0) e.jumpCd -= 1;

      const chaseDir = dxHero < 0 ? -1 : 1;
      const gapAheadFace = e.onGround ? bossGapDist(e, e.facing) : 0;
      const gapTowardHero =
        e.onGround && aggro ? bossGapDist(e, chaseDir) : 0;
      const heroAcrossGap =
        aggro && pathHasGapBetween(e.x, hero.x);

      if (e.hurtFrames > 0 || performance.now() < (e.stunnedUntil || 0)) {
        if (e.hurtFrames > 0) e.hurtFrames -= 1;
        if (e.hitDir) e.vx = e.hitDir * Math.max(0, Math.abs(e.vx)) * 0.9;
        else e.vx *= 0.88;
        if (Math.abs(e.vx) < 0.12) e.vx = 0;
        applyActorPhysics(e, e.w * 0.28, ENEMY_Y_NUDGE);
        if (e.onGround) {
          e.jumpsLeft = MAX_JUMPS;
          const planted = surfaceAt(e.x);
          if (planted != null) {
            e.y = planted + ENEMY_Y_NUDGE;
            e.vy = 0;
          }
        }
        syncBossEl(e);
        continue;
      } else if (e.gapLock > 0) {
        /* 已因 gap 掉头：持续回撤，追击指令让路 */
        e.vx = e.facing * BOSS_CHASE;
        e.targetX = e.x + e.facing * 220;
      } else if (
        e.onGround &&
        ((gapAheadFace > 0 && gapAheadFace <= 56) ||
          (gapTowardHero > 0 && gapTowardHero <= 72) ||
          heroAcrossGap)
      ) {
        /* 最高优先：前方/追击方向有洞 → 掉头，不靠近主角 */
        if (gapAheadFace > 0 && gapAheadFace <= 56) {
          turnBossFromGap(e, true);
        } else if (e.facing === chaseDir) {
          turnBossFromGap(e, true);
        } else {
          e.vx = e.facing * BOSS_CHASE;
          e.targetX = e.x + e.facing * 220;
          e.gapLock = Math.max(e.gapLock, 40);
        }
      } else if (aggro) {
        e.facing = chaseDir;
        e.think = 6;
        const needClimb = hero.y > e.y + 8;
        if (distX > BOSS_ATTACK_GAP || needClimb) {
          e.targetX = hero.x;
          e.vx = e.facing * BOSS_CHASE;
        } else {
          e.targetX = e.x;
          e.vx = 0;
        }
      } else {
        e.think -= 1;
        if (e.think <= 0) {
          const roll = Math.random();
          if (roll < 0.28) {
            e.vx = 0;
            e.think = 25 + ((Math.random() * 35) | 0);
          } else {
            e.targetX = pickBossTargetX(e);
            e.think = 45 + ((Math.random() * 55) | 0);
          }
        }
        const dx = e.targetX - e.x;
        if (Math.abs(dx) > 8) {
          e.facing = dx < 0 ? -1 : 1;
          e.vx = e.facing * BOSS_MOVE;
        } else {
          e.vx = 0;
        }
      }

      /* 前方更高台阶：跳上去（gap 已在上方优先处理） */
      if (e.onGround && e.hurtFrames <= 0 && e.gapLock <= 0) {
        const here = surfaceAt(e.x);
        let rise = 0;
        if (here != null && bossGapDist(e, e.facing) <= 0) {
          for (let d = 6; d <= 72; d += 6) {
            const next = surfaceAt(e.x + e.facing * d);
            if (next == null) break;
            if (next > here + MAX_WALK_STEP) rise = Math.max(rise, next - here);
          }
          for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (p.h <= here + MAX_WALK_STEP) continue;
            if (e.facing > 0) {
              const edge = p.x;
              if (edge >= e.x - 2 && edge <= e.x + 76) {
                rise = Math.max(rise, p.h - here);
              }
            } else {
              const edge = p.x + p.w;
              if (edge <= e.x + 2 && edge >= e.x - 76) {
                rise = Math.max(rise, p.h - here);
              }
            }
          }
          if (rise > 0) {
            tryBossJump(e);
            if (Math.abs(e.vx) < 0.4) e.vx = e.facing * BOSS_MOVE;
          }
        }
      }

      applyActorPhysics(e, e.w * 0.28, ENEMY_Y_NUDGE);
      if (e.onGround) e.jumpsLeft = MAX_JUMPS;

      /* 贴地撞上更高立面 → 跳；脚前空洞 → gap 优先掉头 */
      if (e.onGround && e.hurtFrames <= 0) {
        const here = surfaceAt(e.x);
        const nose = e.x + e.facing * (e.w * 0.3 + 4);
        const next = surfaceAt(nose);
        if (here != null && next != null && next > here + MAX_WALK_STEP) {
          tryBossJump(e);
          e.vx = e.facing * BOSS_CHASE;
        } else if (here != null && (next == null || bossGapDist(e, e.facing) > 0)) {
          turnBossFromGap(e, true);
        }
      }

      if (e.y < -120) {
        const rescue = platforms.find((p) => p.x + p.w > e.x) || platforms[platforms.length - 1];
        if (rescue) {
          e.x = rescue.x + rescue.w * 0.5;
          e.y = rescue.h + ENEMY_Y_NUDGE;
          e.vy = 0;
        }
      }

      syncBossEl(e);
    }
  }

  const ENEMY_THRUST_MS = 200;

  function weaponOverlapsHero(enemy) {
    const weapon = enemy.weaponEl;
    if (!weapon || !runner) return false;
    const wr = weapon.getBoundingClientRect();
    const hr = runner.getBoundingClientRect();
    if (wr.width < 1 || wr.height < 1) return false;
    return (
      wr.right > hr.left &&
      wr.left < hr.right &&
      wr.bottom > hr.top &&
      wr.top < hr.bottom
    );
  }

  function weaponTipHitsHero(enemy) {
    const weapon = enemy.weaponEl;
    if (!weapon || !runner) return false;
    const wr = weapon.getBoundingClientRect();
    const hr = runner.getBoundingClientRect();
    if (wr.width < 1 || wr.height < 1) return false;
    const tip = 5;
    /* 武器本地再镜像后：朝右枪尖在右缘，朝左（身体镜像）枪尖在左缘 */
    let tipLeft;
    let tipRight;
    if (enemy.facing < 0) {
      tipLeft = wr.left;
      tipRight = wr.left + tip;
    } else {
      tipLeft = wr.right - tip;
      tipRight = wr.right;
    }
    return (
      tipRight > hr.left &&
      tipLeft < hr.right &&
      wr.bottom > hr.top &&
      wr.top < hr.bottom
    );
  }

  function playEnemyThrust(enemy) {
    const hold = enemy.weaponHoldEl;
    if (!hold) return;
    enemy.el.classList.remove("is-thrusting");
    hold.classList.remove("is-thrusting");
    void hold.offsetWidth;
    enemy.el.classList.add("is-thrusting");
    hold.classList.add("is-thrusting");
    sfxEnemySlash();
    if (enemy._thrustClear) clearTimeout(enemy._thrustClear);
    enemy._thrustClear = setTimeout(() => {
      enemy.el.classList.remove("is-thrusting");
      hold.classList.remove("is-thrusting");
      enemy._thrustClear = 0;
    }, ENEMY_THRUST_MS);
  }

  function knifeTouchesEnemy(enemy) {
    if (selected !== "blue" || !weaponRack || !enemy?.el) return false;
    /* 仅前刺动作中结算 */
    if (hero.swordAnimFrames <= 0 || !runner.classList.contains("is-thrusting")) {
      return false;
    }
    const knife = weaponRack.querySelector(".weapon-sprite--sword");
    if (!knife) return false;
    const kr = knife.getBoundingClientRect();
    const er = enemy.el.getBoundingClientRect();
    if (kr.width < 1 || kr.height < 1 || er.width < 1) return false;
    return (
      kr.right > er.left &&
      kr.left < er.right &&
      kr.bottom > er.top &&
      kr.top < er.bottom
    );
  }

  function updateCombat(heroW) {
    const now = performance.now();
    updateSwordCombo(now);
    tickWeaponAnims();
    if (hero.hurtFrames > 0) {
      hero.hurtFrames -= 1;
      if (hero.hurtFrames <= 0) runner.classList.remove("is-hurt");
    }

    tryAutoAttacks(heroW);

    const frozen =
      (window.SwordHitstop && SwordHitstop.active()) || now < swordCombo.hitStopUntil;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      if (frozen) continue;
      if (e.hurtFrames > 0 || performance.now() < (e.stunnedUntil || 0)) continue;
      if (!weaponOverlapsHero(e)) continue;
      if (!e.thrustAt || now - e.thrustAt >= ENEMY_THRUST_MS) {
        e.thrustAt = now;
        playEnemyThrust(e);
      }
      if (weaponTipHitsHero(e)) takeDamage(e.atk || bossAtkForStage(stage));
    }
  }

  function collectCoins() {
    const hx = hero.x;
    const hy = hero.y + 44;
    for (const c of coins) {
      if (c.got) continue;
      if (c.magnet) {
        const dx = hx - c.x;
        const dy = hy - c.y;
        const dist = Math.hypot(dx, dy) || 1;
        const step = Math.min(dist, Math.max(18, dist * 0.42));
        c.x += (dx / dist) * step;
        c.y += (dy / dist) * step;
        c.el.style.transform = `translate3d(${(c.x + 0.5) | 0}px, ${-((c.y + 0.5) | 0)}px, 0)`;
      }
      if (Math.abs(c.x - hx) < 52 && Math.abs(c.y - hy) < 62) {
        c.got = true;
        c.el.classList.add("is-got");
        coinCount += 1;
        drawCoinCount(formatCoins(coinCount));
        sfxCoin();
        setTimeout(() => c.el.remove(), 280);
      }
    }
  }

  function initTrack() {
    clearTrack();
    hero.hp = MAX_HP;
    hero.x = 180;
    renderHp();
    const start = addPlatform(0, 3, HEIGHTS[2]);
    advanceNextX(start);
    buildArena();
    resetHeroOnTrack();
    beginStage(1, true);
  }

  async function replacePunched(imgEl) {
    const threshold = Number(imgEl.dataset.punch);
    if (!threshold) return;
    try {
      const src = imgEl.currentSrc || imgEl.src;
      const img = await loadImage(src);
      const maxSide = imgEl.classList.contains("sprite")
        ? 360
        : imgEl.classList.contains("portrait")
          ? 280
          : 900;
      const small = downsampleImage(img, maxSide);
      const canvas = punchWhite(small, threshold);
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
    /* 角色头像/立绘已是透明 PNG，不再 data-punch，避免 canvas 替换后不显示 */
    const nodes = [...document.querySelectorAll("[data-punch]")];
    for (const node of nodes) {
      await replacePunched(node);
      await new Promise((r) => setTimeout(r, 0));
    }
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
    syncPartyHud();
  }

  async function enterRunMode() {
    started = true;
    heroLives = START_LIVES;
    gameOver = false;
    if (gameoverOverlay) gameoverOverlay.hidden = true;
    game.classList.remove("is-gameover");

    /* 先露出跑道，避免资源处理失败时整关空白 */
    if (runway) {
      runway.hidden = false;
      runway.removeAttribute("hidden");
    }
    game.classList.add("is-running");
    if (runner) runner.classList.add("is-fighting");
    syncPartyHud();

    try {
      await setRunnerSprite(selected);
    } catch (err) {
      console.warn("setRunnerSprite", err);
    }
    await Promise.allSettled([
      prepareCoinArt(),
      prepareEnemyArt(),
      prepareKnifeArt(),
      prepareComboArt(),
      prepareFloorArt(),
    ]);
    showComboIdle();

    initTrack();
    if (window.SwordCamera) SwordCamera.reset(hero.x, hero.y, viewWidth());
    running = true;
    setPaused(false);
    syncHeroEl();
    if (loadingPage && !loadingPage.hidden) await hideLoadingPage();
    syncPartyHud();
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

  function tickFight() {
    if (hero.dead || inShop) return;

    const now = performance.now();
    const swordBusy = selected === "blue" && window.SwordCombat && SwordCombat.isBusy();
    if (!hero._fightTickAt) hero._fightTickAt = now;
    const dtMs = Math.min(48, Math.max(0, now - hero._fightTickAt));
    hero._fightTickAt = now;

    if (window.SwordHitstop) SwordHitstop.tick(dtMs, paused);
    if (window.SwordCombat && SwordCombat.ready && selected === "blue") {
      SwordCombat.tick(now, dtMs, paused);
    }
    const frozen =
      (window.SwordHitstop && SwordHitstop.active()) || now < swordCombo.hitStopUntil;

    if (!paused && !frozen) {
      if (!swordBusy) {
        const { ix, iy, moving } = readMoveIntent();
        const speed = playerMoveSpeed();
        hero.moveDirX = moving ? ix : 0;
        hero.moveDirY = moving ? iy : 0;
        hero.vx = ix * speed;
        hero.sprinting = tapDashActive();
        if (keys.a && !keys.d) hero.facing = -1;
        else if (keys.d && !keys.a) hero.facing = 1;

        applyActorPhysics(hero, (runner.offsetWidth || 90) * 0.42, 0, { skipLedges: true });
        snapHeroToGround();

        hero.x = Math.round(hero.x);
        if (hero.onGround) hero.y = groundYAt(hero.x);
      } else if (!hero.onGround) {
        hero.vx = 0;
        applyActorPhysics(hero, (runner.offsetWidth || 90) * 0.42, 0, { skipLedges: true });
        snapHeroToGround();
      } else {
        snapHeroToGround();
      }

      if (hero.onGround && hero.jumpLock <= 0) {
        hero.jumpsLeft = MAX_JUMPS;
        hero.airGroundY = null;
        hero.coyoteUntil = performance.now() + 90;
        runner.classList.remove("is-air");
        if (performance.now() < (hero.jumpBufferedUntil || 0)) tryJump();
      } else if (!hero.onGround) {
        if (hero.airGroundY == null) hero.airGroundY = jumpCamBase();
        runner.classList.add("is-air");
      }

      updateFootWalk(dtMs);
      updateBosses();
      updateStageSystem();
    } else if (!paused) {
      updateFootWalk(dtMs);
    }

    updateCamera();
    syncHeroEl();

    if (paused) return;

    const heroW = runner.offsetWidth || 90;
    collectCoins();
    updateCombat(heroW);

    if (hero.y < -80) {
      if (!hero.dead) loseLifeAndRespawn(350);
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
      tickFight();
    }

    const press = cursor && cursor.classList.contains("is-press") ? " scale(0.88)" : "";
    if (cursor) cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)${press}`;
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
      ensureAudio();
      if (window.SwordAudio) SwordAudio.unlock();
      if (selected === "blue" && window.SwordInput) SwordInput.pointerDown(e);
    });
    window.addEventListener("pointerup", () => cursor.classList.remove("is-press"));

    window.addEventListener("click", (e) => {
      if (!running || paused || inShop || hero.dead || gameOver) return;
      if (e.button != null && e.button !== 0) return;
      const t = e.target;
      if (
        t &&
        t.closest &&
        (t.closest(".bag-btn") ||
          t.closest(".bag-panel") ||
          t.closest(".shop") ||
          t.closest(".pause-overlay") ||
          t.closest(".gameover-overlay") ||
          t.closest(".hud") ||
          t.closest("button") ||
          t.closest("a"))
      ) {
        return;
      }
      if (selected === "blue") return;
      tryPlayerAttack();
    });

    document.querySelectorAll(".hero-slot").forEach((btn) => {
      btn.addEventListener("click", () => selectHero(btn.dataset.hero));
    });
    if (startBtn) startBtn.addEventListener("click", startGame);

    shopSlots.forEach((btn, i) => {
      btn.addEventListener("click", () => selectShopItem(i));
    });
    if (shopNextBtn) shopNextBtn.addEventListener("click", closeShopAndContinue);
    if (shopBuyBtn) shopBuyBtn.addEventListener("click", buySelectedShopItem);
    if (bagBtn) bagBtn.addEventListener("click", toggleBag);
    if (bagCloseBtn) bagCloseBtn.addEventListener("click", () => setBagOpen(false));
    if (gameoverContinueBtn) gameoverContinueBtn.addEventListener("click", continueChallenge);
    if (gameoverQuitBtn) gameoverQuitBtn.addEventListener("click", quitGame);

    const keyMap = {
      KeyW: "w",
      KeyA: "a",
      KeyS: "s",
      KeyD: "d",
      ArrowUp: "w",
      ArrowLeft: "a",
      ArrowDown: "s",
      ArrowRight: "d",
    };

    window.addEventListener("keydown", (e) => {
      ensureAudio();
      const moveKey = keyMap[e.code];
      if (moveKey && !inShop) {
        const wasDown = keys[moveKey];
        keys[moveKey] = true;
        if (running) e.preventDefault();
        if (running && !wasDown && !e.repeat) noteMoveTap(moveKey, performance.now());
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        if (inShop) {
          e.preventDefault();
          if (e.code === "Escape") closeShopAndContinue();
          return;
        }
        if (running) {
          e.preventDefault();
          togglePause();
        }
        return;
      }
      if (e.code === "F9") {
        e.preventDefault();
        toggleWeaponSlotDebug();
        return;
      }
      if (inShop) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          shopFocus = shopFocus < 0 ? 0 : (shopFocus + shopSlots.length - 1) % shopSlots.length;
          syncShopUi();
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          shopFocus = shopFocus < 0 ? 0 : (shopFocus + 1) % shopSlots.length;
          syncShopUi();
        } else if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          if (shopFocus < 0) selectShopItem(0);
          else buySelectedShopItem();
        }
        return;
      }
      if (paused) return;
      if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
        if (running) {
          e.preventDefault();
          if (!e.repeat) tryJump();
        } else if (e.code === "Space") {
          e.preventDefault();
          startGame();
        }
      } else if (e.code === "Enter") {
        e.preventDefault();
        if (!running) startGame();
      }
      if (!running) {
        if (e.code === "ArrowLeft") selectHero("red");
        if (e.code === "ArrowRight") selectHero("blue");
      }
    });
    window.addEventListener("keyup", (e) => {
      const moveKey = keyMap[e.code];
      if (moveKey) {
        keys[moveKey] = false;
        if (moveKey === "a" && tapDash.dir < 0) tapDash.dir = 0;
        if (moveKey === "d" && tapDash.dir > 0) tapDash.dir = 0;
      }
    });
    window.addEventListener("blur", () => {
      keys.w = keys.a = keys.s = keys.d = false;
      tapDash.dir = 0;
      tapDash.lastKey = "";
      if (window.SwordInput) SwordInput.blur();
    });
  }

  async function init() {
    try {
      bind();
      requestAnimationFrame(tick);
      drawCoinCount("x000");
      syncPartyHud();

      if (SKIP_TO_SHOP) {
        forceShowGame();
        if (runway) {
          runway.hidden = false;
          runway.removeAttribute("hidden");
        }
        game.classList.add("is-running");
        started = true;
        running = true;
        coinCount = 99;
        drawCoinCount(formatCoins(coinCount));
        grantStartingLoadout();
        openShop(2);
        return;
      }

      if (SKIP_INTRO) {
        forceShowGame();
        await prepareAssets();
        await enterRunMode();
        return;
      }

      if (boot) boot.classList.add("is-done");
      if (game) game.hidden = false;
      setTimeout(() => {
        if (boot && boot.isConnected) boot.remove();
      }, 350);
      await prepareAssets();
    } catch (err) {
      console.error("[cangbaoge] init failed", err);
      forceShowGame();
      if (toast) {
        toast.hidden = false;
        toast.textContent = "加载异常，请强制刷新重试";
        toast.classList.add("is-show");
      }
    }
  }

  init();
})();