import {
	Builder,
	BuilderCallback,
	type ActionRowComponentBuilder,
	TextInputComponentBuilder,
	StringSelectMenuComponentBuilder,
	ButtonComponentBuilder,
	ActionRowBuilder
} from './index.js';
import { EmbedBuilder } from 'discord.js';

/**
 * Creates a {@link TextInputComponentBuilder} out of a callback.
 * @param fn The callback.
 * @returns A {@link TextInputComponentBuilder} instance.
 * @since 6.0.0
 */
export function createTextInputComponent(fn: BuilderCallback<TextInputComponentBuilder>): TextInputComponentBuilder {
	return Builder.build(new TextInputComponentBuilder(), fn);
}

/**
 * Creates a {@link StringSelectMenuComponentBuilder} out of a callback.
 * @param fn The callback.
 * @returns A {@link StringSelectMenuComponentBuilder} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createSelectMenu(fn: BuilderCallback<StringSelectMenuComponentBuilder>): StringSelectMenuComponentBuilder {
	return Builder.build(new StringSelectMenuComponentBuilder(), fn);
}

/**
 * Creates a {@link ButtonComponentBuilder} out of a callback.
 * @param fn The callback.
 * @returns A {@link ButtonComponentBuilder} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createButton(fn: BuilderCallback<ButtonComponentBuilder>): ButtonComponentBuilder {
	return Builder.build(new ButtonComponentBuilder(), fn);
}

/**
 * Creates an {@link MessageActionRow} out of a callback.
 * @param fn The callback.
 * @returns An {@link MessageActionRow} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createMessageActionRow<T extends ActionRowComponentBuilder>(fn: BuilderCallback<ActionRowBuilder<T>>): ActionRowBuilder<T> {
	return Builder.build(new ActionRowBuilder<T>(), fn);
}

/**
 * Creates an {@link EmbedBuilder} out of a callback.
 * @param fn The callback.
 * @returns An {@link EmbedBuilder} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createEmbed(fn: BuilderCallback<EmbedBuilder>): EmbedBuilder {
	return Builder.build(new EmbedBuilder(), fn);
}
