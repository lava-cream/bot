/**
 * @file component.action-row.builder
 * @description ActionRow builder utilities.
 * @since 6.0.0
 */

import { type MessageActionRowComponentResolvable, type ModalActionRowComponentResolvable, MessageActionRow } from 'discord.js';
import type {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  APIModalActionRowComponent
} from 'discord.js/node_modules/discord-api-types/v9.js';
import { type FirstArgument, isFunction } from '@sapphire/utilities';
import { ButtonBuilder } from './component.button.builder.js';
import { SelectMenuBuilder } from './component.select-menu.builder.js';
import { TextInputComponentBuilder } from './component.text-input-component.builder.js';
import { Builder, BuilderCallback } from '../builder.js';
import { removeElement } from '#lib/utilities';

/**
 * The component types of a {@link MessageActionRowBuilder}.
 */
export type MessageActionRowBuilderComponents = ButtonBuilder | SelectMenuBuilder;

/**
 * Represents a strict-typed action row builder for messages.
 * @template T The component's type.
 * @since 6.0.0
 */
export class MessageActionRowBuilder<T extends MessageActionRowBuilderComponents = MessageActionRowBuilderComponents> extends MessageActionRow<
  T,
  MessageActionRowComponentResolvable,
  APIActionRowComponent<APIMessageActionRowComponent>
> {
  /**
   * Inserts a button component within this action row builder.
   * @param builder The builder function.
   */
  public addButtonComponent(builder: T extends ButtonBuilder ? BuilderCallback<ButtonBuilder> : undefined): this;
  public addButtonComponent(builder: BuilderCallback<ButtonBuilder> | undefined): this {
    if (isFunction(builder)) super.addComponents(Builder.build(new ButtonBuilder(), builder));
    return this;
  }

  /**
   * Inserts a select menu component within this action row builder.
   * @param builder The builder function.
   */
  public addSelectMenuComponent(builder: T extends SelectMenuBuilder ? BuilderCallback<SelectMenuBuilder> : undefined): this;
  public addSelectMenuComponent(builder: BuilderCallback<SelectMenuBuilder> | undefined): this {
    if (isFunction(builder)) super.addComponents(Builder.build(new SelectMenuBuilder(), builder));
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

/**
 * The component types of a {@link ModalActionRowBuilder}.
 */
export type ModalActionRowBuilderComponents = TextInputComponentBuilder;

/**
 * Represents a strict-typed action row builder for modals.
 * @template T The component's type.
 */
export class ModalActionRowBuilder<T extends ModalActionRowBuilderComponents = ModalActionRowBuilderComponents> extends MessageActionRow<
  T,
  ModalActionRowComponentResolvable,
  APIActionRowComponent<APIModalActionRowComponent>
> {
  /**
   * Inserts a text input component within this action row builder.
   * @param builder The builder function.
   */
  public addTextInputComponent(builder: T extends TextInputComponentBuilder ? BuilderCallback<TextInputComponentBuilder> : undefined): this;
  public addTextInputComponent(builder: BuilderCallback<TextInputComponentBuilder> | undefined): this {
    if (isFunction(builder)) super.addComponents(Builder.build(new TextInputComponentBuilder(), builder));
    return this;
  }
}
