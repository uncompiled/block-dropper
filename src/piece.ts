import { TETROMINOES, rotateMatrix } from './tetrominoes';
import type { TetrominoType } from './tetrominoes';
import { COLS } from './board';

export class Piece {
  type: TetrominoType;
  shape: number[][];
  color: string;
  x: number;
  y: number;

  constructor(type: TetrominoType) {
    this.type = type;
    this.shape = TETROMINOES[type].shape;
    this.color = TETROMINOES[type].color;
    
    // Spawn in the middle top
    this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
    // Standard tetris starts pieces hidden above the board. Since our arrays are 0-indexed,
    // let's just start it at y=0 or a negative value. We'll start at 0 for simplicity.
    this.y = 0; 
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  rotate() {
    this.shape = rotateMatrix(this.shape);
  }

  getRotatedShape(): number[][] {
    return rotateMatrix(this.shape);
  }
}
