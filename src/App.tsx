/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Sparkles, Award } from 'lucide-react';
import { ScoreBoard } from './components/ScoreBoard';
import { SnakeCanvas } from './components/SnakeCanvas';
import { DpadControls } from './components/DpadControls';
import { sounds } from './utils/audio';
import type { Position, Direction, Difficulty, GameStatus, Food, Particle } from './types';

const GRID_SIZE = 20;

const SPEEDS: Record<Difficulty, number> = {
  EASY: 130,
  NORMAL: 90,
  HARD: 60,
};

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export default function App() {
  // Game Configuration & State
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('snake_high_score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const saved = localStorage.getItem('snake_difficulty') as Difficulty;
      return saved && SPEEDS[saved] ? saved : 'NORMAL';
    } catch {
      return 'NORMAL';
    }
  });

  const [hasWrapWalls, setHasWrapWalls] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('snake_wall_wrap');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('snake_audio_muted');
      const muted = saved === 'true';
      sounds.setMuted(muted);
      return muted;
    } catch {
      return false;
    }
  });

  const [food, setFood] = useState<Food | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');

  // Refs for loop & direction management to avoid stale closures
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const snakeRef = useRef<Position[]>(INITIAL_SNAKE);
  const foodRef = useRef<Food | null>(null);
  const statusRef = useRef<GameStatus>('IDLE');
  const applesEatenRef = useRef<number>(0);
  const goldenTimerRef = useRef<number | null>(null);

  // Sync refs with state
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Particle physics update loop
  useEffect(() => {
    let animId: number;
    const updateParticles = () => {
      setParticles((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.96,
            vy: p.vy * 0.96,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0);
      });
      animId = requestAnimationFrame(updateParticles);
    };
    animId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Spawn random food
  const spawnFood = useCallback((currentSnake: Position[]): Food => {
    const occupied = new Set(currentSnake.map((s) => `${s.x},${s.y}`));
    const emptyCells: Position[] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      // Board full: victory edge case
      return { position: { x: 0, y: 0 }, type: 'NORMAL', points: 10 };
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const chosenPos = emptyCells[randomIndex];

    // Every 5th apple has a 40% chance of being a golden bonus apple
    applesEatenRef.current += 1;
    const isGolden = applesEatenRef.current % 5 === 0 && Math.random() < 0.8;

    if (isGolden) {
      return {
        position: chosenPos,
        type: 'GOLDEN',
        points: 35,
        timeLeft: 1.0,
      };
    }

    return {
      position: chosenPos,
      type: 'NORMAL',
      points: 10,
    };
  }, []);

  // Spawn food particles
  const createFoodParticles = (pos: Position, isGolden: boolean) => {
    const canvasElement = document.getElementById('snake-game-canvas');
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const cellSize = rect.width / GRID_SIZE;
    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2;

    const newParticles: Particle[] = [];
    const count = isGolden ? 20 : 12;
    const colors = isGolden
      ? ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff']
      : ['#ef4444', '#f87171', '#22c55e', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.2 + Math.random() * 3.0;
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
        life: 25 + Math.floor(Math.random() * 15),
        maxLife: 40,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Safe direction changer to prevent self-collision
  const requestDirectionChange = useCallback((newDir: Direction) => {
    const cur = directionRef.current;
    if (
      (newDir === 'UP' && cur === 'DOWN') ||
      (newDir === 'DOWN' && cur === 'UP') ||
      (newDir === 'LEFT' && cur === 'RIGHT') ||
      (newDir === 'RIGHT' && cur === 'LEFT')
    ) {
      return; // Ignore opposite moves
    }
    nextDirectionRef.current = newDir;
  }, []);

  // Start / Restart game
  const startGame = useCallback(() => {
    sounds.playStart();
    const initSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(initSnake);
    snakeRef.current = initSnake;

    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';

    applesEatenRef.current = 0;
    const newFood = spawnFood(initSnake);
    setFood(newFood);
    foodRef.current = newFood;

    setScore(0);
    setIsNewHighScore(false);
    setGameOverReason('');
    setStatus('PLAYING');
    statusRef.current = 'PLAYING';
  }, [spawnFood]);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (statusRef.current === 'PLAYING') {
      setStatus('PAUSED');
    } else if (statusRef.current === 'PAUSED') {
      setStatus('PLAYING');
    }
  }, []);

  // Game Over handling
  const handleGameOver = useCallback(
    (reason: string) => {
      sounds.playGameOver();
      setStatus('GAME_OVER');
      statusRef.current = 'GAME_OVER';
      setGameOverReason(reason);

      if (goldenTimerRef.current) {
        clearInterval(goldenTimerRef.current);
      }

      setScore((finalScore) => {
        setHighScore((prevBest) => {
          if (finalScore > prevBest) {
            try {
              localStorage.setItem('snake_high_score', finalScore.toString());
            } catch {
              // Ignore storage errors
            }
            setIsNewHighScore(true);
            return finalScore;
          }
          return prevBest;
        });
        return finalScore;
      });
    },
    []
  );

  // Tick step
  const tick = useCallback(() => {
    if (statusRef.current !== 'PLAYING') return;

    const currentSnake = snakeRef.current;
    const curDir = nextDirectionRef.current;
    directionRef.current = curDir;
    setDirection(curDir);

    const head = currentSnake[0];
    let newX = head.x;
    let newY = head.y;

    if (curDir === 'UP') newY -= 1;
    else if (curDir === 'DOWN') newY += 1;
    else if (curDir === 'LEFT') newX -= 1;
    else if (curDir === 'RIGHT') newX += 1;

    // Check Wall Collisions
    if (hasWrapWalls) {
      newX = (newX + GRID_SIZE) % GRID_SIZE;
      newY = (newY + GRID_SIZE) % GRID_SIZE;
    } else {
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        handleGameOver('Crashed into the border wall!');
        return;
      }
    }

    // Check Self Collision
    const selfCollided = currentSnake.some(
      (segment, idx) => idx > 0 && segment.x === newX && segment.y === newY
    );
    if (selfCollided) {
      handleGameOver('Collided with your own tail!');
      return;
    }

    const newHead: Position = { x: newX, y: newY };
    const curFood = foodRef.current;
    const hasEatenFood = curFood && newHead.x === curFood.position.x && newHead.y === curFood.position.y;

    let updatedSnake: Position[];

    if (hasEatenFood) {
      // Eat sound & points
      if (curFood.type === 'GOLDEN') {
        sounds.playGoldenEat();
      } else {
        sounds.playEat();
      }

      createFoodParticles(curFood.position, curFood.type === 'GOLDEN');

      const pointsEarned = curFood.points;
      setScore((prev) => prev + pointsEarned);

      // If golden, add extra segment growth
      updatedSnake = [newHead, ...currentSnake];

      // Spawn next food
      const nextFood = spawnFood(updatedSnake);
      setFood(nextFood);
      foodRef.current = nextFood;
    } else {
      // Normal move: head added, tail dropped
      updatedSnake = [newHead, ...currentSnake.slice(0, -1)];
    }

    setSnake(updatedSnake);
    snakeRef.current = updatedSnake;
  }, [hasWrapWalls, handleGameOver, spawnFood]);

  // Game loop interval
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const intervalMs = SPEEDS[difficulty];
    const timer = setInterval(() => {
      tick();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status, difficulty, tick]);

  // Golden food expiration countdown
  useEffect(() => {
    if (status !== 'PLAYING' || !food || food.type !== 'GOLDEN') return;

    const durationMs = 7000;
    const intervalStep = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalStep;
      const remainingRatio = Math.max(0, 1 - elapsed / durationMs);

      if (remainingRatio <= 0) {
        clearInterval(timer);
        // Golden food expires: replace with normal apple
        const normalApple = spawnFood(snakeRef.current);
        setFood({ ...normalApple, type: 'NORMAL', points: 10 });
      } else {
        setFood((prev) => (prev && prev.type === 'GOLDEN' ? { ...prev, timeLeft: remainingRatio } : prev));
      }
    }, intervalStep);

    return () => clearInterval(timer);
  }, [status, food?.position.x, food?.position.y, food?.type, spawnFood]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling on game control keys
      const handledKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'];
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (statusRef.current === 'IDLE' || statusRef.current === 'GAME_OVER') {
          startGame();
        } else {
          togglePause();
        }
        return;
      }

      if (e.key === 'Enter' || e.code === 'KeyR') {
        if (statusRef.current === 'GAME_OVER' || statusRef.current === 'IDLE') {
          startGame();
          return;
        }
      }

      if (statusRef.current !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          requestDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          requestDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          requestDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          requestDirectionChange('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, togglePause, requestDirectionChange]);

  // Touch swipe support for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      // Tap detected: if game over or idle, start game
      if (status === 'IDLE' || status === 'GAME_OVER') {
        startGame();
      }
      return;
    }

    if (status !== 'PLAYING') return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) requestDirectionChange('RIGHT');
      else requestDirectionChange('LEFT');
    } else {
      if (dy > 0) requestDirectionChange('DOWN');
      else requestDirectionChange('UP');
    }
  };

  // Preference toggles
  const handleSelectDifficulty = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    try {
      localStorage.setItem('snake_difficulty', newDiff);
    } catch {
      // Ignore
    }
  };

  const handleToggleWalls = () => {
    setHasWrapWalls((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('snake_wall_wrap', next.toString());
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      sounds.setMuted(next);
      try {
        localStorage.setItem('snake_audio_muted', next.toString());
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div
      id="snake-app-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-3 sm:p-5 select-none font-sans"
    >
      {/* App Header */}
      <header id="snake-app-header" className="w-full max-w-[440px] flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm">
            S
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">
              Snake
            </h1>
            <span className="text-[10px] font-medium text-slate-400">
              Classic Arcade
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5">
          {status === 'PLAYING' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
          {status === 'PAUSED' && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
              Paused
            </span>
          )}
          {status === 'IDLE' && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Ready
            </span>
          )}
        </div>
      </header>

      {/* Main Game Stage */}
      <main id="snake-game-stage" className="w-full max-w-[440px] flex flex-col items-center gap-3 my-auto">
        {/* Score Board & Control Settings */}
        <ScoreBoard
          score={score}
          highScore={highScore}
          snakeLength={snake.length}
          difficulty={difficulty}
          onSelectDifficulty={handleSelectDifficulty}
          hasWrapWalls={hasWrapWalls}
          onToggleWalls={handleToggleWalls}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          status={status}
          onTogglePause={togglePause}
        />

        {/* Canvas Board with Overlays */}
        <div className="relative w-full">
          <SnakeCanvas
            gridSize={GRID_SIZE}
            snake={snake}
            direction={direction}
            food={food}
            particles={particles}
            status={status}
            hasWrapWalls={hasWrapWalls}
            onCanvasClick={() => {
              if (status === 'IDLE' || status === 'GAME_OVER') {
                startGame();
              }
            }}
          />

          {/* Idle / Start Overlay */}
          {status === 'IDLE' && (
            <div
              id="game-idle-overlay"
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg">
                <Play className="w-8 h-8 fill-emerald-400 text-emerald-400 ml-1" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                Ready to Slither?
              </h2>
              <p className="text-xs text-slate-400 max-w-[240px] mb-5">
                Use Arrow keys, WASD, touch swipe, or the on-screen D-pad.
              </p>
              <button
                id="btn-start-game"
                type="button"
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                Start Game
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {status === 'PAUSED' && (
            <div
              id="game-paused-overlay"
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                Game Suspended
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight mb-4">
                PAUSED
              </h2>
              <button
                id="btn-resume-game"
                type="button"
                onClick={togglePause}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Resume
              </button>
              <span className="text-[11px] text-slate-400 mt-3">
                Or press Spacebar
              </span>
            </div>
          )}

          {/* Game Over Overlay */}
          {status === 'GAME_OVER' && (
            <div
              id="game-over-overlay"
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200"
            >
              {isNewHighScore ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-2 animate-bounce">
                  <Award className="w-4 h-4" />
                  New Record!
                </div>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-1">
                  Game Ended
                </span>
              )}

              <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                Game Over
              </h2>
              <p className="text-xs text-rose-300/80 mb-4">{gameOverReason}</p>

              {/* Stat Card */}
              <div className="w-full max-w-[240px] bg-slate-900 border border-slate-800 rounded-xl p-3 mb-5 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Final Score
                  </span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {score}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Best
                  </span>
                  <span className="text-2xl font-black text-amber-400 tabular-nums">
                    {highScore}
                  </span>
                </div>
              </div>

              <button
                id="btn-restart-game"
                type="button"
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Mobile / Touch On-Screen D-Pad */}
        <DpadControls
          onDirectionChange={requestDirectionChange}
          disabled={status !== 'PLAYING'}
        />
      </main>

      {/* Keyboard shortcuts & instructions footer */}
      <footer id="snake-app-footer" className="w-full max-w-[440px] text-center pt-2">
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              Arrows
            </kbd>{' '}
            / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">WASD</kbd> Move
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              Space
            </kbd>{' '}
            Pause
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              R
            </kbd>{' '}
            Restart
          </span>
        </div>
      </footer>
    </div>
  );
}
