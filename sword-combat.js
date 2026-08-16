(() => {
  "use strict";

  function easeFn(name, t) {
    t = Math.min(1, Math.max(0, t));
    if (name === "easeOut") return 1 - (1 - t) * (1 - t) * (1 - t);
    if (name === "easeIn") return t * t * t;
    if (name === "dash") return t < 0.4 ? (t / 0.4) * (t / 0.4) : 1;
    if (name === "smooth") return t * t * (3 - 2 * t);
    return t;
  }

  function loadImg(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function loadNumberedFrame(src, ver) {
    if (/\.(gif|png|webp|jpe?g)(\?|$)/i.test(src)) return loadImg(src);
    const q = ver ? `?v=${ver}` : "";
    try {
      return await loadImg(`${src}.png${q}`);
    } catch (_) {
      return loadImg(`${src}.gif${q}`);
    }
  }

  function isSkinPx(r, g, b) {
    return r > 170 && g > 120 && r > b + 20 && g > b;
  }

  function isHairPx(r, g, b) {
    return r < 55 && g < 55 && b < 55;
  }

  function isBeltPx(r, g, b) {
    return r > 140 && r > g + 40 && r > b + 40;
  }

  function isSlashPx(r, g, b) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 140 && b >= r && b > 130 && b - r > 12 && !isSkinPx(r, g, b);
  }

  function measureOpaque(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    const row = new Uint16Array(h);
    let bodyMinX = w;
    let bodyMaxX = 0;
    let bodyMinY = h;
    let bodyMaxY = 0;
    let coreX = 0;
    let coreN = 0;
    let data = null;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const o = (y * w + x) * 4;
          const a = data[o + 3];
          if (a <= 16) continue;
          const r = data[o + 2];
          const g = data[o + 1];
          const b = data[o];
          row[y] += 1;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (isSlashPx(r, g, b)) continue;
          if (isSkinPx(r, g, b) || isHairPx(r, g, b) || isBeltPx(r, g, b)) {
            if (x < bodyMinX) bodyMinX = x;
            if (x > bodyMaxX) bodyMaxX = x;
            if (y < bodyMinY) bodyMinY = y;
            if (y > bodyMaxY) bodyMaxY = y;
          }
          /* 身体中线只用皮肤和腰带，避开马尾和剑气 */
          if (isSkinPx(r, g, b) || isBeltPx(r, g, b)) {
            coreX += x;
            coreN += 1;
          }
        }
      }
    } catch (_) {
      minX = 0;
      minY = 0;
      maxX = w - 1;
      maxY = h - 1;
    }
    if (maxX < minX) {
      minX = 0;
      minY = 0;
      maxX = w - 1;
      maxY = h - 1;
    }
    const hasBody = coreN > 20 && bodyMaxY >= bodyMinY;
    const footX = hasBody ? coreX / coreN : (minX + maxX) * 0.5;
    const footY = hasBody ? bodyMaxY : maxY;
    const bodyTop = hasBody ? bodyMinY : minY;
    return {
      w,
      h,
      minX,
      minY,
      maxX,
      maxY,
      bodyMinX: hasBody ? bodyMinX : footX - 90,
      bodyMaxX: hasBody ? bodyMaxX : footX + 90,
      footX,
      footY,
      visH: maxY - minY + 1,
      bodyH: Math.max(1, footY - bodyTop + 1),
    };
  }

  const SwordCombat = {
    ready: false,
    stage: null,
    images: Object.create(null),
    meta: Object.create(null),
    H: 140,
    state: "idle",
    attackId: 0,
    stepIndex: 0,
    stepElapsed: 0,
    lastNow: 0,
    standY: 0,
    startX: 0,
    stepStartX: 0,
    stepStartY: 0,
    stepStartHop: 0,
    poseCrouch: 0,
    poseHop: 0,
    poseY: 0,
    hopping: false,
    landing: false,
    landUntil: 0,
    hitIds: null,
    recoverUntil: 0,
    buffered: 0,
    dashing: false,
    dashElapsed: 0,
    hopElapsed: 0,
    hopMs: 0,
    hopFrom: 0,
    hopTarget: 0,
    currentFrame: "08",
    prevFrame: "08",
    appliedShiftX: 0,
    fade: 1,
    walkElapsed: 0,
    walkIndex: 0,
    hooks: null,

    async prepare(stage) {
      this.stage = stage;
      const cfg = window.SwordConfig;
      if (!stage || !cfg) {
        this.ready = false;
        return false;
      }
      stage.innerHTML = "";
      const walk = cfg.walkFrames || {};
      const ids = Object.keys(cfg.frames).concat(Object.keys(walk));
      await Promise.all(
        ids.map(async (id) => {
          const src = cfg.frames[id] || walk[id];
          const img = cfg.frames[id]
            ? await loadNumberedFrame(src, cfg.frameVer)
            : await loadImg(src);
          try {
            if (img.decode) await img.decode();
          } catch (_) {}
          img.className = "combo-stage__frame";
          img.alt = "";
          img.draggable = false;
          img.dataset.frame = id;
          stage.appendChild(img);
          this.images[id] = img;
          this.meta[id] = measureOpaque(img);
        })
      );
      const idle = this.meta["08"];
      const scale = cfg.comboScale || 0.408;
      this.H = idle ? Math.max(72, idle.visH * scale) : 140;
      this.ready = Object.keys(cfg.frames).every((id) => this.images[id]);
      this.showIdle();
      return this.ready;
    },

    bind(hooks) {
      this.hooks = hooks;
    },

    isBusy() {
      return this.state === "attack";
    },

    isRecovering(now) {
      return this.state === "recover" && now < this.recoverUntil;
    },

    canStart(now) {
      if (this.state === "idle") return true;
      if (this.state === "recover" && now >= this.recoverUntil) return true;
      return false;
    },

    requestAttack(n, now) {
      if (this.state === "attack") {
        if (this.attackId === 1) this.buffered = 2;
        return true;
      }
      if (this.state === "recover" && now < this.recoverUntil) {
        if (this.attackId === 1) {
          this.buffered = 2;
          return true;
        }
        return false;
      }
      this.startAttack(1, now);
      return true;
    },

    startAttack(id, now) {
      const atk = window.SwordConfig.attacks[id];
      if (!atk || !this.hooks) return;
      const hero = this.hooks.getHero();
      this.state = "attack";
      this.attackId = id;
      this.stepIndex = 0;
      this.stepElapsed = 0;
      this.lastNow = now;
      this.standY = hero.y;
      this.startX = hero.x;
      this.stepStartX = hero.x;
      this.stepStartY = hero.y;
      this.poseCrouch = 0;
      this.hitIds = new Set();
      this.buffered = 0;
      this.dashing = false;
      this.currentFrame = atk.steps[0].from;
      this.prevFrame = atk.steps[0].from;
      this.fade = 1;
      window.SwordHitstop.resetAttack();
      this.hooks.onAttackStart(id);
      this._enterStep(atk.steps[0], now);
    },

    showIdle() {
      this.state = "idle";
      this.attackId = 0;
      this.stepIndex = 0;
      this.dashing = false;
      this.poseCrouch = 0;
      if (this.poseHop < 0.4) {
        this.poseHop = 0;
        this.poseY = 0;
        this.hopping = false;
        this.landing = false;
        this.landUntil = 0;
        this.hopMs = 0;
      }
      this.currentFrame = "08";
      this.prevFrame = "08";
      this.fade = 1;
      this.walkElapsed = 0;
      this.walkIndex = 0;
      this.hitIds = null;
      this.applyFrame("08", true);
    },

    _tickWalk(dtMs) {
      const cfg = window.SwordConfig || {};
      const order = cfg.walkOrder || [];
      const hero = this.hooks && this.hooks.getHero ? this.hooks.getHero() : null;
      const moving =
        !!hero &&
        (Math.abs(hero.moveDirX || 0) > 0.01 || Math.abs(hero.vx || 0) > 0.2);
      const walking = moving && hero.onGround;
      if (walking && order.length && order.every((id) => this.images[id])) {
        this.walkElapsed += Math.max(0, dtMs || 0);
        const hold = (cfg.walkHoldMs || 120) / (hero.sprinting ? 1.2 : 1);
        while (this.walkElapsed >= hold) {
          this.walkElapsed -= hold;
          this.walkIndex = (this.walkIndex + 1) % order.length;
        }
        this.currentFrame = order[this.walkIndex];
        this.applyFrame(this.currentFrame, true);
        return;
      }
      if (moving && String(this.currentFrame).charAt(0) === "w") {
        this.applyFrame(this.currentFrame, true);
        return;
      }
      this.walkElapsed = 0;
      this.walkIndex = 0;
      this.currentFrame = "08";
      this.applyFrame("08", true);
    },

    shiftXFor(key, raw) {
      if (this.state !== "attack") return raw;
      const hero = this.hooks && this.hooks.getHero ? this.hooks.getHero() : null;
      const view = this.hooks && this.hooks.getView ? this.hooks.getView() : null;
      if (!hero || !view || !(view.viewW > 0)) return raw;
      return this.clampShiftX(hero, view.camX || 0, view.viewW, view.pad || 12, key, raw);
    },

    clampShiftX(hero, camX, viewW, pad, key, raw) {
      const m = this.meta[key];
      const cfg = window.SwordConfig || {};
      const scale = cfg.comboScale || 0.441;
      if (!m) return raw;
      const facing = hero.facing < 0 ? -1 : 1;
      const bL = ((m.bodyMinX != null ? m.bodyMinX : m.minX) - m.footX) * scale;
      const bR = ((m.bodyMaxX != null ? m.bodyMaxX : m.maxX) - m.footX) * scale;
      const feet = hero.x - camX;
      const lo = pad;
      const hi = viewW - pad;
      let shift = raw;
      if (facing > 0) {
        const visR = feet + bR + shift;
        if (visR > hi) shift -= visR - hi;
        const visL = feet + bL + shift;
        if (visL < lo) shift += lo - visL;
      } else {
        const visL = feet - bR - shift;
        if (visL < lo) shift -= lo - visL;
        const visR = feet - bL - shift;
        if (visR > hi) shift += visR - hi;
      }
      return shift;
    },

    applyFrame(id, instant) {
      const cfg = window.SwordConfig;
      const scale = cfg.comboScale || 0.408;
      const stage = this.stage;
      if (!stage) return;
      const sw = 1020;
      const sh = 569;
      const ax = sw * 0.5;
      const idle = this.meta["08"];
      const walkIds = cfg.walkOrder || [];
      Object.keys(this.images).forEach((key) => {
        const img = this.images[key];
        const m = this.meta[key];
        if (!m) return;
        const isWalk = walkIds.indexOf(key) >= 0;
        /* 走路按待机人物身高对齐，不再额外放大 */
        const idleH = idle ? idle.bodyH || idle.visH : 0;
        const walkH = m.bodyH || m.visH;
        const fit = isWalk && idleH > 0 && walkH > 0 ? idleH / walkH : 1;
        const footX = m.footX * fit;
        const footY = m.footY * fit;
        const shift = (cfg.frameShift && cfg.frameShift[key]) || {};
        const shiftX = this.shiftXFor(key, shift.x || 0);
        if (key === id) this.appliedShiftX = shiftX;
        const walk = isWalk ? cfg.walkShift || {} : {};
        const left = ax - footX + (shiftX + (walk.x || 0)) / scale;
        const bottom = sh - footY + ((shift.y || 0) + (walk.y || 0)) / scale;
        img.style.left = `${left}px`;
        img.style.bottom = `${bottom}px`;
        img.style.width = `${m.w * fit}px`;
        img.style.height = `${m.h * fit}px`;
        img.style.transformOrigin = `${footX}px ${footY}px`;
        const on = key === id || (!instant && key === this.prevFrame);
        img.classList.toggle("is-on", on);
        if (key === id) img.style.opacity = instant ? "1" : String(this.fade);
        else if (key === this.prevFrame && !instant) img.style.opacity = String(1 - this.fade);
        else img.style.opacity = "0";
      });
      stage.style.setProperty("--combo-scale", String(scale));
    },

    syncPos(hero, camX, camY) {
      const stage = this.stage;
      if (!stage || stage.hidden) return;
      const cfg = window.SwordConfig;
      const scale = cfg.comboScale || 0.408;
      /* origin 在舞台中心 510px；translate 必须扣掉它，脚底才对齐世界坐标 */
      const x = hero.x - camX - 510;
      const y = hero.y - camY + this.poseY;
      const sx = hero.facing < 0 ? -scale : scale;
      const breath =
        this.state === "idle"
          ? 1 + Math.sin((performance.now() / (cfg.breathMs || 1600)) * Math.PI * 2) * (cfg.breathAmp || 0.012)
          : 1;
      const punch = this.state === "attack" && this.fade < 1 ? 1.02 : 1;
      stage.style.transform = `translate3d(${x}px, ${-y}px, 0) scale(${sx * punch}, ${scale * breath * punch})`;
      stage.style.transformOrigin = "510px 569px";
    },

    _moveHero(step, t, hero) {
      const H = this.H;
      const e = easeFn(step.ease, t);
      const facing = hero.facing < 0 ? -1 : 1;
      const xTo = this.stepStartX + facing * (step.dx || 0) * H * e;
      if (this.hooks.moveHero) this.hooks.moveHero(xTo, this.standY);
      this.poseCrouch = (step.crouch || 0) * H;
      this.poseY = this.poseHop - this.poseCrouch;
      this.dashing = !!(step.dash || (step.dx || 0) > 0);
    },

    _beginHop(to, ms, now) {
      this.hopFrom = this.poseHop;
      this.hopTarget = to;
      this.hopElapsed = 0;
      this.hopMs = Math.max(1, ms);
      if (to > this.hopFrom + 2) {
        this.hopping = true;
        this.landing = false;
      } else if (to < this.hopFrom - 2) {
        this.hopping = false;
        this.landing = true;
        this.landUntil = (now || performance.now()) + this.hopMs;
      }
    },

    _tickHop(dt, now) {
      if (this.hopMs <= 0) {
        if (this.poseHop < 0.4 && this.landing && this.landUntil && now > this.landUntil) {
          this.poseHop = 0;
          this.poseY = -this.poseCrouch;
          this.landing = false;
        }
        return;
      }
      this.hopElapsed += dt;
      const t = Math.min(1, this.hopElapsed / this.hopMs);
      const e = easeFn("smooth", t);
      const prev = this.poseHop;
      this.poseHop = this.hopFrom + (this.hopTarget - this.hopFrom) * e;
      this.poseY = this.poseHop - this.poseCrouch;
      this.hopping = this.poseHop > 3 && this.poseHop >= prev - 0.35;
      if (this.hopTarget < this.hopFrom - 2) {
        this.landing = true;
        this.hopping = false;
      }
      if (t >= 1) {
        this.poseHop = this.hopTarget;
        this.poseY = this.poseHop - this.poseCrouch;
        this.hopMs = 0;
        if (this.hopTarget <= 0.4) {
          this.poseHop = 0;
          this.poseY = -this.poseCrouch;
          this.hopping = false;
        }
      }
    },

    _enterStep(step, now) {
      const hero = this.hooks.getHero();
      this.stepStartX = hero.x;
      this.stepStartY = this.standY;
      this.stepStartHop = this.poseHop;
      this.stepElapsed = 0;
      this.dashElapsed = 0;
      this.prevFrame = this.currentFrame;
      this.currentFrame = step.from;
      if (step.dash || (step.dx || 0) > 0) this.dashing = true;
      const cam = (window.SwordConfig && SwordConfig.camera) || {};
      if ((step.dy || 0) > 0) {
        this._beginHop(step.dy * this.H, cam.hopUpMs || 200, now);
      } else if (this.poseHop > 3) {
        this._beginHop(0, cam.landFollowMs || 460, now);
      }
      this.fade = 0.35;
      this.applyFrame(step.from, false);
      if (step.release) {
        window.SwordHitstop.trigger(step.from);
        window.SwordCamera.triggerShake(step.from, now, { facing: hero.facing });
        this.hitIds = new Set();
      }
      if (window.SwordConfig.audio && SwordConfig.audio[step.from]) {
        window.SwordAudio.playSlash(step.from);
      }
    },

    _resolveHits(step) {
      if (!step.release || !this.hooks.strike) return;
      this.hooks.strike(step.from, this.hitIds);
    },

    tick(now, dtMs, paused) {
      if (!this.ready || !this.hooks) return;
      if (paused) {
        this.lastNow = now;
        this.applyFrame(this.currentFrame, this.state === "idle");
        return;
      }

      if (this.landing && this.landUntil && now > this.landUntil && this.poseHop < 0.4) this.landing = false;

      if (this.state === "idle") {
        this._tickHop(dtMs, now);
        if (this.poseHop < 0.4 && !this.landing) {
          this.poseHop = 0;
          this.poseCrouch = 0;
          this.poseY = 0;
          this.hopping = false;
        }
        this._tickWalk(dtMs);
        return;
      }

      if (this.state === "recover") {
        this._tickHop(Math.min(48, now - (this.lastNow || now)), now);
        this.lastNow = now;
        this.applyFrame("08", true);
        if (now >= this.recoverUntil) {
          const buf = this.buffered;
          this.buffered = 0;
          if (buf) this.startAttack(buf, now);
          else this.showIdle();
        }
        return;
      }

      const frozen = window.SwordHitstop.active();
      const atk = window.SwordConfig.attacks[this.attackId];
      if (!atk) {
        this.showIdle();
        return;
      }

      const dt = Math.min(48, Math.max(0, now - (this.lastNow || now)));
      if (!frozen) {
        this.stepElapsed += dt;
        this.fade = Math.min(1, this.fade + dt / 70);
      }
      this.lastNow = now;

      let step = atk.steps[this.stepIndex];
      if (!step) {
        this._finish(now, atk);
        return;
      }

      const hold = step.holdMs;
      const t = hold <= 0 ? 1 : Math.min(1, this.stepElapsed / hold);
      const sliding = !!(step.dash || (step.dx || 0) > 0);
      if (sliding) {
        this.dashElapsed += dt;
        const dashMs = step.dashMs || hold || 280;
        const dashT = Math.min(1, this.dashElapsed / dashMs);
        this._moveHero(step, dashT, this.hooks.getHero());
      } else if (!frozen) {
        this._moveHero(step, t, this.hooks.getHero());
      }
      this._tickHop(dt, now);
      this.applyFrame(this.currentFrame, false);
      this._resolveHits(step);

      if (!frozen && this.stepElapsed >= hold) {
        this.stepIndex += 1;
        if (this.stepIndex >= atk.steps.length) {
          this._finish(now, atk);
          return;
        }
        this._enterStep(atk.steps[this.stepIndex], now);
      }
    },

    _finish(now, atk) {
      if (this.hooks.getHero) {
        const hero = this.hooks.getHero();
        let x = hero.x;
        if (this.attackId === 2 && this.hooks.moveHero) {
          const cfg = window.SwordConfig || {};
          const s08 = (cfg.frameShift && cfg.frameShift["08"]) || {};
          const baked = this.appliedShiftX != null ? this.appliedShiftX : ((cfg.frameShift && cfg.frameShift["28"]) || {}).x || 0;
          const facing = hero.facing < 0 ? -1 : 1;
          x += facing * (baked - (s08.x || 0));
        }
        if (this.hooks.moveHero) this.hooks.moveHero(x, this.standY);
      }
      this.dashing = false;
      if (this.attackId === 1 && this.buffered === 2) {
        this.buffered = 0;
        this.startAttack(2, now);
        return;
      }
      this.poseCrouch = 0;
      this.hopping = false;
      if (this.poseHop > 3) {
        const landMs = (window.SwordConfig.camera && SwordConfig.camera.landFollowMs) || 460;
        this._beginHop(0, landMs, now);
      } else {
        this.poseHop = 0;
        this.poseY = 0;
        this.landing = true;
        this.landUntil = now + ((window.SwordConfig.camera && SwordConfig.camera.landFollowMs) || 460);
      }
      this.currentFrame = "08";
      this.applyFrame("08", true);
      this.state = "recover";
      this.recoverUntil = now + (atk.recoverMs || 100);
      if (this.hooks.onAttackEnd) this.hooks.onAttackEnd();
    },

    reset() {
      this.buffered = 0;
      this.recoverUntil = 0;
      this.dashing = false;
      window.SwordHitstop.reset();
      this.showIdle();
    },
  };

  window.SwordCombat = SwordCombat;
})();
