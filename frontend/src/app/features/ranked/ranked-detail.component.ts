import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { RankedActions, selectCurrentJourney, selectRankedLoading } from '../../store/ranked';
import { GameActions } from '../../store/game/game.actions';
import { RankedStage } from '../../models';

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-green-400 border-green-500',
  MEDIUM: 'text-yellow-400 border-yellow-500',
  HARD: 'text-orange-400 border-orange-500',
  EXPERT: 'text-red-400 border-red-500',
};

@Component({
  selector: 'app-ranked-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      @let journey = journey$ | async;
      @if (journey) {
        <div class="flex items-center gap-4 mb-8">
          <button (click)="goBack()" class="text-gray-400 hover:text-white">← Back</button>
          <div>
            <h1 class="text-3xl font-bold text-white">{{ journey.topic }}</h1>
            <p class="text-gray-400">
              {{ journey.currentStage }} / {{ journey.totalStages }} stages completed
              @if (journey.isCompleted) {
                <span class="ml-2 text-green-400 font-bold">🏆 Journey Complete!</span>
              }
            </p>
          </div>
        </div>

        <!-- Stage map -->
        <div class="relative">
          <!-- Connecting line -->
          <div class="absolute left-8 top-8 bottom-8 w-0.5 bg-dark-600"></div>

          <div class="space-y-6">
            @for (stage of journey.stages; track stage.id; let i = $index) {
              <div class="relative flex items-start gap-4 pl-4">
                <!-- Node circle -->
                <div class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                     [class]="stage.isCompleted ? 'bg-green-600 text-white' :
                              isPlayable(stage, journey.stages) ? 'bg-indigo-600 text-white animate-pulse' :
                              'bg-dark-700 text-gray-500 border border-dark-500'">
                  @if (stage.isCompleted) { ✓ } @else { {{ stage.stageNumber }} }
                </div>

                <!-- Stage card -->
                <div class="flex-1 rounded-xl p-4 border transition-colors"
                     [class]="stage.isCompleted ? 'bg-dark-800 border-green-700' :
                              isPlayable(stage, journey.stages) ? 'bg-dark-800 border-indigo-500' :
                              'bg-dark-900 border-dark-700 opacity-60'">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-white font-medium">Stage {{ stage.stageNumber }}</h3>
                      <span class="text-sm" [class]="diffColor(stage.difficulty)">
                        {{ stage.difficulty }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      @if (stage.isCompleted && stage.score !== null) {
                        <span class="text-yellow-400 font-bold">{{ stage.score }} pts</span>
                      }
                      @if (stage.earnedReward) {
                        <span class="text-xs bg-dark-700 px-2 py-1 rounded text-gray-300">
                          +{{ stage.earnedReward.amount }} {{ stage.earnedReward.type }}
                        </span>
                      }
                      @if (isPlayable(stage, journey.stages) && !stage.isCompleted) {
                        <button (click)="playStage(stage)"
                                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                          Play
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (loading$ | async) {
        <div class="text-center py-12 text-gray-500">Loading journey...</div>
      }
    </div>
  `,
})
export class RankedDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  journey$ = this.store.select(selectCurrentJourney);
  loading$ = this.store.select(selectRankedLoading);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
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

  diffColor(difficulty: string): string {
    return DIFFICULTY_COLORS[difficulty] || 'text-gray-400';
  }

  playStage(stage: RankedStage) {
    if (stage.quizId) {
      // Create a SOLO match for the ranked stage quiz, then navigate to lobby
      this.store.dispatch(GameActions.createMatch({ quizId: stage.quizId, matchType: 'SOLO' }));
    }
  }

  goBack() {
    this.router.navigate(['/ranked']);
  }
}
