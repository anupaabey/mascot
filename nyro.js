(() => {
  'use strict';
  const root = document.getElementById('nyro-widget');
  const pet = document.getElementById('nyro-pet');
  const sprite = document.getElementById('nyro-sprite');
  const bubble = document.getElementById('nyro-bubble');
  if (!root || !pet || !sprite || !bubble) return;
  const assetURL = new URL('./assets/nyro/spritesheet.webp', document.currentScript?.src || document.baseURI).href;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Milliseconds per frame: wave follows the supplied GIF; other speeds are website choices.
  const states = {
    idle: [0, [240,240,240,240,240,240]],
    'running-right': [1, Array(8).fill(100)],
    'running-left': [2, Array(8).fill(100)],
    waving: [3, [140,140,140,280]],
    jumping: [4, Array(5).fill(140)],
    failed: [5, Array(8).fill(180)],
    waiting: [6, Array(6).fill(200)],
    running: [7, Array(6).fill(140)],
    review: [8, Array(6).fill(180)]
  };
  let state = 'idle', loop = true, started = performance.now(), raf = 0;
  let direction = null, lastCell = '', ready = false;
  function cell(row, column) {
    const key = `${row}:${column}`;
    if (lastCell === key) return;
    lastCell = key;
    sprite.style.backgroundPosition = `${-column * 120}px ${-row * 130}px`;
  }
  function draw(now) {
    raf = 0;
    if (!ready || document.hidden) return;
    if (reduced.matches) { cell(0, 0); return; }
    if (state === 'idle' && direction !== null) {
      cell(9 + Math.floor(direction / 8), direction % 8);
    } else {
      const [row, durations] = states[state];
      const total = durations.reduce((a,b) => a+b, 0);
      let elapsed = now - started;
      if (!loop && elapsed >= total) {
        state = 'idle'; loop = true; started = now; cell(0,0);
      } else {
        elapsed %= total;
        let frame = 0;
        while (frame < durations.length - 1 && elapsed >= durations[frame]) {
          elapsed -= durations[frame++];
        }
        cell(row, frame);
      }
    }
    raf = requestAnimationFrame(draw);
  }
  function restart() {
    cancelAnimationFrame(raf); started = performance.now(); draw(started);
  }
  function play(name, options = {}) {
    if (!Object.hasOwn(states, name)) throw new Error(`Unknown Nyro state: ${name}`);
    state = name; loop = options.loop ?? true; restart();
  }
  function close() { bubble.hidden = true; pet.setAttribute('aria-expanded', 'false'); }
  pet.addEventListener('click', () => {
    const open = bubble.hidden;
    bubble.hidden = !open; pet.setAttribute('aria-expanded', String(open));
    direction = null; play('waving', { loop: false });
    root.dispatchEvent(new CustomEvent('nyro:activate', { bubbles: true, detail: { open } }));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || reduced.matches) return;
    const rect = pet.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height * .32);
    if (Math.hypot(dx, dy) < 20) { direction = null; return; }
    // Up = 0 degrees, right = 90; clockwise in screen coordinates.
    const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    direction = Math.round(angle / 22.5) % 16;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { direction = null; });
  window.addEventListener('blur', () => { direction = null; });
  document.addEventListener('visibilitychange', restart);
  reduced.addEventListener('change', restart);
  window.NyroPet = {
    play,
    say(text) { bubble.textContent = String(text); bubble.hidden = false; pet.setAttribute('aria-expanded','true'); },
    close
  };
  const image = new Image();
  image.onload = () => {
    if (image.naturalWidth !== 1536 || image.naturalHeight !== 2288) {
      console.error('Nyro: expected a 1536 × 2288 sprite sheet.'); return;
    }
    sprite.style.backgroundImage = `url("${assetURL}")`;
    ready = true; root.hidden = false; restart();
  };
  image.onerror = () => console.error('Nyro: could not load /assets/nyro/spritesheet.webp');
  image.src = assetURL;
})();
