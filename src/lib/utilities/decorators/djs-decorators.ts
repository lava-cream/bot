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
    const method = descriptor.value as ChatInputCommand['chatInputRun'];

    descriptor.value = <any> async function (this: ChatInputCommand, command: CommandInteraction, context: ChatInputCommandContext) {
      await command.deferReply({ ephemeral });
      return Reflect.apply(method, this, [command, context]);
    };
  });
};