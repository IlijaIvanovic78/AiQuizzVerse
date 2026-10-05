import { PathSummary } from '../../core/models/path.model';
import { SectionStatus } from './home.types';

// Every list is requested when the page opens and each load clears the old error first.
export function sectionStatus(loaded: boolean, error: string | null): SectionStatus {
  if (loaded) {
    return 'ready';
  }
  return error ? 'failed' : 'loading';
}

// "Continue your path" shows the next step of the newest path that is not finished yet.
export function newestOpenPath(paths: PathSummary[]): PathSummary | null {
  const openPaths = paths.filter((path) => path.nextStep !== null);
  const newestFirst = [...openPaths].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return newestFirst[0] ?? null;
}
