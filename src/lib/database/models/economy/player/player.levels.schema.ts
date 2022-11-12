import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerLevel } from '#lib/utilities/constants/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerLevelsSchema {
  @prop({ type: Number, default: 0 })
  public xp!: number;

  public update(options: Partial<OmitFunctions<Omit<PlayerLevelsSchema, 'level'>>>): this {
    return Object.assign(this, options);
  }

  public get level() {
    return Math.trunc(this.xp / PlayerLevel.ExperienceRatio);
  }

  public setXP(xp: number) {
    this.xp = xp;
    return this;
  }

  public addXP(xp: number) {
    return this.setXP(this.xp + xp);
  }

  public subXP(xp: number) {
    return this.setXP(this.xp - xp);
  }
}
