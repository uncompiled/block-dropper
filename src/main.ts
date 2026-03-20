import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { COLS } from './board';
import { initializeGSI, triggerSignIn, getStoredUser, clearStoredUser } from './auth';
import { openDB, qualifiesForTop, saveScore, refreshScoreboard } from './scoreboard';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const nextCtx = nextCanvas.getContext('2d')!;

const scoreEl = document.getElementById('score')!;
const levelEl = document.getElementById('level')!;
const finalScoreEl = document.getElementById('final-score')!;

const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
const saveScoreBtn = document.getElementById('save-score-btn') as HTMLButtonElement;
const saveScoreMsg = document.getElementById('save-score-msg')!;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const gameOverScreen = document.getElementById('game-over-screen')!;
const pauseScreen = document.getElementById('pause-screen')!;

const game = new Game();
const renderer = new Renderer(ctx, nextCtx);

let animationId = 0;
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000; // ms

// Eagerly open the DB so the first game-over check is fast
const dbPromise = openDB();

// Initialize Google Sign-In (guard against async script race)
function tryInitGSI() {
  if (window.google?.accounts?.id) {
    initializeGSI();
  }
}
tryInitGSI();
document.getElementById('gsi-script')?.addEventListener('load', tryInitGSI);

// Show logout button if user is already signed in
if (getStoredUser()) logoutBtn.classList.remove('hidden');

logoutBtn.addEventListener('click', () => {
  clearStoredUser();
  logoutBtn.classList.add('hidden');
});

// Render scoreboard on page load
dbPromise.then(() => refreshScoreboard(3)).catch(() => { /* IndexedDB unavailable */ });

function updateLevelSpeed() {
  // Speed up as level increases
  dropInterval = Math.max(100, 1000 - (game.level - 1) * 100);
}

game.onScoreChange = (score, level) => {
  scoreEl.textContent = score.toString();
  levelEl.textContent = level.toString();
  updateLevelSpeed();
};

game.onGameOver = (finalScore) => {
  cancelAnimationFrame(animationId);
  finalScoreEl.textContent = finalScore.toString();
  gameOverScreen.classList.remove('hidden');
  startBtn.textContent = 'START GAME';

  // Reset save UI
  saveScoreBtn.classList.add('hidden');
  saveScoreBtn.disabled = false;
  saveScoreMsg.classList.add('hidden');
  saveScoreMsg.textContent = '';

  // Show logout button if user is already signed in
  if (getStoredUser()) logoutBtn.classList.remove('hidden');

  // Check if the score qualifies for top 3 (only show save button when online)
  qualifiesForTop(finalScore, 3).then((qualifies) => {
    if (qualifies && finalScore > 0 && navigator.onLine) saveScoreBtn.classList.remove('hidden');
  }).catch(() => { /* ignore DB errors */ });
};

// Hide/show save button based on connectivity while game-over screen is visible
window.addEventListener('offline', () => {
  saveScoreBtn.classList.add('hidden');
});
window.addEventListener('online', () => {
  if (!gameOverScreen.classList.contains('hidden') && !saveScoreBtn.disabled) {
    const score = parseInt(finalScoreEl.textContent ?? '0', 10);
    qualifiesForTop(score, 3).then((qualifies) => {
      if (qualifies) saveScoreBtn.classList.remove('hidden');
    }).catch(() => { /* ignore DB errors */ });
  }
});

saveScoreBtn.addEventListener('click', () => {
  saveScoreBtn.disabled = true;
  saveScoreMsg.classList.remove('hidden', 'error');
  saveScoreMsg.textContent = 'Signing in...';

  triggerSignIn().then((user) => {
    saveScoreMsg.textContent = 'Saving...';
    const score = parseInt(finalScoreEl.textContent ?? '0', 10);
    return saveScore({ username: user.name, email: user.email, score, date: new Date().toISOString() });
  }).then(() => {
    saveScoreBtn.classList.add('hidden');
    saveScoreMsg.textContent = 'Score saved!';
    return refreshScoreboard(3);
  }).catch((err: unknown) => {
    saveScoreMsg.classList.add('error');
    saveScoreMsg.textContent = err instanceof Error ? err.message : 'Sign-in failed.';
    saveScoreBtn.disabled = false;
  });
});

