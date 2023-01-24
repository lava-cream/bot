import { createMethodDecorator } from '@sapphire/decorators';
import { ChatInputCommand, ChatInputCommandContext, Result, UserError } from '@sapphire/framework';
import { Colors } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { edit } from '../discord/index.js';

/**
 * Defers the {@link ChatInputCommandInteraction} passed into chatInputRun.
 * @param ephemeral Whether the command interaction should be deferred as ephemeral.
 * @returns A method decorator.
 * @since 6.0.0
 */
export const DeferCommandInteraction = (ephemeral = false): MethodDecorator => {
	return createMethodDecorator((_target, _key, descriptor) => {
		const method = descriptor.value as ChatInputCommand['chatInputRun'];

		descriptor.value = <any>async function (this: ChatInputCommand, command: ChatInputCommandInteraction, context: ChatInputCommandContext) {
			await command.deferReply({ ephemeral });

			const result = await Result.fromAsync(method.call(this, command, context));
			if (result.isErr()) {
				const error = result.unwrapErr();

				if (error instanceof UserError && command.replied) {
					await edit(command, (builder) =>
						builder.addEmbed((embed) => embed.setDescription(error.message).setColor(Colors.DarkButNotBlack))
					);
				}

				throw error;
			}
		};
	});
};
