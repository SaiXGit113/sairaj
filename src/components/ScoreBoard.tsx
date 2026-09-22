import React from 'react';
import { Trophy, Volume2, VolumeX, ShieldAlert, Sparkles, Pause, Play } from 'lucide-react';
import type { Difficulty, GameStatus } from '../types';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  snakeLength: number;
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  hasWrapWalls: boolean;
  onToggleWalls: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  status: GameStatus;
  onTogglePause: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  snakeLength,
  difficulty,
  onSelectDifficulty,
  hasWrapWalls,
  onToggleWalls,
  isMuted,
  onToggleMute,
  status,
  onTogglePause,
}) => {
  return (
    <div id="game-scoreboard-panel" className="w-full max-w-[440px] mx-auto space-y-3">
      {/* Primary Score Row */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Score
            </span>
            <span
              id="current-score-display"
              className="text-2xl font-black text-emerald-400 tabular-nums leading-tight"
            >
              {score}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Best
            </span>
            <span
              id="high-score-display"
              className="text-2xl font-black text-amber-400 tabular-nums leading-tight"
            >
              {highScore}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800" />

        <div className="flex flex-col text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Length
          </span>
          <span className="text-xl font-bold text-slate-200 tabular-nums leading-tight">
            {snakeLength}
          </span>
        </div>
      </div>

      {/* Control bar: Speed, Wall Mode, Sound, Pause */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Difficulty Selector */}
        <div
          id="difficulty-selector-group"
          className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1"
        >
          {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map((level) => {
            const isActive = difficulty === level;
            return (
              <button
                key={level}
                id={`btn-difficulty-${level.toLowerCase()}`}
                type="button"
                onClick={() => onSelectDifficulty(level)}
                disabled={status === 'PLAYING'}
                className={`px-2.5 py-1 rounded font-medium transition-all text-[11px] ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {level === 'EASY' ? 'Slow' : level === 'NORMAL' ? 'Norm' : 'Fast'}
              </button>
            );
          })}
        </div>

        {/* Action icons: Wall wrap, Mute, Pause */}
        <div className="flex items-center gap-1.5">
          {/* Wall Mode Toggle */}
          <button
            id="btn-toggle-walls"
            type="button"
            onClick={onToggleWalls}
            title={hasWrapWalls ? 'Mode: Wrap-around Edges' : 'Mode: Solid Wall Collision'}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-medium ${
              hasWrapWalls
                ? 'bg-blue-950/60 border-blue-800/80 text-blue-400'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-400'
            }`}
          >
            {hasWrapWalls ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wrap</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Walls</span>
              </>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            id="btn-toggle-audio"
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause / Resume Button */}
          <button
            id="btn-toggle-pause"
            type="button"
            onClick={onTogglePause}
            disabled={status === 'IDLE' || status === 'GAME_OVER'}
            title={status === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'PAUSED' ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
