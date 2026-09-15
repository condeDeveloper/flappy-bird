// Flappy Bird — HTML5 Canvas, sem dependências.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // ---------- Configuração ----------
  const CFG = {
    gravity: 1500,        // px/s²
    flap: -420,           // px/s
    maxFall: 700,
    pipeGap: 150,
    pipeWidth: 64,
    pipeSpacing: 220,
    speed: 160,           // px/s
    groundH: 90,
    birdR: 14,
  };

  const STATE = { READY: 0, PLAYING: 1, DEAD: 2, PAUSED: 3 };
  let state, bird, pipes, score, best, time, groundX, flashT, lastTs;

  best = Number(localStorage.getItem('flappy-best') || 0);

  function reset() {
    state = STATE.READY;
    bird = { x: W * 0.3, y: H * 0.45, vy: 0, rot: 0, wing: 0 };
    pipes = [];
    score = 0;
    time = 0;
    groundX = 0;
    flashT = 0;
    let x = W + 120;
    for (let i = 0; i < 3; i++) { pipes.push(makePipe(x)); x += CFG.pipeSpacing; }
  }

  function makePipe(x) {
    const margin = 60;
    const top = margin + Math.random() * (H - CFG.groundH - CFG.pipeGap - margin * 2);
    return { x, top, passed: false };
  }

  // ---------- Input ----------
  function flap() {
    if (state === STATE.READY) state = STATE.PLAYING;
    if (state === STATE.PLAYING) {
      bird.vy = CFG.flap;
      bird.wing = 1;
      beep(600, 0.05);
    } else if (state === STATE.DEAD && flashT <= 0) {
      reset();
    }
  }
  function togglePause() {
    if (state === STATE.PLAYING) state = STATE.PAUSED;
    else if (state === STATE.PAUSED) state = STATE.PLAYING;
  }
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
    else if (e.key === 'p' || e.key === 'P') togglePause();
    else if (e.key === 'r' || e.key === 'R') reset();
  });
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });

  // ---------- Áudio (bip simples via WebAudio) ----------
  let audio;
  function beep(freq, dur, type = 'square') {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch (_) {}
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    bird.wing = Math.max(0, bird.wing - dt * 4);
    updateTheme(score, dt);

    if (state === STATE.READY) {
      bird.y = H * 0.45 + Math.sin(time * 4) * 8;
      groundX = (groundX - CFG.speed * dt) % 24;
      return;
    }
    if (state !== STATE.PLAYING) { flashT -= dt; return; }

    // Física do pássaro
    bird.vy = Math.min(bird.vy + CFG.gravity * dt, CFG.maxFall);
    bird.y += bird.vy * dt;
    const targetRot = bird.vy < 0 ? -0.5 : Math.min(1.4, bird.vy / 500);
    bird.rot += (targetRot - bird.rot) * Math.min(1, dt * 10);

    // Canos
    groundX = (groundX - CFG.speed * dt) % 24;
    for (const p of pipes) {
      p.x -= CFG.speed * dt;
      if (!p.passed && p.x + CFG.pipeWidth < bird.x) {
        p.passed = true; score++; beep(900, 0.08, 'triangle');
        if (score > best) { best = score; localStorage.setItem('flappy-best', best); }
      }
    }
    if (pipes[0].x + CFG.pipeWidth < 0) {
      pipes.shift();
      pipes.push(makePipe(pipes[pipes.length - 1].x + CFG.pipeSpacing));
    }

    // Colisões
    if (bird.y + CFG.birdR >= H - CFG.groundH || bird.y - CFG.birdR <= 0) return die();
    for (const p of pipes) {
      if (bird.x + CFG.birdR > p.x && bird.x - CFG.birdR < p.x + CFG.pipeWidth) {
        if (bird.y - CFG.birdR < p.top || bird.y + CFG.birdR > p.top + CFG.pipeGap) return die();
      }
    }
  }

  function die() {
    state = STATE.DEAD;
    flashT = 0.5;
    beep(150, 0.3, 'sawtooth');
  }

  // ---------- Render ----------
  function draw() {
    // Céu (dia/noite conforme a pontuação)
    const theme = currentTheme();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.skyTop); sky.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawStars(ctx, W, H, theme.stars, time);

    // Nuvens (paralaxe lento)
    ctx.fillStyle = theme.cloud;
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 130 - time * 20) % (W + 120) + W + 120) % (W + 120) - 60;
      const cy = 80 + (i % 2) * 60;
      circle(cx, cy, 22); circle(cx + 22, cy - 10, 26); circle(cx + 48, cy, 20);
    }

    // Prédios ao fundo
    ctx.fillStyle = theme.building;
    for (let i = 0; i < 9; i++) {
      const bx = ((i * 60 - time * 40) % (W + 60) + W + 60) % (W + 60) - 30;
      const bh = 40 + ((i * 37) % 50);
      ctx.fillRect(bx, H - CFG.groundH - bh, 44, bh);
    }

    // Canos
    for (const p of pipes) {
      pipe(p.x, 0, CFG.pipeWidth, p.top, true);
      pipe(p.x, p.top + CFG.pipeGap, CFG.pipeWidth, H - CFG.groundH - (p.top + CFG.pipeGap), false);
    }

    // Chão
    ctx.fillStyle = '#ded895'; ctx.fillRect(0, H - CFG.groundH, W, CFG.groundH);
    ctx.fillStyle = '#73bf2e'; ctx.fillRect(0, H - CFG.groundH, W, 14);
    ctx.fillStyle = '#5a9a22';
    for (let x = groundX; x < W; x += 24) ctx.fillRect(x, H - CFG.groundH + 14, 12, 6);

    // Pássaro
    drawBird();

    // HUD
    ctx.textAlign = 'center';
    if (state === STATE.PLAYING || state === STATE.PAUSED) {
      text(String(score), W / 2, 80, 48);
    }
    if (state === STATE.READY) {
      text('FLAPPY BIRD', W / 2, 160, 40, '#fff', '#d97706');
      text('Toque para começar', W / 2, H * 0.68, 20);
      if (best) text('Recorde: ' + best, W / 2, H * 0.68 + 32, 16);
    }
    if (state === STATE.PAUSED) {
      overlay(); text('PAUSADO', W / 2, H / 2, 40); text('P para continuar', W / 2, H / 2 + 40, 18);
    }
    if (state === STATE.DEAD) {
      overlay();
      const medal = medalFor(score);
      if (medal) {
        drawMedal(ctx, W / 2, H / 2 - 135, 24, medal, time * 1000);
        text(medal.name, W / 2, H / 2 - 172, 16, medal.color, '#333');
      }
      panel(W / 2 - 120, H / 2 - 90, 240, 170);
      text('GAME OVER', W / 2, H / 2 - 50, 30, '#fff', '#b91c1c');
      text('Pontos', W / 2 - 55, H / 2, 14, '#8a6d3b', null);
      text(String(score), W / 2 - 55, H / 2 + 34, 32, '#fff', '#8a6d3b');
      text('Recorde', W / 2 + 55, H / 2, 14, '#8a6d3b', null);
      text(String(best), W / 2 + 55, H / 2 + 34, 32, '#fff', '#8a6d3b');
      if (flashT <= 0) text('Toque para jogar de novo', W / 2, H / 2 + 120, 18);
      if (flashT > 0.3) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(0, 0, W, H); }
    }
  }

  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  function pipe(x, y, w, h, capBottom) {
    if (h <= 0) return;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#5fb52c'); g.addColorStop(0.5, '#8fdc4a'); g.addColorStop(1, '#4b8f23');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2f5c14'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y - 2, w - 3, h + 4);
    const capY = capBottom ? y + h - 28 : y;
    ctx.fillStyle = g; ctx.fillRect(x - 4, capY, w + 8, 28);
    ctx.strokeRect(x - 2.5, capY + 1.5, w + 5, 25);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);
    // corpo
    ctx.fillStyle = '#f7d51d'; circle(0, 0, CFG.birdR);
    ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 2; ctx.stroke();
    // asa
    ctx.fillStyle = '#f0b429';
    ctx.beginPath();
    const wy = bird.wing > 0.5 ? -6 : 4;
    ctx.ellipse(-4, wy, 9, 5, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // olho
    ctx.fillStyle = '#fff'; circle(6, -5, 5);
    ctx.fillStyle = '#111'; circle(7.5, -5, 2.5);
    // bico
    ctx.fillStyle = '#f25c05';
    ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(22, 4); ctx.lineTo(10, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function overlay() { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H); }
  function panel(x, y, w, h) {
    ctx.fillStyle = '#ded895'; ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
  }
  function text(s, x, y, size, fill = '#fff', stroke = '#333') {
    ctx.font = 'bold ' + size + 'px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineWidth = Math.max(2, size / 8); ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
    ctx.fillStyle = fill; ctx.fillText(s, x, y);
  }

  // ---------- Loop ----------
  function frame(ts) {
    if (lastTs === undefined) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  reset();
  requestAnimationFrame(frame);
})();
