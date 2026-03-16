import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from './game';

describe('game.ts', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('should initialize correctly', () => {
    expect(game.score).toBe(0);
    expect(game.level).toBe(1);
    expect(game.lines).toBe(0);
    expect(game.isGameOver).toBe(false);
    expect(game.isPaused).toBe(false);
    expect(game.currentPiece).toBeDefined();
    expect(game.nextPiece).toBeDefined();
  });

  it('pause() and play() should toggle isPaused', () => {
    game.pause();
    expect(game.isPaused).toBe(true);
    
    game.play();
    expect(game.isPaused).toBe(false);
  });

  it('reset() should clear existing game state', () => {
    game.score = 100;
    game.isGameOver = true;
    game.reset();

    expect(game.score).toBe(0);
    expect(game.isGameOver).toBe(false);
  });

  it('updateScore() should calculate classic score properly', () => {
    game.updateScore(1); // 40 * level 1
    expect(game.score).toBe(40);
    expect(game.lines).toBe(1);

    game.level = 2;
    game.updateScore(4); // 1200 * level 2
    expect(game.score).toBe(40 + 2400); 
    expect(game.lines).toBe(5);
  });

  it('updateScore() should level up every 10 lines', () => {
    game.updateScore(4);
    game.updateScore(4);
    game.updateScore(2); // 10 lines total
    expect(game.level).toBe(2);

    game.updateScore(4);
    expect(game.level).toBe(2);
  });

  it('movePiece() should return true if move was valid', () => {
    const startX = game.currentPiece.x;
    const moved = game.movePiece(1, 0); // Move right
    expect(moved).toBe(true);
    expect(game.currentPiece.x).toBe(startX + 1);
  });

  it('movePiece() should not move if game is paused or over', () => {
    game.pause();
    const startX = game.currentPiece.x;
    const moved = game.movePiece(1, 0);
    expect(moved).toBe(false);
    expect(game.currentPiece.x).toBe(startX);
  });

  it('dropPiece() locks piece if it hits the bottom', () => {
    // This requires forcing the piece to the bottom
    game.currentPiece.y = 19; 
    
    // We mock clearLines so it just acts as freezing
    const freezeSpy = vi.spyOn(game.board, 'freeze');
    const dropResult = game.dropPiece();
    
    expect(dropResult).toBe(false); // Returning false means it locked
    expect(freezeSpy).toHaveBeenCalled();
  });

  it('hardDrop() forces piece to the bottom immediately', () => {
    game.hardDrop();
    // After hardDrop, a new piece is spawned, but the board grid will have pieces
    // at the bottom. We can just verify it didn't throw and the piece was swapped.
    expect(game.currentPiece).not.toBeNull();
    // Let's actually check if a freeze happened
    expect(game.board.grid.flat().some(cell => cell !== null)).toBe(true);
  });
});
