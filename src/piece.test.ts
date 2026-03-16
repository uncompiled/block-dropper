import { describe, it, expect } from 'vitest';
import { Piece } from './piece';
import { COLS } from './board';
import { TETROMINOES } from './tetrominoes';

describe('piece.ts', () => {
  it('Piece should initialize correctly based on type', () => {
    const piece = new Piece('T');
    expect(piece.type).toBe('T');
    expect(piece.color).toBe(TETROMINOES['T'].color);
    expect(piece.shape).toEqual(TETROMINOES['T'].shape);
    
    // Check initial position (middle top)
    const expectedX = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
    expect(piece.x).toBe(expectedX);
    expect(piece.y).toBe(0);
  });

  it('move() should update x and y coordinates', () => {
    const piece = new Piece('I');
    const startX = piece.x;
    const startY = piece.y;

    piece.move(1, 2);
    expect(piece.x).toBe(startX + 1);
    expect(piece.y).toBe(startY + 2);
  });

  it('rotate() should update the shape matrix', () => {
    const piece = new Piece('J');
    const rotated = piece.getRotatedShape();
    
    expect(piece.shape).not.toEqual(rotated);
    piece.rotate();
    expect(piece.shape).toEqual(rotated);
  });
});
