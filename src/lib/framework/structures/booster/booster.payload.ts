import type { PlayerBoosterSchema } from '#lib/database/models/economy/player/player.booster.schema';
import type { Booster } from './booster.piece';
import { BoosterTypeKind } from './booster.options.js';

export class BoosterPayload {
	public constructor(public piece: Booster, public schema: PlayerBoosterSchema) {}

	public get coinMultiplier() {
		return this.schema.values.getValue(BoosterTypeKind.CoinMultiplier);
	}

	public get bankSpaceMultiplier() {
		return this.schema.values.getValue(BoosterTypeKind.BankSpaceMultiplier);
	}

	public get winStreakBonus() {
		return this.schema.values.getValue(BoosterTypeKind.WinStreakBonus);
	}

	public get winStreakSaver() {
		return this.schema.values.getValue(BoosterTypeKind.WinStreakSaver);
	}
}
