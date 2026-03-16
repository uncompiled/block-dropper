import { describe, it, expect, beforeEach } from 'vitest';
import { Board, COLS, ROWS } from './board';
import { Piece } from './piece';

describe('board.ts', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('should initialize with an empty grid of correct dimensions', () => {
    expect(board.grid.length).toBe(ROWS);
    expect(board.grid[0].length).toBe(COLS);
    
    // Check it's totally empty (nulls)
    let isEmpty = true;
    board.grid.forEach(row => {
      row.forEach(cell => {
        if (cell !== null) isEmpty = false;
      });
    });
    expect(isEmpty).toBe(true);
  });

  it('reset() should clear the grid', () => {
    board.grid[0][0] = 'red';
    board.reset();
    expect(board.grid[0][0]).toBeNull();
  });

  it('isValidMove() should detect wall collisions', () => {
    const piece = new Piece('O'); // 2x2 shape
    
    // Left boundary
    expect(board.isValidMove(piece, -1, 0)).toBe(false);
    
    // Right boundary
    expect(board.isValidMove(piece, COLS - 1, 0)).toBe(false);
    
    // Bottom boundary
    expect(board.isValidMove(piece, 0, ROWS)).toBe(false);
    
    // Valid move within bounds
    expect(board.isValidMove(piece, 0, 0)).toBe(true);
  });

  it('isValidMove() should detect collisions with other pieces', () => {
    const piece = new Piece('O'); 
    
    // Force a block onto the board at 0, 0
    board.grid[0][0] = 'blue';

    // Trying to move the 'O' piece (which uses 0,0 and 1,0 at its top row) into 0,0
    expect(board.isValidMove(piece, 0, 0)).toBe(false);
    // Move it to the right
    expect(board.isValidMove(piece, 2, 0)).toBe(true);
  });

  it('freeze() should save the piece shape to the board grid', () => {
    const piece = new Piece('I');
    piece.x = 0;
    piece.y = 19; // Bottom row (since 'I' shape has empty first row, its blocks are on local y=1)

    board.freeze(piece);
    // 'I' shape second line has 4 ones
    expect(board.grid[20]).toBeUndefined(); // Wait, let's just check the grid cells directly
    
    // Let's spawn an 'O' piece at the bottom-left to be predictable
    const oPiece = new Piece('O');
    oPiece.x = 0;
    oPiece.y = Math.max(0, ROWS - 2); 
    
    board.freeze(oPiece);
    expect(board.grid[ROWS - 2][0]).toBe(oPiece.color);
    expect(board.grid[ROWS - 2][1]).toBe(oPiece.color);
    expect(board.grid[ROWS - 1][0]).toBe(oPiece.color);
    expect(board.grid[ROWS - 1][1]).toBe(oPiece.color);
  });

  it('clearLines() should clear full lines and return the number of cleared lines', () => {
    // Fill the bottom two rows
    board.grid[ROWS - 1].fill('red');
    board.grid[ROWS - 2].fill('blue');

    const linesCleared = board.clearLines();
    expect(linesCleared).toBe(2);

    // The bottom row should now be empty (since it was replaced by new empty rows from the top)
    expect(board.grid[ROWS - 1][0]).toBeNull();
    // Total rows still the same
    expect(board.grid.length).toBe(ROWS);
  });
});
