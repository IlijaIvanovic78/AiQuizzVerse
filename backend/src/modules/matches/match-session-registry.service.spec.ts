import { NotificationsService } from '../realtime/notifications.service';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import { MatchSessionRegistry } from './match-session-registry.service';
import { GameServer, SessionSetup } from './matches.types';

const MATCH_ID = 'match-1';
const SETUP: SessionSetup = {
  match: {
    id: MATCH_ID,
    mode: 'SOLO',
    hostId: 'ana',
    quiz: { id: 'quiz-1', kind: 'STANDARD', difficulty: 'EASY', timePerQuestion: 20 },
    players: [{ userId: 'ana', sabotages: [] }],
  },
  questions: [],
};
const server = { to: () => ({ emit: () => undefined }) } as unknown as GameServer;

function fakePlay() {
  return {
    claimStart: jest.fn<Promise<boolean>, [string]>().mockResolvedValue(true),
    loadSessionSetup: jest.fn<Promise<SessionSetup>, [string]>().mockResolvedValue(SETUP),
    abandon: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
  };
}

let play: ReturnType<typeof fakePlay>;
let registry: MatchSessionRegistry;

beforeEach(() => {
  jest.useFakeTimers();
  play = fakePlay();
  registry = new MatchSessionRegistry(
    play as unknown as MatchPlayService,
    {} as MatchResultsService,
    {} as NotificationsService,
  );
});

afterEach(() => {
  registry.onModuleDestroy();
  jest.useRealTimers();
});

describe('starting a match', () => {
  it('counts as starting until the session is ready', async () => {
    let finishLoading: (loaded: SessionSetup) => void = () => undefined;
    play.loadSessionSetup.mockReturnValue(
      new Promise((resolve) => {
        finishLoading = resolve;
      }),
    );

    const starting = registry.start(MATCH_ID, server, ['ana']);
    expect(registry.isStarting(MATCH_ID)).toBe(true);
    expect(registry.get(MATCH_ID)).toBeUndefined();

    finishLoading(SETUP);
    await starting;
    expect(registry.isStarting(MATCH_ID)).toBe(false);
    expect(registry.get(MATCH_ID)).toBeDefined();
  });

  it('does nothing when someone else already claimed the match', async () => {
    play.claimStart.mockResolvedValue(false);

    await registry.start(MATCH_ID, server, ['ana']);
    expect(play.loadSessionSetup).not.toHaveBeenCalled();
    expect(registry.get(MATCH_ID)).toBeUndefined();
  });

  it('abandons a claimed match that cannot be loaded', async () => {
    play.loadSessionSetup.mockRejectedValue(new Error('The database is down.'));

    await expect(registry.start(MATCH_ID, server, ['ana'])).rejects.toThrow('database');
    expect(play.abandon).toHaveBeenCalledWith(MATCH_ID);
    expect(registry.isStarting(MATCH_ID)).toBe(false);
  });
});
