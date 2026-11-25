(() => {
  'use strict';

  const WIDTH = 10;
  const HEIGHT = 20;
  const CELL = 30;
  const COLORS = {
    I: '#56dce9', O: '#f5d45d', T: '#c58afa', S: '#a2e36e',
    Z: '#f57982', J: '#729bff', L: '#ffab63'
  };
  const SHAPES = {
    I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]]],
    O: [[[1,0],[2,0],[1,1],[2,1]]],
    T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
    S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]]],
    Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]]],
    J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
    L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]]
  };
  const TYPES = Object.keys(SHAPES);
  const boardCanvas = document.getElementById('game-board');
  const boardContext = boardCanvas.getContext('2d');
  const nextCanvas = document.getElementById('next-board');
  const nextContext = nextCanvas.getContext('2d');
  const overlay = document.getElementById('screen-overlay');
  const overlayContent = document.getElementById('overlay-content');
  const ui = {
    score: document.getElementById('score'), level: document.getElementById('level'),
    lines: document.getElementById('lines'), best: document.getElementById('best-score'),
    count: document.getElementById('piece-count')
  };

  let phase = 'start';
  let board = createBoard();
  let active = null;
  let nextType = null;
  let score = 0;
  let lines = 0;
  let pieces = 0;
  let dropElapsed = 0;
  let lastFrame = 0;
  let rafId = 0;
  let audioEnabled = false;
  let audioContext = null;
  let best = readBest();

  function createBoard() {
    return Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null));
  }

  function readBest() {
    try { return Number(localStorage.getItem('block-fall-best')) || 0; }
    catch (_) { return 0; }
  }

  function saveBest() {
    try { localStorage.setItem('block-fall-best', String(best)); }
    catch (_) { /* Storage may be disabled; the current run still works. */ }
  }

  function formatNumber(value) {
    return String(value).padStart(6, '0');
  }

  function level() {
    return Math.floor(lines / 10) + 1;
  }

  function dropInterval() {
    return Math.max(85, 820 * Math.pow(0.82, level() - 1));
  }

  function shapeFor(piece, rotation = piece.rotation) {
    const rotations = SHAPES[piece.type];
    return rotations[((rotation % rotations.length) + rotations.length) % rotations.length];
  }

  function canPlace(piece, x, y, rotation = piece.rotation) {
    return shapeFor(piece, rotation).every(([dx, dy]) => {
      const column = x + dx;
      const row = y + dy;
      return column >= 0 && column < WIDTH && row < HEIGHT &&
        (row < 0 || board[row][column] === null);
    });
  }

  function makePiece(type) {
    return { type, x: type === 'I' ? 3 : 3, y: -1, rotation: 0 };
  }

  function randomType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function spawnPiece() {
    const type = nextType || randomType();
    nextType = randomType();
    active = makePiece(type);
    pieces += 1;
    ui.count.textContent = String(pieces).padStart(2, '0');
    renderNext();
    if (!canPlace(active, active.x, active.y)) endGame();
  }

  function startGame() {
    board = createBoard();
    active = null;
    nextType = randomType();
    score = 0;
    lines = 0;
    pieces = 0;
    dropElapsed = 0;
    lastFrame = 0;
    phase = 'playing';
    hideOverlay();
    updateStats();
    spawnPiece();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
  }

  function togglePause() {
    if (phase === 'playing') {
      phase = 'paused';
      showOverlay('paused');
      draw();
    } else if (phase === 'paused') {
      phase = 'playing';
      hideOverlay();
      lastFrame = 0;
      rafId = requestAnimationFrame(frame);
    }
  }

  function showOverlay(screen) {
    const screens = {
      start: {
        kicker: 'A LITTLE SPACE TO PLAY', title: 'READY<br>WHEN YOU ARE.',
        copy: 'Stack the shapes. Clear the lines.<br>Find your flow.', button: 'START GAME', hint: 'PRESS ENTER TO BEGIN'
      },
      paused: {
        kicker: 'TAKE YOUR TIME', title: 'GAME<br>PAUSED.',
        copy: 'Your next move can wait.', button: 'RESUME GAME', hint: 'PRESS P OR ESC TO RESUME'
      },
      over: {
        kicker: 'RUN COMPLETE', title: 'GAME<br>OVER.',
        copy: `FINAL SCORE &nbsp; ${formatNumber(score)}<br>YOU CLEARED ${lines} LINES.`, button: 'PLAY AGAIN', hint: 'PRESS ENTER TO PLAY AGAIN'
      }
    };
    const data = screens[screen];
    overlayContent.innerHTML = `<p class="overlay-kicker">${data.kicker}</p><h1 class="overlay-title">${data.title}</h1><p class="overlay-copy">${data.copy}</p><button class="game-button" id="overlay-action" type="button">${data.button} <span aria-hidden="true">↗</span></button><span class="overlay-hint">${data.hint}</span>`;
    document.getElementById('overlay-action').addEventListener('click', () => {
      if (screen === 'paused') togglePause(); else startGame();
    });
    overlay.hidden = false;
  }

  function hideOverlay() {
    overlay.hidden = true;
  }

  function endGame() {
    phase = 'over';
    if (score > best) {
      best = score;
      saveBest();
      ui.best.textContent = formatNumber(best);
    }
    showOverlay('over');
    draw();
  }

  function updateStats() {
    ui.score.textContent = formatNumber(score);
    ui.level.textContent = String(level()).padStart(2, '0');
    ui.lines.textContent = String(lines).padStart(2, '0');
    ui.best.textContent = formatNumber(best);
  }

  function move(dx) {
    if (phase !== 'playing' || !canPlace(active, active.x + dx, active.y)) return false;
    active.x += dx;
    playTone(240, 0.025);
    return true;
  }

  function rotate() {
    if (phase !== 'playing') return;
    const rotated = (active.rotation + 1) % SHAPES[active.type].length;
    for (const offset of [0, -1, 1, -2, 2]) {
      if (canPlace(active, active.x + offset, active.y, rotated)) {
        active.x += offset;
        active.rotation = rotated;
        playTone(330, 0.045);
        return;
      }
    }
  }

  function softDrop() {
    if (phase !== 'playing') return;
    if (canPlace(active, active.x, active.y + 1)) {
      active.y += 1;
      score += 1;
      updateStats();
      playTone(175, 0.018);
    } else lockPiece();
    dropElapsed = 0;
  }

  function hardDrop() {
    if (phase !== 'playing') return;
    let distance = 0;
    while (canPlace(active, active.x, active.y + 1)) {
      active.y += 1;
      distance += 1;
    }
    score += distance * 2;
    playTone(100, 0.1);
    lockPiece();
  }

  function lockPiece() {
    for (const [dx, dy] of shapeFor(active)) {
      const row = active.y + dy;
      const column = active.x + dx;
      if (row < 0) {
        endGame();
        return;
      }
      board[row][column] = active.type;
    }
    const cleared = clearLines();
    if (cleared > 0) {
      const base = [0, 100, 300, 500, 800][cleared] || 0;
      score += base * level();
      lines += cleared;
      playTone(cleared === 4 ? 660 : 490, 0.12);
    }
    updateStats();
    spawnPiece();
  }

  function clearLines() {
    const full = board.reduce((count, row) => count + (row.every(Boolean) ? 1 : 0), 0);
    if (!full) return 0;
    const remaining = board.filter(row => !row.every(Boolean));
    board = Array.from({ length: full }, () => Array(WIDTH).fill(null)).concat(remaining);
    return full;
  }

  function renderNext() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextType) return;
    const shape = SHAPES[nextType][0];
    const minX = Math.min(...shape.map(([x]) => x));
    const maxX = Math.max(...shape.map(([x]) => x));
    const minY = Math.min(...shape.map(([, y]) => y));
    const maxY = Math.max(...shape.map(([, y]) => y));
    const unit = 26;
    const originX = (nextCanvas.width - (maxX - minX + 1) * unit) / 2 - minX * unit;
    const originY = (nextCanvas.height - (maxY - minY + 1) * unit) / 2 - minY * unit;
    for (const [x, y] of shape) drawCell(nextContext, originX + x * unit, originY + y * unit, unit, COLORS[nextType]);
  }

  function drawCell(context, x, y, size, color, ghost = false) {
    context.save();
    context.globalAlpha = ghost ? 0.3 : 1;
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, size - 2, size - 2);
    context.fillStyle = ghost ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.25)';
    context.fillRect(x + 3, y + 3, size - 6, Math.max(2, size * 0.12));
    context.fillStyle = ghost ? 'rgba(0,0,0,.2)' : 'rgba(0,0,0,.2)';
    context.fillRect(x + 2, y + size - 5, size - 4, 3);
    context.restore();
  }

  function draw() {
    boardContext.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardContext.fillStyle = '#101725';
    boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardContext.strokeStyle = 'rgba(151, 171, 206, .08)';
    boardContext.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += 1) {
      boardContext.beginPath(); boardContext.moveTo(x * CELL + .5, 0); boardContext.lineTo(x * CELL + .5, HEIGHT * CELL); boardContext.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += 1) {
      boardContext.beginPath(); boardContext.moveTo(0, y * CELL + .5); boardContext.lineTo(WIDTH * CELL, y * CELL + .5); boardContext.stroke();
    }
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (board[y][x]) drawCell(boardContext, x * CELL, y * CELL, CELL, COLORS[board[y][x]]);
      }
    }
    if (!active) return;
    let ghostY = active.y;
    while (canPlace(active, active.x, ghostY + 1)) ghostY += 1;
    for (const [dx, dy] of shapeFor(active)) {
      if (ghostY + dy >= 0) drawCell(boardContext, (active.x + dx) * CELL, (ghostY + dy) * CELL, CELL, COLORS[active.type], true);
    }
    for (const [dx, dy] of shapeFor(active)) {
      const row = active.y + dy;
      if (row >= 0) drawCell(boardContext, (active.x + dx) * CELL, row * CELL, CELL, COLORS[active.type]);
    }
  }

  function frame(timestamp) {
    if (phase !== 'playing') return;
    if (lastFrame === 0) lastFrame = timestamp;
    const elapsed = Math.min(timestamp - lastFrame, 100);
    lastFrame = timestamp;
    dropElapsed += elapsed;
    if (dropElapsed >= dropInterval()) {
      if (canPlace(active, active.x, active.y + 1)) active.y += 1;
      else lockPiece();
      dropElapsed = 0;
    }
    draw();
    if (phase === 'playing') rafId = requestAnimationFrame(frame);
  }

  function playTone(frequency, duration) {
    if (!audioEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* Audio is optional; gameplay must not depend on it. */ }
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    const handled = ['arrowleft','arrowright','arrowup','arrowdown',' ','a','d','w','x','s','p','escape','enter'];
    if (handled.includes(key)) event.preventDefault();
    if (key === 'enter' && (phase === 'start' || phase === 'over')) { startGame(); return; }
    if (key === 'p' || key === 'escape') {
      if (phase === 'playing' || phase === 'paused') togglePause();
      return;
    }
    if (key === 'arrowleft' || key === 'a') move(-1);
    else if (key === 'arrowright' || key === 'd') move(1);
    else if (key === 'arrowup' || key === 'w' || key === 'x') rotate();
    else if (key === 'arrowdown' || key === 's') softDrop();
    else if (key === ' ') hardDrop();
  }

  document.addEventListener('keydown', handleKey);
  document.getElementById('sound-toggle').addEventListener('click', event => {
    audioEnabled = !audioEnabled;
    event.currentTarget.setAttribute('aria-pressed', String(audioEnabled));
    document.getElementById('sound-label').textContent = audioEnabled ? 'SOUND ON' : 'SOUND OFF';
    if (audioEnabled) playTone(440, 0.08);
  });
  window.addEventListener('blur', () => { if (phase === 'playing') togglePause(); });

  ui.best.textContent = formatNumber(best);
  updateStats();
  renderNext();
  draw();
  showOverlay('start');
})();
