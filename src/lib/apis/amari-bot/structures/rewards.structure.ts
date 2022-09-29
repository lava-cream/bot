import type { APIRewards, APIRewardsEntry } from '../types/rewards.js';
import { Base } from './structure.js';

export class Rewards extends Base<APIRewards> {
  public count: number;
  public entries: RewardsEntry[];

  public constructor(data: APIRewards) {
    super(data);
    this.count = data.count;
    this.entries = data.data.map((entry) => new RewardsEntry(entry));
  }
}

export class RewardsEntry extends Base<APIRewardsEntry> {
  public id: string;
  public level: number;

  public constructor(data: APIRewardsEntry) {
    super(data);
    this.id = data.roleID;
    this.level = data.level;
  }
}
