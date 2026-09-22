export type Position = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type FoodType = 'NORMAL' | 'GOLDEN';

export interface Food {
  position: Position;
  type: FoodType;
  points: number;
  timeLeft?: number; // percentage remaining (1.0 to 0) for golden food
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}
