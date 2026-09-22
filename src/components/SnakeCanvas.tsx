import React, { useEffect, useRef } from 'react';
import type { Position, Direction, Food, Particle, GameStatus } from '../types';

interface SnakeCanvasProps {
  gridSize: number;
  snake: Position[];
  direction: Direction;
  food: Food | null;
  particles: Particle[];
  status: GameStatus;
  hasWrapWalls: boolean;
  onCanvasClick?: () => void;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  gridSize,
  snake,
  direction,
  food,
  particles,
  status,
  hasWrapWalls,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 400;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cellSize = size / gridSize;

    // 1. Draw Background & Subtle Grid Pattern
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, size, size);

    // Subtle checkerboard pattern
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Grid boundary indicator (if walls are solid vs wrap)
    if (!hasWrapWalls) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
    } else {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, size - 2, size - 2);
    }

    // 2. Draw Food
    if (food) {
      const fx = food.position.x * cellSize;
      const fy = food.position.y * cellSize;
      const centerX = fx + cellSize / 2;
      const centerY = fy + cellSize / 2;
      const radius = cellSize * 0.42;

      ctx.save();

      if (food.type === 'GOLDEN') {
        // Golden glowing bonus food
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 14;

        // Circular timer indicator
        if (food.timeLeft !== undefined) {
          ctx.beginPath();
          ctx.arc(
            centerX,
            centerY,
            radius + 3,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * food.timeLeft,
            false
          );
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Golden body
        const grad = ctx.createRadialGradient(
          centerX - radius * 0.3,
          centerY - radius * 0.3,
          radius * 0.1,
          centerX,
          centerY,
          radius
        );
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.6, '#f59e0b');
        grad.addColorStop(1, '#b45309');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer star in the middle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Classic Juicy Apple
        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 10;

        const grad = ctx.createRadialGradient(
          centerX - radius * 0.3,
          centerY - radius * 0.3,
          radius * 0.1,
          centerX,
          centerY,
          radius
        );
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#991b1b');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 1, radius, 0, Math.PI * 2);
        ctx.fill();

        // Apple stem & little leaf
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius + 2);
        ctx.quadraticCurveTo(centerX + 3, centerY - radius - 4, centerX + 1, centerY - radius - 5);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY - radius - 2, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Highlight glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 3. Draw Snake
    const snakeLen = snake.length;
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const isTail = index === snakeLen - 1;
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1.5;

      ctx.save();

      if (status === 'GAME_OVER') {
        ctx.fillStyle = isHead ? '#ef4444' : '#64748b';
      } else if (isHead) {
        // Bright emerald head
        ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#10b981';
      } else {
        // Tapering gradient for body segments
        const progress = index / Math.max(1, snakeLen);
        // From vibrant emerald to rich teal
        const rVal = Math.round(16 + progress * (13 - 16));
        const gVal = Math.round(185 - progress * 40);
        const bVal = Math.round(129 - progress * 20);
        ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
      }

      // Draw rounded rectangle for segment
      const cornerRadius = isHead ? cellSize * 0.45 : isTail ? cellSize * 0.4 : cellSize * 0.25;
      const segWidth = cellSize - padding * 2;
      const segHeight = cellSize - padding * 2;

      ctx.beginPath();
      ctx.roundRect(x + padding, y + padding, segWidth, segHeight, cornerRadius);
      ctx.fill();

      // If it's the head, draw eyes looking in current direction
      if (isHead) {
        ctx.shadowBlur = 0;
        const eyeRadius = cellSize * 0.14;
        const pupilRadius = cellSize * 0.08;

        let leftEyeX = 0;
        let leftEyeY = 0;
        let rightEyeX = 0;
        let rightEyeY = 0;
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;

        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        const eyeDist = cellSize * 0.25;
        const forwardOffset = cellSize * 0.18;

        if (direction === 'UP') {
          leftEyeX = cx - eyeDist;
          rightEyeX = cx + eyeDist;
          leftEyeY = cy - forwardOffset;
          rightEyeY = cy - forwardOffset;
          pupilOffsetY = -1.5;
        } else if (direction === 'DOWN') {
          leftEyeX = cx + eyeDist;
          rightEyeX = cx - eyeDist;
          leftEyeY = cy + forwardOffset;
          rightEyeY = cy + forwardOffset;
          pupilOffsetY = 1.5;
        } else if (direction === 'LEFT') {
          leftEyeX = cx - forwardOffset;
          rightEyeX = cx - forwardOffset;
          leftEyeY = cy - eyeDist;
          rightEyeY = cy + eyeDist;
          pupilOffsetX = -1.5;
        } else if (direction === 'RIGHT') {
          leftEyeX = cx + forwardOffset;
          rightEyeX = cx + forwardOffset;
          leftEyeY = cy + eyeDist;
          rightEyeY = cy - eyeDist;
          pupilOffsetX = 1.5;
        }

        // Eyeball whites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = status === 'GAME_OVER' ? '#991b1b' : '#0f172a';
        ctx.beginPath();
        ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 4. Draw Particles (Bursts from eaten food)
    particles.forEach((p) => {
      ctx.save();
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }, [gridSize, snake, direction, food, particles, status, hasWrapWalls]);

  return (
    <div
      id="snake-canvas-container"
      onClick={onCanvasClick}
      className="relative w-full max-w-[440px] aspect-square mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center cursor-pointer select-none"
    >
      <canvas
        ref={canvasRef}
        id="snake-game-canvas"
        className="w-full h-full block"
      />
    </div>
  );
};
