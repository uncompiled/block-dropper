import { Piece } from './piece';

export const COLS = 10;
export const ROWS = 20;

export class Board {
  grid: (string | null)[][]; 

  constructor() {
    this.grid = this.getEmptyGrid();
  }

  getEmptyGrid(): (string | null)[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  reset(): void {
    this.grid = this.getEmptyGrid();
  }

  // Returns true if the move is valid (no collisions)
  isValidMove(piece: Piece, newX: number, newY: number, newShape?: number[][]): boolean {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = newX + x;
          const boardY = newY + y;

          // Wall collision (left, right, bottom)
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return false;
          }

          // Other pieces collision
          // We only check if it's within the board height, as it might spawn slightly above
          if (boardY >= 0 && this.grid[boardY][boardX] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Freeze the piece to the board grid
  freeze(piece: Piece): void {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          // Ensure it's inside the bounds
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            this.grid[boardY][boardX] = piece.color;
          }
        }
      }
    }
  }

  // Return indices of full rows without mutating the grid
  getFullRows(): number[] {
    const full: number[] = [];
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== null)) full.push(y);
    }
    return full;
  }

  // Clear full lines and return number of lines cleared
  clearLines(): number {
    let linesCleared = 0;
    
    // Check from bottom to top
    for (let y = ROWS - 1; y >= 0; y--) {
      let isLineFull = true;
      for (let x = 0; x < COLS; x++) {
        if (this.grid[y][x] === null) {
          isLineFull = false;
          break;
        }
      }

      if (isLineFull) {
        linesCleared++;
        // Remove the row
        this.grid.splice(y, 1);
        // Add a new empty row at the top
        this.grid.unshift(Array(COLS).fill(null));
        // Check the same row index again because rows shifted down
        y++; 
      }
    }

    return linesCleared;
  }
}
