import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { RankedActions, selectJourneys, selectRankedLoading } from '../../store/ranked';

@Component({
  selector: 'app-ranked-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-6">Ranked Journeys</h1>

      <!-- Create new journey -->
      <div class="bg-dark-800 rounded-xl p-5 border border-dark-600 mb-8">
        <h2 class="text-lg font-semibold text-white mb-3">Start New Journey</h2>
        <div class="flex gap-3">
          <input [(ngModel)]="topic"
                 placeholder="Enter a topic (e.g. Solar System, World War II...)"
                 class="flex-1 bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-500 focus:border-indigo-500 focus:outline-none" />
          <button (click)="create()"
                  [disabled]="!topic.trim() || (loading$ | async)"
                  class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
            @if (loading$ | async) { Generating... } @else { Create }
          </button>
        </div>
        <p class="text-gray-500 text-sm mt-2">AI will generate 8 stages with increasing difficulty</p>
      </div>

      <!-- Journeys list -->
      @let journeys = journeys$ | async;
      @if (journeys && journeys.length > 0) {
        <div class="space-y-4">
          @for (journey of journeys; track journey.id) {
            <a [routerLink]="['/ranked', journey.id]"
               class="block bg-dark-800 rounded-xl p-5 border border-dark-600 hover:border-indigo-500 transition-colors">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-semibold text-lg">{{ journey.topic }}</h3>
                  <p class="text-gray-400 text-sm mt-1">
                    Stage {{ journey.currentStage }} / {{ journey.totalStages }}
                    @if (journey.isCompleted) {
                      <span class="ml-2 text-green-400 font-medium">✅ Completed</span>
                    }
                  </p>
                </div>
                <div class="flex gap-1">
                  @for (stage of journey.stages; track stage.id) {
                    <div class="w-3 h-3 rounded-full"
                         [class]="stage.isCompleted ? 'bg-green-500' : 'bg-dark-600'"></div>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      } @else {
        <p class="text-gray-500 text-center py-8">No journeys yet. Create one above!</p>
      }
    </div>
  `,
})
export class RankedListComponent implements OnInit {
  private readonly store = inject(Store);

  journeys$ = this.store.select(selectJourneys);
  loading$ = this.store.select(selectRankedLoading);
  topic = '';

  ngOnInit() {
    this.store.dispatch(RankedActions.loadJourneys());
  }

  create() {
    if (!this.topic.trim()) return;
    this.store.dispatch(RankedActions.createJourney({ topic: this.topic.trim() }));
    this.topic = '';
  }
}
