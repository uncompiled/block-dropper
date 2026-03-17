import { Game } from './game';
import { COLS, ROWS } from './board';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  nextCtx: CanvasRenderingContext2D;
  blockSize: number;

  constructor(ctx: CanvasRenderingContext2D, nextCtx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.nextCtx = nextCtx;
    // Calculate size dynamically based on canvas
    this.blockSize = this.ctx.canvas.width / COLS;
  }

  draw(game: Game) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.drawBoard(game.board.grid);

    if (game.clearAnim !== null) {
      this.drawWipeOverlay(game.clearAnim);
    } else if (!game.isGameOver) {
      // Draw ghost piece (optional feature, maybe implementing later)
      this.drawPiece(this.ctx, game.currentPiece.shape, game.currentPiece.x, game.currentPiece.y, game.currentPiece.color);
    }

    this.drawNextPiece(game.nextPiece.shape, game.nextPiece.color);
  }

  private drawWipeOverlay(anim: { rows: number[]; startTime: number; duration: number }) {
    const progress = Math.min(1, (performance.now() - anim.startTime) / anim.duration);
    const erasedFromEachSide = Math.floor(progress * (COLS / 2));
    for (const row of anim.rows) {
      for (let col = 0; col < COLS; col++) {
        if (Math.floor(Math.abs(col - 4.5)) < erasedFromEachSide) {
          this.ctx.clearRect(col * this.blockSize, row * this.blockSize, this.blockSize, this.blockSize);
        }
      }
    }
  }

  drawBoard(grid: (string | null)[][]) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x]) {
          this.drawBlock(this.ctx, x, y, grid[y][x]!);
        }
      }
    }
  }

  drawPiece(ctx: CanvasRenderingContext2D, shape: number[][], offsetX: number, offsetY: number, color: string) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          this.drawBlock(ctx, offsetX + x, offsetY + y, color);
        }
      }
    }
  }

  drawNextPiece(shape: number[][], color: string) {
    this.nextCtx.clearRect(0, 0, this.nextCtx.canvas.width, this.nextCtx.canvas.height);
    
    const blockSize = 30; // standard display size for next canvas
    const offsetX = (this.nextCtx.canvas.width - shape[0].length * blockSize) / 2 / blockSize;
    const offsetY = (this.nextCtx.canvas.height - shape.length * blockSize) / 2 / blockSize;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
            const posX = (offsetX + x) * blockSize;
            const posY = (offsetY + y) * blockSize;
            
            // Draw custom block inline to avoid ctx logic duplication
            this.nextCtx.fillStyle = color;
            this.nextCtx.fillRect(posX, posY, blockSize, blockSize);

            this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.nextCtx.fillRect(posX, posY, blockSize, 4);
            this.nextCtx.fillRect(posX, posY, 4, blockSize);

            this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.nextCtx.fillRect(posX, posY + blockSize - 4, blockSize, 4);
            this.nextCtx.fillRect(posX + blockSize - 4, posY, 4, blockSize);

            this.nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.nextCtx.strokeRect(posX, posY, blockSize, blockSize);
        }
      }
    }
  }

  drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    const px = x * this.blockSize;
    const py = y * this.blockSize;
    
    ctx.fillStyle = color;
    ctx.fillRect(px, py, this.blockSize, this.blockSize);

    // Bevel effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px, py, this.blockSize, 4);
    ctx.fillRect(px, py, 4, this.blockSize);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px, py + this.blockSize - 4, this.blockSize, 4);
    ctx.fillRect(px + this.blockSize - 4, py, 4, this.blockSize);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeRect(px, py, this.blockSize, this.blockSize);
  }
}
