import { describe, it, expect } from 'vitest';
import { getRandomTetrominoType, rotateMatrix } from './tetrominoes';

describe('tetrominoes.ts', () => {
  it('getRandomTetrominoType should return a valid type repeatedly', () => {
    const validTypes = new Set(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
    for (let i = 0; i < 50; i++) {
      const type = getRandomTetrominoType();
      expect(validTypes.has(type)).toBe(true);
    }
  });

  it('rotateMatrix should rotate a square matrix 90 degrees clockwise', () => {
    const input = [
      [1, 2],
      [3, 4]
    ];
    const expected = [
      [3, 1],
      [4, 2]
    ];
    const result = rotateMatrix(input);
    expect(result).toEqual(expected);
  });

  it('rotateMatrix should not mutate the original matrix', () => {
    const input = [
      [1, 2],
      [3, 4]
    ];
    rotateMatrix(input);
    expect(input).toEqual([
      [1, 2],
      [3, 4]
    ]);
  });
});
