const AFS = [
  {
    id: 'AF-01',
    name: 'Identificadores',
    regex: '[a-zA-Z][a-zA-Z0-9]*',
    states: ['q0', 'q1'],
    initial: 'q0',
    accepting: ['q1'],
    transitions: [
      { from: 'q0', sym: 'letra', to: 'q1' },
      { from: 'q1', sym: 'letra/dígito', to: 'q1' },
    ],
    layout: {
      q0: { x: .22, y: .5 },
      q1: { x: .72, y: .5 },
    },
    edges: [
      { from: 'q0', to: 'q1', label: 'letra', curve: 0 },
      { from: 'q1', to: 'q1', label: 'letra / dígito', loop: true },
    ],
    step(state, ch) {
      if (state === 'q0') return /[a-zA-Z]/.test(ch) ? 'q1' : '__DEAD__';
      if (state === 'q1') return /[a-zA-Z0-9]/.test(ch) ? 'q1' : '__DEAD__';
      return '__DEAD__';
    }
  },
  {
    id: 'AF-02',
    name: 'Enteros y Decimales',
    regex: '-?[0-9]+(\\.[0-9]+)?',
    states: ['q0', 'q1', 'q2', 'q3', 'q4'],
    initial: 'q0',
    accepting: ['q2', 'q4'],
    transitions: [
      { from: 'q0', sym: '-',      to: 'q1' },
      { from: 'q0', sym: 'dígito', to: 'q2' },
      { from: 'q1', sym: 'dígito', to: 'q2' },
      { from: 'q2', sym: 'dígito', to: 'q2' },
      { from: 'q2', sym: '.',      to: 'q3' },
      { from: 'q3', sym: 'dígito', to: 'q4' },
      { from: 'q4', sym: 'dígito', to: 'q4' },
    ],
    layout: {
      q0: { x: .10, y: .5 },
      q1: { x: .30, y: .5 },
      q2: { x: .52, y: .5 },
      q3: { x: .72, y: .5 },
      q4: { x: .90, y: .5 },
    },
    edges: [
      { from: 'q0', to: 'q1', label: '-',      curve: 0    },
      { from: 'q0', to: 'q2', label: 'dígito', curve: -55  },
      { from: 'q1', to: 'q2', label: 'dígito', curve: 0    },
      { from: 'q2', to: 'q2', label: 'dígito', loop: true  },
      { from: 'q2', to: 'q3', label: '.',      curve: 0    },
      { from: 'q3', to: 'q4', label: 'dígito', curve: 0    },
      { from: 'q4', to: 'q4', label: 'dígito', loop: true  },
    ],
    step(state, ch) {
      if (state === 'q0') return ch === '-' ? 'q1' : /[0-9]/.test(ch) ? 'q2' : '__DEAD__';
      if (state === 'q1') return /[0-9]/.test(ch) ? 'q2' : '__DEAD__';
      if (state === 'q2') return /[0-9]/.test(ch) ? 'q2' : ch === '.' ? 'q3' : '__DEAD__';
      if (state === 'q3') return /[0-9]/.test(ch) ? 'q4' : '__DEAD__';
      if (state === 'q4') return /[0-9]/.test(ch) ? 'q4' : '__DEAD__';
      return '__DEAD__';
    }
  },
  {
    id: 'AF-03',
    name: 'Comentarios',
    regex: '##.*',
    states: ['q0', 'q1', 'q2', 'q3'],
    initial: 'q0',
    accepting: ['q2', 'q3'],
    transitions: [
      { from: 'q0', sym: '#',       to: 'q1' },
      { from: 'q1', sym: '#',       to: 'q2' },
      { from: 'q2', sym: 'cualquier', to: 'q3' },
      { from: 'q3', sym: 'cualquier', to: 'q3' },
    ],
    layout: {
      q0: { x: .13, y: .5 },
      q1: { x: .39, y: .5 },
      q2: { x: .65, y: .5 },
      q3: { x: .87, y: .5 },
    },
    edges: [
      { from: 'q0', to: 'q1', label: '#', curve: 0 },
      { from: 'q1', to: 'q2', label: '#', curve: 0 },
      { from: 'q2', to: 'q3', label: '*', curve: 0 },
      { from: 'q3', to: 'q3', label: '*', loop: true },
    ],
    step(state, ch) {
      if (state === 'q0') return ch === '#' ? 'q1' : '__DEAD__';
      if (state === 'q1') return ch === '#' ? 'q2' : '__DEAD__';
      if (state === 'q2') return 'q3';
      if (state === 'q3') return 'q3';
      return '__DEAD__';
    }
  }
];