function update(time = 0) {
  if (game.isPaused || game.isGameOver) return;

  const deltaTime = time - lastTime;
  lastTime = time;

  if (game.clearAnim !== null) {
    game.tickClearAnim(time);
    renderer.draw(game);
    animationId = requestAnimationFrame(update);
    return;
  }

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    game.dropPiece();
    dropCounter = 0;
  }

  renderer.draw(game);
  animationId = requestAnimationFrame(update);
}

function startGame() {
  game.reset();
  updateLevelSpeed();
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  saveScoreBtn.classList.add('hidden');
  saveScoreBtn.disabled = false;
  saveScoreMsg.classList.add('hidden');
  saveScoreMsg.textContent = '';
  startBtn.textContent = 'PAUSE';

  lastTime = performance.now();
  dropCounter = 0;

  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(update);
}

function togglePause() {
  if (game.isGameOver) return;

  if (game.isPaused) {
    game.play();
    pauseScreen.classList.add('hidden');
    startBtn.textContent = 'PAUSE';
    lastTime = performance.now();
    animationId = requestAnimationFrame(update);
  } else {
    game.pause();
    pauseScreen.classList.remove('hidden');
    startBtn.textContent = 'RESUME';
    cancelAnimationFrame(animationId);
    // Redraw one last time in case they rotate and then immediately pause,
    // but renderer already reflects it so we don't necessarily have to.
  }
}

startBtn.addEventListener('click', () => {
  if (game.isGameOver || startBtn.textContent === 'START GAME') {
    startGame();
  } else {
    togglePause();
  }
  startBtn.blur();
});
restartBtn.addEventListener('click', startGame);

// Mobile Touch Controls
const setupControlBtn = (id: string, action: () => void) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // prevent zoom/scroll
    if (game.isPaused || game.isGameOver || startBtn.textContent === 'START GAME') return;
    action();
    renderer.draw(game);
  });
};

setupControlBtn('btn-left', () => game.movePiece(-1, 0));
setupControlBtn('btn-right', () => game.movePiece(1, 0));
setupControlBtn('btn-down', () => { game.dropPiece(); dropCounter = 0; });
setupControlBtn('btn-rotate', () => game.rotatePiece());
setupControlBtn('btn-drop', () => { game.hardDrop(); dropCounter = 0; });

// Swipe/tap controls on canvas
let swipeStartX = 0;
let swipeStartY = 0;
const SWIPE_THRESHOLD = 30;

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  swipeStartX = e.clientX;
  swipeStartY = e.clientY;
});

canvas.addEventListener('pointerup', (e) => {
  if (game.isPaused || game.isGameOver || startBtn.textContent === 'START GAME') return;
  const dx = e.clientX - swipeStartX;
  const dy = e.clientY - swipeStartY;

  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
    game.rotatePiece();
  } else if (Math.abs(dx) >= Math.abs(dy)) {
    const direction = dx < 0 ? -1 : 1;
    const cellsToMove = Math.round(Math.abs(dx) / (window.innerWidth / COLS));
    for (let i = 0; i < cellsToMove; i++) {
      if (!game.movePiece(direction, 0)) break;
    }
  } else if (dy > 0) {
    game.hardDrop();
    dropCounter = 0;
  }

  renderer.draw(game);
});

document.addEventListener('keydown', (e) => {
  if (game.isGameOver) return;

  if (e.key === 'p' || e.key === 'P') {
    // Only allow pausing if the game has started
    if (startBtn.textContent !== 'START GAME') {
      togglePause();
    }
    return;
  }

  if (game.isPaused || game.isGameOver) return;

  // Check if the game has started by looking at startBtn textContent
  if (startBtn.textContent === 'START GAME') return;

  switch (e.key) {
    case 'ArrowLeft':
      game.movePiece(-1, 0);
      break;
    case 'ArrowRight':
      game.movePiece(1, 0);
      break;
    case 'ArrowDown':
      e.preventDefault();
      game.dropPiece();
      dropCounter = 0; // reset counter when manually dropping
      break;
    case 'ArrowUp':
      e.preventDefault();
      game.rotatePiece();
      break;
    case ' ':
    case 'Spacebar':
      e.preventDefault();
      game.hardDrop();
      dropCounter = 0;
      break;
    default:
      return; // do not force draw if key doesn't matter
  }

  // force draw immediately to make controls feel responsive
  renderer.draw(game);
});

// Initial draw before start
renderer.draw(game);
