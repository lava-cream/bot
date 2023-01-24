/**
 * @file component.action-row.builder
 * @description ActionRow builder utilities.
 * @since 6.0.0
 */

import { ActionRowBuilder as BaseActionRowBuilder, AnyComponentBuilder, ComponentType } from 'discord.js';
import { type FirstArgument, isFunction } from '@sapphire/utilities';
import { ButtonComponentBuilder } from './component.button.builder.js';
import { StringSelectMenuComponentBuilder } from './component.select-menu.builder.js';
import { TextInputComponentBuilder } from './component.text-input-component.builder.js';
import { Builder, BuilderCallback } from '../builder.js';
import { removeElement } from '#lib/utilities';

/**
 * The component types of a {@link ActionRowBuilder}.
 */
export type ActionRowComponentBuilder = AnyComponentBuilder | ButtonComponentBuilder | StringSelectMenuComponentBuilder | TextInputComponentBuilder;

/**
 * Represents a strict-typed action row builder.
 * @template T The component's type.
 * @since 6.0.0
 */
export class ActionRowBuilder<T extends ActionRowComponentBuilder = ActionRowComponentBuilder> extends BaseActionRowBuilder<T> {
	public declare components: T[];
	public type = ComponentType.ActionRow;

	/**
	 * Inserts a button component within this action row builder.
	 * @param builder The builder function.
	 */
	public addButtonComponent(builder: T extends ButtonComponentBuilder ? BuilderCallback<ButtonComponentBuilder> : undefined): this;
	public addButtonComponent(builder: BuilderCallback<ButtonComponentBuilder> | undefined): this {
		if (isFunction(builder)) super.addComponents([Builder.build(new ButtonComponentBuilder(), builder)] as T[]);
		return this;
	}

	/**
	 * Inserts a select menu component within this action row builder.
	 * @param builder The builder function.
	 */
	public addSelectMenuComponent(
		builder: T extends StringSelectMenuComponentBuilder ? BuilderCallback<StringSelectMenuComponentBuilder> : undefined
	): this;
	public addSelectMenuComponent(builder: BuilderCallback<StringSelectMenuComponentBuilder> | undefined): this {
		if (isFunction(builder)) super.addComponents([Builder.build(new StringSelectMenuComponentBuilder(), builder)] as T[]);
		return this;
	}

	/**
	 * Inserts a select menu component within this action row builder.
	 * @param builder The builder function.
	 */
	public addTextInputComponent(builder: T extends TextInputComponentBuilder ? BuilderCallback<TextInputComponentBuilder> : undefined): this;
	public addTextInputComponent(builder: BuilderCallback<TextInputComponentBuilder> | undefined): this {
		if (isFunction(builder)) super.addComponents([Builder.build(new TextInputComponentBuilder(), builder)] as T[]);
		return this;
	}

	/**
	 * Removes an existing component from this action row.
	 * @param filter The filter to apply. Defaults to a filter returning `true`.
	 */
	public removeComponent(filter?: FirstArgument<T[]['filter']>) {
		return removeElement(this.components, filter ?? (() => true));
	}
}
