import { ChestReward } from '../../core/models/chest.model';
import { BOOST_LABELS } from '../../shared/components/boost-icon.component';

// One short line for a reward, used in the recent rewards list and read out after opening.
export function rewardSummary(reward: ChestReward): string {
  if (reward.kind === 'COINS') {
    return `${reward.coins} coins`;
  }
  if (reward.kind === 'BOOSTS') {
    return reward.boosts
      .map((boost) => `${BOOST_LABELS[boost.type]} x${boost.quantity}`)
      .join(', ');
  }
  const name = reward.item?.name ?? 'A new friend';
  if (reward.duplicate) {
    return `${name}, turned into ${reward.coins} coins`;
  }
  return reward.item?.type === 'SABOTAGE' ? `New sabotage: ${name}!` : name;
}
