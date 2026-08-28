import type { QuestConfig } from '../types/game'

export const QUESTS: readonly QuestConfig[] = [
  { id: 'plant-carrots', event: 'plant', cropId: 'carrot', target: 3, rewardCoins: 60, rewardXp: 25 },
  { id: 'water-plots', event: 'water', target: 5, rewardCoins: 45, rewardXp: 20 },
  { id: 'harvest-crops', event: 'harvest', target: 3, rewardCoins: 80, rewardXp: 35 },
  { id: 'earn-coins', event: 'sellCoins', target: 100, rewardCoins: 100, rewardXp: 45 },
]
