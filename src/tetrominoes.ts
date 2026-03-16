// tetrominoes.ts

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  shape: number[][];
  color: string;
}

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#ED8E89'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#94C691'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#F3EBA5'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#F7B685'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#B4A8E0'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#9BD6D9'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ffafc8'
  }
};

export function getRandomTetrominoType(): TetrominoType {
  const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}

// Function to rotate a matrix 90 degrees clockwise
export function rotateMatrix(matrix: number[][]): number[][] {
  const N = matrix.length;
  // Create an empty NaaN matrix
  const result = matrix.map((row) => [...row]);

  // Transpose the matrix
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      const temp = result[i][j];
      result[i][j] = result[j][i];
      result[j][i] = temp;
    }
  }

  // Reverse each row
  for (let i = 0; i < N; i++) {
    result[i].reverse();
  }

  return result;
}
