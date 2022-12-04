import { createMethodDecorator } from "@sapphire/decorators";
import type { ChatInputCommand, ChatInputCommandContext } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";

/**
 * Defers the {@link CommandInteraction} passed into chatInputRun.
 * @param ephemeral Whether the command interaction should be deferred as ephemeral.
 * @returns A method decorator.
 * @since 6.0.0
 */
export const DeferCommandInteraction = (ephemeral = false): MethodDecorator => {
  return createMethodDecorator((_target, _key, descriptor) => {
    Reflect.set(descriptor, 'value', async function (command: CommandInteraction, context: ChatInputCommandContext) {
      await command.deferReply({ ephemeral });
      await (descriptor.value as ChatInputCommand['chatInputRun'])(command, context);
    });
  });
};