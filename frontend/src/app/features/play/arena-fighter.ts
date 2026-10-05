import { MatchPlayerView } from '../../core/models/match.model';
import { RoundPlayerResult, RoundResultEvent } from '../../core/models/realtime-events.model';
import { HeroAction } from '../../shared/components/hero-sprite.component';

export interface ArenaFighter {
  id: string;
  name: string;
  heroKey: string | null;
  petKey: string | null;
  isMe: boolean;
  score: number;
  action: HeroAction;
  // Points that float above the hero after a correct answer.
  points: number | null;
  answered: boolean;
  away: boolean;
}

export interface FighterMoment {
  meId: string;
  inLobby: boolean;
  scores: Record<string, number>;
  round: RoundResultEvent | null;
  answeredUserIds: string[];
  leftUserIds: string[];
}

export function toFighter(player: MatchPlayerView, moment: FighterMoment): ArenaFighter {
  const { user } = player;
  const roundResult = moment.round?.players.find((result) => result.userId === user.id) ?? null;
  return {
    id: user.id,
    name: user.username,
    heroKey: user.avatarKey,
    petKey: user.petKey,
    isMe: user.id === moment.meId,
    score: moment.scores[user.id] ?? player.score,
    action: actionFor(roundResult),
    points: roundResult?.correct ? roundResult.points : null,
    answered: moment.answeredUserIds.includes(user.id),
    away: isAway(player, moment),
  };
}

function actionFor(roundResult: RoundPlayerResult | null): HeroAction {
  if (!roundResult) {
    return 'idle';
  }
  return roundResult.correct ? 'attack' : 'hurt';
}

// The lobby view knows who is connected; during play only the player-left events do.
function isAway(player: MatchPlayerView, moment: FighterMoment): boolean {
  if (player.user.id === moment.meId) {
    return false;
  }
  if (moment.leftUserIds.includes(player.user.id)) {
    return true;
  }
  return moment.inLobby && !player.isConnected;
}
