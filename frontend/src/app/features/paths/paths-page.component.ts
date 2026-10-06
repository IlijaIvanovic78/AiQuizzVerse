import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { PathsActions } from '../../store/paths/paths.actions';
import { pathsFeature } from '../../store/paths/paths.reducer';
import { NEW_PATH_QUERY_PARAMS } from '../create/create.constants';
import { PathCardComponent } from './components/path-card.component';
import { PATH_STEP_COUNT } from './paths.constants';

@Component({
  selector: 'app-paths-page',
  imports: [
    RouterLink,
    EmptyStateComponent,
    PageHeaderComponent,
    SpinnerComponent,
    PathCardComponent,
  ],
  templateUrl: './paths-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathsPageComponent {
  private readonly store = inject(Store);

  protected readonly paths = this.store.selectSignal(pathsFeature.selectPaths);
  protected readonly loaded = this.store.selectSignal(pathsFeature.selectLoaded);
  protected readonly error = this.store.selectSignal(pathsFeature.selectError);
  protected readonly newPathQuery = NEW_PATH_QUERY_PARAMS;
  protected readonly stepCount = PATH_STEP_COUNT;
  protected readonly emptyText =
    `A learning path turns any topic or lesson into ${PATH_STEP_COUNT} steps. Read a short ` +
    'study card, take the quiz, collect stars and open the treasure on the way to the castle.';

  protected readonly firstLoadFailed = computed(() => !this.loaded() && this.error() !== null);

  constructor() {
    this.loadPaths();
  }

  // Stars and cleared steps change after every match, so the list is fetched on every visit.
  protected loadPaths(): void {
    this.store.dispatch(PathsActions.load());
  }
}
