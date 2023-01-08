import { type ChatInputCommandErrorPayload, UserError } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

import { EmbedTemplates, Responder } from '#lib/utilities';

import { ChatInputSubcommandErrorPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.Context) {
    super(context, { event: Events.ChatInputCommandError });
  }

  public async run(error: unknown, payload: ChatInputCommandErrorPayload): Promise<void> {
    const responder = new Responder(payload.interaction);
    const embed = EmbedTemplates.createCamouflaged();

    if (error instanceof UserError) {
      await responder.send(content => content.addEmbed(() => embed.setDescription(error.message)));
    }
  }
}

export class ChatInputSubcommandErrorListener extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandError> {
  public constructor(context: Listener.Context) {
    super(context, { event: SubcommandPluginEvents.ChatInputSubcommandError });
  }

  public async run(error: unknown, payload: ChatInputSubcommandErrorPayload) {
    const responder = new Responder(payload.interaction);
    const embed = EmbedTemplates.createCamouflaged();

    if (error instanceof UserError) {
      await responder.send(content => content.addEmbed(() => embed.setDescription(error.message)));
    }
  }
}