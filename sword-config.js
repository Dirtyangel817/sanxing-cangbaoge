(() => {
  "use strict";

  const DIR = "assets/gedoudongzuo/";
  const FRAME_VER = "num4";
  /* 只写数字；加载时先找 png，没有再用 gif */
  const F = (id) => `${DIR}${id}`;

  const SwordConfig = {
    clickWindowMs: 0,
    comboScale: 0.441,
    frameDir: DIR,
    frameVer: FRAME_VER,
    idleId: "08",
    breathAmp: 0.012,
    breathMs: 1600,
    recoverEase: "smooth",
    chainMode: true,

    frames: {
      "08": F("08"),
      "09": F("09"),
      "14": F("14"),
      "15": F("15"),
      "16": F("16"),
      "17": F("17"),
      "20": F("20"),
      "21": F("21"),
      "22": F("22"),
      "26": F("26"),
      "27": F("27"),
      "28": F("28"),
    },
    walkHoldMs: 120,
    walkFrames: {
      w08: "assets/xingzouzhen/sword_walk_cycle_transparent_08.gif",
      w09: "assets/xingzouzhen/sword_walk_cycle_transparent_09.gif",
      w10: "assets/xingzouzhen/sword_walk_cycle_transparent_10.gif",
      w11: "assets/xingzouzhen/sword_walk_cycle_transparent_11.gif",
    },
    walkOrder: ["w08", "w09", "w10", "w11"],
    /* 走路帧相对待机再下移，画面像素 */
    walkShift: { x: 0, y: -58 },
    walkScale: 1,
    /* 画面像素，沿朝向逐渐往前；脚底仍钉在地面中线 */
    frameShift: {
      "08": { x: 0, y: -10 },
      "09": { x: 6 },
      "14": { x: 12 },
      "15": { x: 83, y: -110 },
      "16": { x: 103, y: -65 },
      "17": { x: 107 },
      "20": { x: 177 },
      "21": { x: 156 },
      "22": { x: 282 },
      "26": { x: 241 },
      "27": { x: 220 },
      "28": { x: 341 },
    },

    camera: {
      smoothX: 0.08,
      smoothY: 0.10,
      dashSmoothX: 0.018,
      dashLookH: 0.72,
      hopSmoothY: 0.12,
      landSmoothY: 0.14,
      hopFollow: 0.95,
      jumpFollow: 0,
      hopUpMs: 200,
      landFollowMs: 460,
      lookAheadH: 0.35,
      deadzoneYH: 0.05,
    },

    hitstopMs: 100,

    audio: {
      src: "assets/yinxiao/5de089739af2a70975e9efea6069f976.mp4",
      swingOrder: ["14", "15", "17", "20", "22", "27", "28"],
      hitOrder: ["15", "20", "22", "28"],
      /* 从原片波形切开的 7 段挥剑，单位秒 */
      slices: {
        "14": { start: 0.2, dur: 0.26, vol: 0.9 },
        "15": { start: 0.58, dur: 0.28, vol: 1.0 },
        "17": { start: 1.32, dur: 0.38, vol: 0.9 },
        "20": { start: 2.12, dur: 0.32, vol: 1.0 },
        "22": { src: "assets/yinxiao/qian0.3s.mp4", start: 0, dur: 0.3, vol: 1.0 },
        "27": { start: 3.64, dur: 0.28, vol: 0.9 },
        "28": { start: 4.38, dur: 0.5, vol: 1.0 },
      },
      "14": { kind: "whoosh", vol: 0.9 },
      "15": { kind: "slash", vol: 1.0 },
      "17": { kind: "whoosh", vol: 0.9 },
      "20": { kind: "heavy", vol: 1.0 },
      "22": { kind: "upper", vol: 1.0 },
      "27": { kind: "whoosh", vol: 0.9 },
      "28": { kind: "thrust", vol: 1.0 },
    },

    shake: {
      "15": { amp: 16, ms: 100, kind: "impact" },
      "20": { amp: 18, ms: 110, kind: "impact" },
      "22": { amp: 20, ms: 120, kind: "impact" },
      "28": { amp: 24, ms: 130, kind: "impact" },
    },

    hits: {
      "15": { damageMul: 1.1, reachMul: 1.35, knockback: 2.6, arc: { min: -28, max: 28 }, crit: true, critMul: 1.5 },
      "20": { damageMul: 1.25, reachMul: 1.28, knockback: 3.2, arc: { min: -10, max: 88 }, crit: true, critMul: 1.55 },
      "22": { damageMul: 1.45, reachMul: 1.32, knockback: 3.8, arc: { min: -8, max: 78 }, crit: true, critMul: 1.6 },
      "28": { damageMul: 1.9, reachMul: 1.85, knockback: 5.6, arc: { min: -16, max: 16 }, pierce: true, crit: true, critMul: 1.7 },
    },

    /**
     * 最初连招：
     * 待机 08
     * 点一下：08 → 09 → 14 → 15 → 16 → 08
     * 点两下：16 后接着 17 → 20 → 21 → 22 → 26 → 27 → 28 → 08
     *
     * 间隔已全部减半：
     * 08→09 = 0.05s，09→14 = 0.05s，14→15 = 0.1s，15 维持 0.15s，16 = 0.05s，
     * 17→20 = 0.05s，20 维持 0.15s，21→22 = 0.05s，22 维持 0.2s，
     * 26→27 = 0.05s，27 维持 0.2s，28 维持 0.15s。
     */
    attacks: {
      1: {
        id: "attack1",
        recoverMs: 40,
        steps: [
          { from: "08", to: "09", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "linear" },
          { from: "09", to: "14", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "linear" },
          { from: "14", to: "15", holdMs: 100, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "15", to: "16", holdMs: 150, hitstop: true, release: true, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "16", to: "08", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "smooth" },
        ],
      },
      2: {
        id: "attack2",
        recoverMs: 60,
        steps: [
          { from: "17", to: "20", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "20", to: "21", holdMs: 150, hitstop: true, release: true, dx: 0, dy: 0, crouch: 0, ease: "easeIn" },
          { from: "21", to: "22", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "smooth" },
          { from: "22", to: "26", holdMs: 200, hitstop: true, release: true, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "26", to: "27", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "smooth" },
          { from: "27", to: "28", holdMs: 200, dx: 0, dy: 0, crouch: 0, ease: "dash", dash: true, dashMs: 40 },
          { from: "28", to: "08", holdMs: 150, hitstop: true, release: true, dx: 1.55, dy: 0, crouch: 0, ease: "easeOut", dash: true, dashMs: 200 },
        ],
      },
    },
  };

  window.SwordConfig = SwordConfig;
})();
