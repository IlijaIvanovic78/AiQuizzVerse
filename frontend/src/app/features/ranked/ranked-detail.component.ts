import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { RankedActions, selectCurrentJourney, selectRankedLoading } from '../../store/ranked';
import { GameActions } from '../../store/game/game.actions';
import { RankedStage } from '../../models';

const DIFFICULTY_BG: Record<string, string> = {
  EASY: 'from-green-600 to-green-800',
  MEDIUM: 'from-yellow-600 to-yellow-800',
  HARD: 'from-orange-600 to-orange-800',
  EXPERT: 'from-red-600 to-red-800',
};

const DIFFICULTY_BORDER: Record<string, string> = {
  EASY: 'border-green-500 shadow-green-500/30',
  MEDIUM: 'border-yellow-500 shadow-yellow-500/30',
  HARD: 'border-orange-500 shadow-orange-500/30',
  EXPERT: 'border-red-500 shadow-red-500/30',
};

const DIFFICULTY_TEXT: Record<string, string> = {
  EASY: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HARD: 'text-orange-400',
  EXPERT: 'text-red-400',
};

@Component({
  selector: 'app-ranked-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen p-6 flex flex-col">
      @let journey = journey$ | async;
      @if (journey) {
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <button (click)="goBack()" class="text-gray-400 hover:text-white transition-colors text-lg flex-shrink-0">← Back</button>
          <div class="flex-1 text-center">
            <h1 class="text-3xl font-pixel text-white">{{ journey.topic }}</h1>
            <p class="font-retro text-sm text-dark-400 mt-1">
              {{ journey.currentStage }} / {{ journey.totalStages }} stages cleared
              @if (journey.isCompleted) {
                <span class="ml-2 text-yellow-400 font-bold">🏆 Journey Complete!</span>
              }
            </p>
          </div>
        </div>

        <!-- Roadmap: full-width, nodes spread evenly with zigzag -->
        <div class="flex-1 flex items-center relative px-4">
          <!-- SVG connecting path -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
            @for (stage of journey.stages; track stage.id; let i = $index; let last = $last) {
              @if (!last) {
                <line
                  [attr.x1]="getNodeX(i, journey.stages.length) + '%'"
                  [attr.y1]="getNodeY(i) + '%'"
                  [attr.x2]="getNodeX(i + 1, journey.stages.length) + '%'"
                  [attr.y2]="getNodeY(i + 1) + '%'"
                  [attr.stroke]="stage.isCompleted && journey.stages[i+1].isCompleted ? '#22c55e' : stage.isCompleted ? '#4f46e5' : '#334155'"
                  stroke-width="3"
                  stroke-dasharray="8 4"
                />
              }
            }
          </svg>

          <!-- Nodes -->
          @for (stage of journey.stages; track stage.id; let i = $index) {
            <div class="absolute flex flex-col items-center z-10"
                 [style.left]="getNodeX(i, journey.stages.length) + '%'"
                 [style.top]="getNodeY(i) + '%'"
                 style="transform: translate(-50%, -50%);">

              <!-- Reward badge -->
              @if (stage.earnedReward) {
                <div class="absolute -top-9 px-2 py-0.5 rounded-full text-[10px] font-retro bg-dark-700/80 text-yellow-300 border border-yellow-500/30 whitespace-nowrap">
                  +{{ stage.earnedReward.amount }} {{ stage.earnedReward.type }}
                </div>
              }

              <!-- Round node -->
              <button
                (click)="playStage(stage)"
                [disabled]="!isPlayable(stage, journey.stages)"
                class="w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-lg"
                [class]="getNodeClasses(stage, journey.stages)">

                @if (stage.isCompleted) {
                  <span class="text-2xl">✓</span>
                } @else if (isPlayable(stage, journey.stages)) {
                  <span class="font-pixel text-xl text-white">{{ stage.stageNumber }}</span>
                } @else {
                  <span class="text-2xl">🔒</span>
                }
              </button>

              <!-- Difficulty label -->
              <span class="mt-2 font-retro text-[10px] whitespace-nowrap"
                    [class]="diffTextColor(stage.difficulty)">
                {{ stage.difficulty }}
              </span>

              <!-- Score -->
              @if (stage.isCompleted && stage.score !== null) {
                <span class="font-retro text-[10px] text-yellow-400/80 whitespace-nowrap">
                  {{ stage.score }} pts
                </span>
              }
            </div>
          }
        </div>
      } @else if (loading$ | async) {
        <div class="text-center py-12 text-gray-500 font-retro">Loading journey...</div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    button:not(:disabled):hover { transform: scale(1.15); }
    button:disabled { cursor: default; }
    @keyframes node-glow {
      0%, 100% { box-shadow: 0 0 8px 2px rgba(124,58,237,0.4); }
      50% { box-shadow: 0 0 20px 6px rgba(124,58,237,0.7); }
    }
    .animate-node-glow {
      animation: node-glow 2s ease-in-out infinite;
    }
  `],
})
export class RankedDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** When set, the component runs in embedded mode (inside dashboard tab). */
  @Input() journeyId: string | null = null;
  /** Emitted when user clicks Back in embedded mode. */
  @Output() back = new EventEmitter<void>();

  journey$ = this.store.select(selectCurrentJourney);
  loading$ = this.store.select(selectRankedLoading);

  ngOnInit() {
    const id = this.journeyId || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(RankedActions.loadJourney({ id }));
    }
  }

  isPlayable(stage: RankedStage, stages: RankedStage[]): boolean {
    if (stage.isCompleted) return false;
    if (stage.stageNumber === 1) return true;
    const prev = stages.find((s) => s.stageNumber === stage.stageNumber - 1);
    return prev?.isCompleted ?? false;
  }

  getNodeClasses(stage: RankedStage, stages: RankedStage[]): string {
    if (stage.isCompleted) {
      return 'bg-gradient-to-br from-green-500 to-green-700 border-green-400 text-white shadow-green-500/40';
    }
    if (this.isPlayable(stage, stages)) {
      const bg = DIFFICULTY_BG[stage.difficulty] || 'from-indigo-600 to-indigo-800';
      const border = DIFFICULTY_BORDER[stage.difficulty] || 'border-indigo-500';
      return `bg-gradient-to-br ${bg} ${border} text-white animate-node-glow`;
    }
    return 'bg-dark-800 border-dark-600 text-dark-500';
  }

  diffTextColor(difficulty: string): string {
    return DIFFICULTY_TEXT[difficulty] || 'text-gray-400';
  }

  /** Spread nodes evenly from left to right (5% to 95%) */
  getNodeX(index: number, total: number): number {
    if (total <= 1) return 50;
    return 5 + (index / (total - 1)) * 90;
  }

  /** Zigzag: alternate between 38% and 62% vertically */
  getNodeY(index: number): number {
    return index % 2 === 0 ? 38 : 62;
  }

  playStage(stage: RankedStage) {
    if (stage.quizId) {
      this.store.dispatch(GameActions.createMatch({
        quizId: stage.quizId,
        matchType: 'SOLO',
        rankedContext: { journeyId: stage.journeyId, stageId: stage.id },
      }));
    }
  }

  goBack() {
    if (this.journeyId) {
      this.back.emit();
    } else {
      this.router.navigate(['/ranked']);
    }
  }
}
