interface Collection {
  id: string;
  streak: CollectionStreak;
  cooldown: number;
  calculate(tier: number): number;
}

interface CollectionStreak {
  highest: number;
  value: number;
}