// ─── GLOBALS ──────────────────────────────────────────────────────────────────
let currentAF  = 0;
let animRunning = false;
let animTimer   = null;

const canvas = document.getElementById('diagram-canvas');
const ctx    = canvas.getContext('2d');

// ─── COLOR PALETTE ────────────────────────────────────────────────────────────
const CYAN   = '#00e8a0';
const CYAN2  = '#00c484';
const CYAN3  = '#007a52';
const RED    = '#ff4060';
const AMBER  = '#f0a000';
const TEXT2  = '#6a8099';
const DIMMER = '#131928';
const BORDER = '#1e2d40';
const BG3    = '#161c28';

// ─── CANVAS HELPERS ───────────────────────────────────────────────────────────
function dpr() { return window.devicePixelRatio || 1; }
function W()   { return canvas.width  / dpr(); }
function H()   { return canvas.height / dpr(); }

function resizeCanvas() {
  const r = dpr();
  const cW = canvas.parentElement.offsetWidth;
  const cH = 240;
  canvas.width        = cW * r;
  canvas.height       = cH * r;
  canvas.style.width  = cW + 'px';
  canvas.style.height = cH + 'px';
  ctx.scale(r, r);
  drawDiagram(currentAF, null);
}

// ─── AUTOMATON SELECTOR ───────────────────────────────────────────────────────
function selectAF(idx) {
  currentAF = idx;
  document.querySelectorAll('.af-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
  document.getElementById('diagram-title').textContent =
    AFS[idx].id + ' · ' + AFS[idx].name;
  resetAll();
  buildInfoCards();
  drawDiagram(idx, null);
}

// ─── INFO CARDS ───────────────────────────────────────────────────────────────
function buildInfoCards() {
  const af = AFS[currentAF];

  // State chips
  const sc = document.getElementById('state-chips');
  sc.innerHTML = af.states.map(s => {
    let cls = '';
    if (s === af.initial)          cls += ' initial';
    if (af.accepting.includes(s))  cls += ' accept';
    return `<span class="state-chip${cls}">${s}${s === af.initial ? ' ▶' : ''}${af.accepting.includes(s) ? ' ✓' : ''}</span>`;
  }).join('');

  // Transition table
  const tb = document.getElementById('trans-body');
  tb.innerHTML = af.transitions.map(t =>
    `<tr><td>${t.from}</td><td>${t.sym}</td><td>${t.to}</td></tr>`
  ).join('');
}

// ─── STATE COLOR ──────────────────────────────────────────────────────────────
function stateColor(state, af, activeState) {
  if (state === activeState)          return RED;
  if (af.accepting.includes(state))   return CYAN;
  if (state === af.initial)           return AMBER;
  return CYAN3;
}

// ─── DRAW DIAGRAM ─────────────────────────────────────────────────────────────
function drawDiagram(afIdx, activeState) {
  const af = AFS[afIdx];
  const w  = W(), h = H();
  ctx.clearRect(0, 0, w, h);

  // Faint grid background
  ctx.strokeStyle = 'rgba(0,232,160,0.04)';
  ctx.lineWidth   = .5;
  for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const nodeR     = Math.min(36, w * 0.065);
  const positions = {};
  for (const [s, pos] of Object.entries(af.layout)) {
    positions[s] = { x: pos.x * w, y: pos.y * h };
  }

  // ── Edges ──
  for (const e of af.edges) {
    const from     = positions[e.from];
    const to       = positions[e.to];
    const isActive = activeState && (e.from === activeState || e.to === activeState);

    if (e.loop) {
      // Self-loop above node
      const loopR = nodeR * 1.2;
      ctx.beginPath();
      ctx.arc(from.x, from.y - nodeR - loopR * .7, loopR, Math.PI * .2, Math.PI * .8, true);
      ctx.strokeStyle = isActive ? RED : BORDER;
      ctx.lineWidth   = isActive ? 1.8 : 1;
      ctx.setLineDash([]);
      ctx.stroke();
      drawArrow(from.x - loopR * .55, from.y - nodeR - loopR * .95,
                from.x - loopR * .55 - 5, from.y - nodeR - loopR * .95 + 6,
                isActive ? RED : BORDER, isActive ? 1.8 : 1, false);
      ctx.fillStyle  = isActive ? RED : TEXT2;
      ctx.font       = "10px 'Space Mono', monospace";
      ctx.textAlign  = 'center';
      ctx.fillText(e.label, from.x, from.y - nodeR - loopR * 2 + 8);

    } else if (e.curve) {
      // Quadratic curve between states
      const mx  = (from.x + to.x) / 2;
      const my  = (from.y + to.y) / 2;
      const dx  = to.x - from.x;
      const dy  = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const cpx = mx + (-dy / len) * e.curve * .25;
      const cpy = my + ( dx / len) * e.curve * .25;

      const aStart = Math.atan2(cpy - from.y, cpx - from.x);
      const aEnd   = Math.atan2(to.y - cpy,   to.x - cpx);

      const sx = from.x + Math.cos(aStart) * nodeR;
      const sy = from.y + Math.sin(aStart) * nodeR;
      const ex = to.x   - Math.cos(aEnd)   * nodeR;
      const ey = to.y   - Math.sin(aEnd)   * nodeR;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.strokeStyle = isActive ? RED : BORDER;
      ctx.lineWidth   = isActive ? 1.8 : 1;
      ctx.setLineDash([]);
      ctx.stroke();
      drawArrow(ex, ey, null, null, isActive ? RED : BORDER, isActive ? 1.8 : 1, false, aEnd);
      ctx.fillStyle = isActive ? RED : TEXT2;
      ctx.font      = "10px 'Space Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(e.label, cpx, cpy - 8);

    } else {
      // Straight arrow
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const sx    = from.x + Math.cos(angle) * nodeR;
      const sy    = from.y + Math.sin(angle) * nodeR;
      const ex    = to.x   - Math.cos(angle) * (nodeR + 2);
      const ey    = to.y   - Math.sin(angle) * (nodeR + 2);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = isActive ? RED : BORDER;
      ctx.lineWidth   = isActive ? 1.8 : 1;
      ctx.setLineDash([]);
      ctx.stroke();
      drawArrow(ex, ey, null, null, isActive ? RED : BORDER, isActive ? 1.8 : 1, false, angle);

      ctx.fillStyle = isActive ? RED : TEXT2;
      ctx.font      = "10px 'Space Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(e.label, (sx + ex) / 2, (sy + ey) / 2 - 8);
    }
  }

  // ── Initial arrow ──
  const initPos = positions[af.initial];
  ctx.beginPath();
  ctx.moveTo(initPos.x - nodeR - 28, initPos.y);
  ctx.lineTo(initPos.x - nodeR - 3,  initPos.y);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth   = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  drawArrow(initPos.x - nodeR - 3, initPos.y, null, null, AMBER, 1.2, false, 0);

  // ── Nodes ──
  for (const [s, pos] of Object.entries(positions)) {
    const isActive = s === activeState;
    const isAccept = af.accepting.includes(s);
    const col      = stateColor(s, af, activeState);

    // Glow
    ctx.shadowColor = isActive ? RED : (isAccept ? CYAN : 'transparent');
    ctx.shadowBlur  = isActive ? 22  : (isAccept ? 10   : 0);

    // Double ring for accepting states
    if (isAccept) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeR + 6, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Fill
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, nodeR, 0, Math.PI * 2);
    ctx.fillStyle = isActive
      ? 'rgba(255,64,96,.12)'
      : (isAccept ? 'rgba(0,232,160,.06)' : DIMMER);
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, nodeR, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth   = isActive ? 2 : 1.2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle      = col;
    ctx.font           = "bold 13px 'Space Mono', monospace";
    ctx.textAlign      = 'center';
    ctx.textBaseline   = 'middle';
    ctx.fillText(s, pos.x, pos.y);
  }
}

