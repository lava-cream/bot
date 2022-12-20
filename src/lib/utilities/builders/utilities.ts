import {
  Builder,
  BuilderCallback,
  type MessageActionRowBuilderComponents,
  type ModalActionRowBuilderComponents,
  TextInputComponentBuilder,
  SelectMenuBuilder,
  ButtonBuilder,
  MessageActionRowBuilder,
  ModalActionRowBuilder
} from './index.js';
import { MessageEmbed } from 'discord.js';

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
 * Creates an {@link ModalActionRow} out of a callback.
 * @param fn The callback.
 * @returns An {@link ModalActionRow} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createModalActionRow<T extends ModalActionRowBuilderComponents>(fn: BuilderCallback<ModalActionRowBuilder<T>>): ModalActionRowBuilder<T> {
  return Builder.build(new ModalActionRowBuilder<T>(), fn);
}

/**
 * Creates a {@link SelectMenuBuilder} out of a callback.
 * @param fn The callback.
 * @returns A {@link SelectMenuBuilder} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createSelectMenu(fn: BuilderCallback<SelectMenuBuilder>): SelectMenuBuilder {
  return Builder.build(new SelectMenuBuilder(), fn);
}

/**
 * Creates a {@link ButtonBuilder} out of a callback.
 * @param fn The callback.
 * @returns A {@link ButtonBuilder} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createButton(fn: BuilderCallback<ButtonBuilder>): ButtonBuilder {
  return Builder.build(new ButtonBuilder(), fn);
}

/**
 * Creates an {@link MessageActionRow} out of a callback.
 * @param fn The callback.
 * @returns An {@link MessageActionRow} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createMessageActionRow<T extends MessageActionRowBuilderComponents>(
  fn: BuilderCallback<MessageActionRowBuilder<T>>
): MessageActionRowBuilder<T> {
  return Builder.build(new MessageActionRowBuilder<T>(), fn);
}

/**
 * Creates an {@link MessageEmbed} out of a callback.
 * @param fn The callback.
 * @returns An {@link MessageEmbed} instance.
 * @version 6.0.0 - Use custom builders.
 * @since 5.0.0
 */
export function createEmbed(fn: BuilderCallback<MessageEmbed>): MessageEmbed {
  return Builder.build(new MessageEmbed(), fn);
}
