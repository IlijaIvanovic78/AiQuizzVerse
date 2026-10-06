import { PathSource } from '../../core/models/path.model';

export const PATH_SOURCE_LABELS: Record<PathSource, string> = {
  TOPIC: 'From a topic',
  DOCUMENT: 'From your lesson',
};

export const PATH_STEP_COUNT = 5;
export const MAX_STARS_PER_STEP = 3;

// Map geometry in rem. Every stop sits in its own row; the castle row is taller.
export const STOP_ROW_REM = 11;
export const CASTLE_ROW_REM = 12.5;
export const STOP_TOP_REM = 0.75;
export const STOP_TILE_REM = 4;
export const CASTLE_TILE_REM = 6;

// Horizontal position of each stop in percent of the map width. Phones draw a straight road
// down the middle; md+ screens draw the winding one.
export const NARROW_STOP_X = 50;
export const WIDE_STOP_X = [24, 70, 28, 72, 50];
