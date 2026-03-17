import { Board } from './board';
import { Piece } from './piece';
import { getRandomTetrominoType } from './tetrominoes';

export class Game {
  board: Board;
  currentPiece: Piece;
  nextPiece: Piece;
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  isPaused: boolean;
  clearAnim: { rows: number[]; startTime: number; duration: number } | null = null;

  // hooks for UI updates
  onScoreChange?: (score: number, level: number) => void;
  onGameOver?: (finalScore: number) => void;

  constructor() {
    this.board = new Board();
    this.currentPiece = new Piece(getRandomTetrominoType());
    this.nextPiece = new Piece(getRandomTetrominoType());
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    this.isPaused = false;
  }

  reset() {
    this.board.reset();
    this.currentPiece = new Piece(getRandomTetrominoType());
    this.nextPiece = new Piece(getRandomTetrominoType());
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.clearAnim = null;
    this.updateUI();
  }

  play() {
    if (this.isGameOver) {
      this.reset();
    }
    this.isPaused = false;
  }

  pause() {
    this.isPaused = true;
  }

  updateScore(linesCleared: number) {
    if (linesCleared > 0) {
      // Classic scoring system
      const lineScores = [0, 40, 100, 300, 1200];
      this.score += lineScores[linesCleared] * this.level;
      this.lines += linesCleared;
      
      // Level up every 10 lines
      this.level = Math.floor(this.lines / 10) + 1;
      this.updateUI();
    }
  }

  updateUI() {
    if (this.onScoreChange) {
      this.onScoreChange(this.score, this.level);
    }
  }

  movePiece(dx: number, dy: number): boolean {
    if (this.isGameOver || this.isPaused || this.clearAnim !== null) return false;

    if (this.board.isValidMove(this.currentPiece, this.currentPiece.x + dx, this.currentPiece.y + dy)) {
      this.currentPiece.move(dx, dy);
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (this.isGameOver || this.isPaused || this.clearAnim !== null) return;

    const rotatedShape = this.currentPiece.getRotatedShape();
    if (this.board.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y, rotatedShape)) {
      this.currentPiece.rotate();
    }
  }

  hardDrop() {
    if (this.isGameOver || this.isPaused || this.clearAnim !== null) return;

    while (this.movePiece(0, 1)) {
        // move down until lock
    }
    this.dropPiece(); // Lock the piece immediately
  }

  // Returns true if piece moves down, false if it locks
  dropPiece(): boolean {
    if (this.isGameOver || this.isPaused || this.clearAnim !== null) return false;

    if (this.movePiece(0, 1)) {
      return true;
    }

    // Hit bottom or another piece -> lock it
    this.board.freeze(this.currentPiece);

    const fullRows = this.board.getFullRows();
    if (fullRows.length > 0) {
      this.clearAnim = { rows: fullRows, startTime: performance.now(), duration: 300 };
      return false;
    }

    // No lines to clear — spawn next piece immediately
    this.currentPiece = this.nextPiece;
    this.nextPiece = new Piece(getRandomTetrominoType());

    // Check Game Over condition
    if (!this.board.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
      this.isGameOver = true;
      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    }

    return false;
  }

  // Advance the clear animation. Returns true when the animation is complete.
  tickClearAnim(now: number): boolean {
    if (!this.clearAnim) return true;
    if (now - this.clearAnim.startTime < this.clearAnim.duration) return false;

    // Animation done — commit the clear
    const linesCleared = this.board.clearLines();
    if (linesCleared > 0) this.updateScore(linesCleared);

    this.currentPiece = this.nextPiece;
    this.nextPiece = new Piece(getRandomTetrominoType());
    this.clearAnim = null;

    if (!this.board.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
      this.isGameOver = true;
      if (this.onGameOver) this.onGameOver(this.score);
    }

    return true;
  }
}
