import type { APIMember } from '../types/member.js';
import { Base } from './structure.js';

export class Member extends Base<APIMember> {
  public id: string;
  public username: string;
  public xp: number;
  public level: number;
  public weeklyXp: number | null;

  public constructor(data: APIMember) {
    super(data);
    this.id = data.id;
    this.username = data.username;
    this.xp = data.exp;
    this.level = data.level;
    this.weeklyXp = data.weeklyExp ?? null;
  }
}
