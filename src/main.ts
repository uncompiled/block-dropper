import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const nextCtx = nextCanvas.getContext('2d')!;

  const scoreEl = document.getElementById('score')!;
  const levelEl = document.getElementById('level')!;
  const finalScoreEl = document.getElementById('final-score')!;
  
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
  const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
  const resumeBtn = document.getElementById('resume-btn') as HTMLButtonElement;
  
  const gameOverScreen = document.getElementById('game-over-screen')!;
  const pauseScreen = document.getElementById('pause-screen')!;

  const game = new Game();
  const renderer = new Renderer(ctx, nextCtx);

  let animationId = 0;
  let lastTime = 0;
  let dropCounter = 0;
  let dropInterval = 1000; // ms

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
  };

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
  resumeBtn.addEventListener('click', togglePause);

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

  // Rotate on canvas tap
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (game.isPaused || game.isGameOver || startBtn.textContent === 'START GAME') return;
    game.rotatePiece();
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
        game.dropPiece();
        dropCounter = 0; // reset counter when manually dropping
        break;
      case 'ArrowUp':
        game.rotatePiece();
        break;
      case ' ':
      case 'Spacebar':
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