// ─── DRAW ARROW HEAD ──────────────────────────────────────────────────────────
function drawArrow(x, y, ax, ay, color, lw, fromPoints, angle) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = lw;
  const size = 8;
  const a    = (angle !== undefined && angle !== null)
    ? angle
    : Math.atan2(y - ay, x - ax);
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * .5);
  ctx.lineTo(-size,  size * .5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetAll() {
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
  animRunning = false;
  document.getElementById('chain-input').disabled = false;
  document.getElementById('sim-btn').disabled     = false;
  document.getElementById('char-track').innerHTML = '';
  const rb = document.getElementById('result-bar');
  rb.className    = 'result-bar';
  rb.style.display = 'none';
  document.getElementById('log-body').innerHTML =
    '<span class="log-empty">Esperando simulación...</span>';
  drawDiagram(currentAF, null);
}

// ─── LOG ──────────────────────────────────────────────────────────────────────
function log(state, ch, nextState, ok) {
  const lb = document.getElementById('log-body');
  if (lb.querySelector('.log-empty')) lb.innerHTML = '';
  const d   = document.createElement('div');
  d.className = 'log-entry';
  const msg = ch !== null
    ? `δ(${state}, '${ch}') → ${nextState}`
    : `Estado final: ${state}`;
  const cls = ok === null ? '' : ok ? 'ok' : 'err';
  d.innerHTML = `<span class="ts">[trans]</span><span class="msg ${cls}">${msg}</span>`;
  lb.appendChild(d);
  lb.scrollTop = lb.scrollHeight;
}

// ─── SIMULATE ─────────────────────────────────────────────────────────────────
function simulate() {
  const chain = document.getElementById('chain-input').value;
  if (!chain) return;
  resetAll();

  const af = AFS[currentAF];
  document.getElementById('chain-input').disabled = true;
  document.getElementById('sim-btn').disabled     = true;
  animRunning = true;

  // Build char pills
  const ct = document.getElementById('char-track');
  ct.innerHTML = '';
  for (let i = 0; i < chain.length; i++) {
    const pill       = document.createElement('span');
    pill.className   = 'char-pill pending';
    pill.id          = 'pill-' + i;
    pill.textContent = chain[i] === ' ' ? '·' : chain[i];
    ct.appendChild(pill);
  }
  document.getElementById('log-body').innerHTML = '';

  let state = af.initial;
  let idx   = 0;
  drawDiagram(currentAF, state);
  log(state, null, null, null);

  function step() {
    if (idx >= chain.length) {
      const accepted = af.accepting.includes(state);
      log(state, null, null, accepted);
      showResult(accepted, state);
      drawDiagram(currentAF, state);
      document.getElementById('chain-input').disabled = false;
      document.getElementById('sim-btn').disabled     = false;
      return;
    }

    const ch   = chain[idx];
    const next = af.step(state, ch);
    const pill = document.getElementById('pill-' + idx);
    if (pill) pill.className = 'char-pill current';
    if (idx > 0) {
      const prev = document.getElementById('pill-' + (idx - 1));
      if (prev) prev.className = 'char-pill done';
    }

    if (next === '__DEAD__') {
      log(state, ch, '✗ muerto', false);
      drawDiagram(currentAF, '__DEAD__');
      setTimeout(() => {
        showResult(false, state);
        document.getElementById('chain-input').disabled = false;
        document.getElementById('sim-btn').disabled     = false;
      }, 600);
      return;
    }

    log(state, ch, next, null);
    state = next;
    drawDiagram(currentAF, state);
    idx++;
    animTimer = setTimeout(step, 480);
  }

  animTimer = setTimeout(step, 400);
}

// ─── SHOW RESULT ──────────────────────────────────────────────────────────────
function showResult(accepted, state) {
  const rb = document.getElementById('result-bar');
  const rt = document.getElementById('result-text');
  const ri = document.getElementById('result-icon');
  if (accepted) {
    rb.className     = 'result-bar accepted';
    rb.style.display = 'flex';
    ri.textContent   = '✓';
    rt.textContent   = `¡Cadena ACEPTADA! — Estado final: ${state}`;
  } else {
    rb.className     = 'result-bar rejected';
    rb.style.display = 'flex';
    ri.textContent   = '✗';
    rt.textContent   = `Cadena RECHAZADA — Estado inválido`;
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  resizeCanvas();
  buildInfoCards();
});
window.addEventListener('resize', resizeCanvas);
document.getElementById('chain-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') simulate();
});