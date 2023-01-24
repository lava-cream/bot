import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { Builder, BuilderCallback } from '../builder.js';
import { Mixin } from 'ts-mixer';

export class StringSelectMenuComponentBuilder extends Mixin(StringSelectMenuBuilder, Builder) {
	public addOption(option: BuilderCallback<StringSelectMenuOptionBuilder>): this {
		return super.addOptions(Builder.build(new StringSelectMenuOptionBuilder(), option));
	}
}
