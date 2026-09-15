// Medalhas por pontuação, exibidas na tela de game over
const MEDALS = [
  { min: 40, name: 'Platina', color: '#e5e7eb', ring: '#94a3b8' },
  { min: 30, name: 'Ouro',    color: '#fbbf24', ring: '#b45309' },
  { min: 20, name: 'Prata',   color: '#cbd5e1', ring: '#64748b' },
  { min: 10, name: 'Bronze',  color: '#d97706', ring: '#78350f' },
];

function medalFor(score) {
  return MEDALS.find(m => score >= m.min) || null;
}

function drawMedal(ctx, x, y, r, medal, t) {
  ctx.save();
  ctx.translate(x, y);
  // fita
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-r * 0.45, -r * 1.6, r * 0.9, r * 0.9);
  // disco
  ctx.fillStyle = medal.ring;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = medal.color;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.fill();
  // estrela
  ctx.fillStyle = medal.ring;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r * 0.5 : r * 0.22;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill();
  // brilho passando
  const shine = ((t / 900) % 2) - 1;
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(shine * r, -shine * r * 0.5, r * 0.15, r * 0.6, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
