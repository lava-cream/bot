import type {
	CacheType,
	ChatInputCommandInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
	BooleanCache,
	Message,
	StringSelectMenuInteraction,
	ChannelSelectMenuInteraction,
	RoleSelectMenuInteraction,
	MentionableSelectMenuInteraction,
	UserSelectMenuInteraction
} from 'discord.js';
import {
	type BuilderCallback,
	InteractionMessageContentBuilder,
	CustomId,
	InteractionMessageUpdateBuilder,
	ActionRowComponentBuilder
} from '#lib/utilities';
import { isFunction, isNullOrUndefined } from '@sapphire/utilities';
import { Result } from '@sapphire/result';

/**
 * Represents a responder target.
 * @template Cached The cache type.
 */
export type ResponderTarget<Cached extends CacheType> =
	| ChatInputCommandInteraction<Cached>
	| ButtonInteraction<Cached>
	| StringSelectMenuInteraction<Cached>
	| RoleSelectMenuInteraction<Cached>
	| ChannelSelectMenuInteraction<Cached>
	| MentionableSelectMenuInteraction<Cached>
	| UserSelectMenuInteraction<Cached>
	| ModalSubmitInteraction<Cached>;

/**
 * Represents the responder content.
 */
export type ResponderContent<Components extends ActionRowComponentBuilder> =
	| string
	| InteractionMessageContentBuilder<Components>
	| BuilderCallback<InteractionMessageContentBuilder<Components>>;

/**
 * Sends a response to an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Components The type of the components of the content.
 * @param target The target interaction.
 * @param content The message content builder.
 * @returns A message object.
 * @since 6.0.0
 */
export async function send<Cached extends CacheType, Components extends ActionRowComponentBuilder>(
	target: ResponderTarget<Cached>,
	content: ResponderContent<Components>
): Promise<Message<BooleanCache<Cached>>> {
	const builder = new InteractionMessageContentBuilder<Components>().apply(
		isFunction(content) ? content : (builder) => (typeof content === 'string' ? builder.setContent(content) : content)
	);
	const { deferred, replied } = target;

	switch (true) {
		case deferred && !replied: {
			return target.editReply(builder);
		}

		case replied: {
			return target.followUp(builder);
		}

		default: {
			return target.reply({ ...builder, fetchReply: true });
		}
	}
}

/**
 * Edits the original response of an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Components The type of the components of the content.
 * @param target The target interaction.
 * @param content The message content builder.
 * @returns A message object.
 * @since 6.0.0
 */
export async function edit<Cached extends CacheType, Components extends ActionRowComponentBuilder>(
	target: ResponderTarget<Cached>,
	content: ResponderContent<Components>
): Promise<Message<BooleanCache<Cached>>> {
	const builder = new InteractionMessageContentBuilder<Components>().apply(
		isFunction(content) ? content : (builder) => (typeof content === 'string' ? builder.setContent(content) : content)
	);

	if (target.isChatInputCommand() || (!target.replied && target.deferred)) {
		return target.editReply(builder);
	}
	if (target.isModalSubmit()) {
		return target.followUp(builder);
	}

	if (builder.flags === 'Ephemeral') {
		throw new Error(`Ephemeral flags cannot be used to update message component interactions.`, { cause: builder.flags });
	}

	return target.update({ ...new InteractionMessageUpdateBuilder().apply(() => builder as InteractionMessageUpdateBuilder), fetchReply: true });
}

/**
 * Deletes the response of an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Target The target interaction's type.
 * @param target The target interaction.
 * @since 6.0.0
 */
export async function unsend<Cached extends CacheType, Target extends ResponderTarget<Cached>>(target: Target): Promise<boolean> {
	const result = await Result.fromAsync(target.deleteReply());
	return result.isOk();
}

/**
 * Class-based responder utility.
 * @template Cached The cached status of the target interaction.
 * @template Target The target interaction's type.
 * @since 6.0.0
 */
export class Responder<Cached extends CacheType, Target extends ResponderTarget<Cached>> {
	/**
	 * The content builder.
	 */
	public content = new InteractionMessageContentBuilder();
	/**
	 * The {@link CustomId} utility to easily create unique message component custom IDs.
	 */
	public customId: CustomId;

	/**
	 * The responder's constructor.
	 * @param target The target interaction.
	 */
	public constructor(public target: Target) {
		this.customId = new CustomId(this.target.createdAt);
	}

	/**
	 * Sends a message through the interaction with the current built content.
	 * @param builder The message content builder.
	 * @returns A message object.
	 */
	public send(builder?: BuilderCallback<InteractionMessageContentBuilder>): Promise<Message<BooleanCache<Cached>>> {
		return send(this.target, isNullOrUndefined(builder) ? this.content : this.content.apply(builder));
	}

	/**
	 * Edits the target interaction with the current built content.
	 * @param builder The message content builder.
	 * @returns A message object.
	 */
	public edit(builder?: BuilderCallback<InteractionMessageContentBuilder>): Promise<Message<BooleanCache<Cached>>> {
		return edit(this.target, isNullOrUndefined(builder) ? this.content : this.content.apply(builder));
	}

	/**
	 * Unsends or basically deletes the response of the interaction.
	 * @returns A boolean indicating the success of the operation.
	 */
	public unsend(): Promise<boolean> {
		return unsend(this.target);
	}
}
