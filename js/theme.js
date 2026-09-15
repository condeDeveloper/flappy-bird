// Ciclo dia/noite: alterna a cada 10 pontos, com transição suave
const THEMES = {
  day:   { skyTop: [78, 192, 202],  skyBottom: [155, 227, 232], building: [92, 189, 106], cloud: 0.7,  stars: 0 },
  night: { skyTop: [15, 23, 42],    skyBottom: [51, 65, 85],    building: [30, 41, 59],   cloud: 0.25, stars: 1 },
};

// Estrelas fixas geradas uma vez
const STARS = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random() * 0.6, r: 0.6 + Math.random() * 1.2, tw: Math.random() * 6 }));

const themeState = { mix: 0 }; // 0 = dia, 1 = noite

function updateTheme(score, dt) {
  const target = Math.floor(score / 10) % 2; // 0-9 dia, 10-19 noite, ...
  themeState.mix += (target - themeState.mix) * Math.min(1, dt * 1.5);
}

function lerp3(a, b, t) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

function currentTheme() {
  const t = themeState.mix, d = THEMES.day, n = THEMES.night;
  return {
    skyTop: lerp3(d.skyTop, n.skyTop, t),
    skyBottom: lerp3(d.skyBottom, n.skyBottom, t),
    building: lerp3(d.building, n.building, t),
    cloud: `rgba(255,255,255,${(d.cloud + (n.cloud - d.cloud) * t).toFixed(2)})`,
    stars: t,
  };
}

function drawStars(ctx, W, H, alpha, time) {
  if (alpha <= 0.02) return;
  for (const s of STARS) {
    const tw = 0.6 + 0.4 * Math.sin(time * 2 + s.tw);
    ctx.fillStyle = `rgba(255,255,255,${(alpha * tw).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
  }
}
