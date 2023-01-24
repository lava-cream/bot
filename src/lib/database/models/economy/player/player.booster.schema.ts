import { CreateNumberValueSchema, CreateSubSchemaManager, prop, SubSchema } from '#lib/database/structures/schema.js';
import type { BoosterTypeKind } from '#lib/framework/structures';
import type { OmitFunctions } from '#lib/utilities';
import { DiscordSnowflake } from '@sapphire/snowflake';

export class PlayerBoosterValueSchema extends SubSchema {
	@prop({ type: Number })
	public type!: BoosterTypeKind;

	@prop({ type: Number })
	public value!: number;

	public constructor(options: OmitFunctions<Omit<PlayerBoosterValueSchema, 'id'>>) {
		super(DiscordSnowflake.generate({ timestamp: Date.now() }).toString());
		this.type = options.type;
		this.value = options.value;
	}
}

export class PlayerBoosterValueManagerSchema extends CreateSubSchemaManager(PlayerBoosterValueSchema) {
	public getValue(type: BoosterTypeKind): number | null {
		return this.find((v) => v.type === type)?.value ?? null;
	}
}

export class PlayerBoosterQuantitySchema extends CreateNumberValueSchema(0) {}

export class PlayerBoosterSchema extends SubSchema {
	@prop({ type: () => PlayerBoosterValueManagerSchema, immutable: true })
	public readonly values!: PlayerBoosterValueManagerSchema;

	@prop({ type: () => PlayerBoosterQuantitySchema, immutable: true })
	public readonly quantity!: PlayerBoosterQuantitySchema;

	@prop({ type: Number })
	public expire: number;

	public constructor(id: string, options: OmitFunctions<Pick<PlayerBoosterSchema, 'expire'>>) {
		super(id);
		this.expire = options.expire;
		this.quantity = new PlayerBoosterQuantitySchema();
		this.values = new PlayerBoosterValueManagerSchema();
	}

	public isExpired(): boolean {
		return this.expire > Date.now();
	}

	public setExpire(expire: number) {
		this.expire = expire;
		return this;
	}
}

export class PlayerBoosterManagerSchema extends CreateSubSchemaManager(PlayerBoosterSchema) {
	public get activated(): PlayerBoosterSchema[] {
		return this.entries.filter((booster) => !booster.isExpired());
	}
}
