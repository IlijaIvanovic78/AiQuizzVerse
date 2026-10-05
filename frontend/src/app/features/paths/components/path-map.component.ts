import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { StepView } from '../../../core/models/path.model';
import { CHEST_ICONS } from '../../../shared/chests';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { StarRatingComponent } from '../../../shared/components/star-rating.component';
import { TrailSegment, findNextStep, mapHeightRem, stopCenterY, trailSegments } from '../path-map';
import {
  CASTLE_ROW_REM,
  CASTLE_TILE_REM,
  MAX_STARS_PER_STEP,
  NARROW_STOP_X,
  STOP_ROW_REM,
  STOP_TILE_REM,
  STOP_TOP_REM,
  WIDE_STOP_X,
} from '../paths.constants';

interface MapStop {
  step: StepView;
  isCastle: boolean;
  isNext: boolean;
  wideX: number;
  // On wide screens the road leaves each stop towards the next one; the other side is free.
  freeSideRight: boolean;
  rowHeight: number;
  tileSize: number;
  label: string;
}

@Component({
  selector: 'app-path-map',
  imports: [HeroSpriteComponent, PixelIconComponent, StarRatingComponent],
  templateUrl: './path-map.component.html',
  styleUrl: './path-map.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathMapComponent {
  readonly steps = input.required<StepView[]>();
  readonly selectedStepId = input<string | null>(null);
  readonly heroKey = input<string | null>(null);
  readonly stepSelected = output<StepView>();

  protected readonly stopTop = STOP_TOP_REM;
  protected readonly chestIcons = CHEST_ICONS;
  protected readonly heightRem = computed(() => mapHeightRem(this.steps().length));
  protected readonly viewBox = computed(() => `0 0 100 ${this.heightRem()}`);

  protected readonly stops = computed<MapStop[]>(() => {
    const steps = this.steps();
    const nextStepId = findNextStep(steps)?.id ?? null;
    return steps.map((step, index) => {
      const isCastle = index === steps.length - 1;
      const wideX = wideStopX(index);
      return {
        step,
        isCastle,
        isNext: step.id === nextStepId,
        wideX,
        freeSideRight: !isCastle && wideX > wideStopX(index + 1),
        rowHeight: isCastle ? CASTLE_ROW_REM : STOP_ROW_REM,
        tileSize: isCastle ? CASTLE_TILE_REM : STOP_TILE_REM,
        label: stopLabel(step, steps.length),
      };
    });
  });

  protected readonly narrowTrail = computed(() => this.trail(() => NARROW_STOP_X));
  protected readonly wideTrail = computed(() => this.trail(wideStopX));

  private trail(stopX: (index: number) => number): TrailSegment[] {
    const steps = this.steps();
    const points = steps.map((_, index) => ({
      x: stopX(index),
      y: stopCenterY(index, index === steps.length - 1),
    }));
    return trailSegments(points, steps);
  }
}

function wideStopX(index: number): number {
  return WIDE_STOP_X[index] ?? NARROW_STOP_X;
}

function stopLabel(step: StepView, totalSteps: number): string {
  const name = `Step ${step.position} of ${totalSteps}: ${step.title}`;
  if (!step.unlocked) {
    return `${name}. Locked`;
  }
  if (step.cleared) {
    return `${name}. Cleared with ${step.stars} of ${MAX_STARS_PER_STEP} stars`;
  }
  return `${name}. Your next step`;
}
