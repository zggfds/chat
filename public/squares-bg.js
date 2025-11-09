const squareCount = 18;
const squares = [];
const floating = document.querySelector('.floating-squares');
const bodyW = () => window.innerWidth, bodyH = () => window.innerHeight;
for (let i = 0; i < squareCount; i++) {
  let s = document.createElement('div');
  s.className = 'square';
  s.style.left = Math.random() * (bodyW()-50) + 'px';
  s.style.top = Math.random() * (bodyH()-50) + 'px';
  floating.appendChild(s);
  squares.push(s);
}
function animateSquares() {
  squares.forEach((s, i) => {
    let x = parseFloat(s.style.left), y = parseFloat(s.style.top);
    x += Math.sin((Date.now() / 1200) + i) * 0.6;
    y += Math.cos((Date.now() / 1400) + i * 1.3) * 0.7;
    if (x < -48) x = bodyW();
    if (x > bodyW()) x = -48;
    if (y < -48) y = bodyH();
    if (y > bodyH()) y = -48;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
  });
  requestAnimationFrame(animateSquares);
}
animateSquares();
floating.addEventListener('mousemove', e => {
  squares.forEach(s => {
    let rect = s.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width/2);
    let dy = e.clientY - (rect.top + rect.height/2);
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 70) s.classList.add('highlighted');
    else s.classList.remove('highlighted');
  });
});
