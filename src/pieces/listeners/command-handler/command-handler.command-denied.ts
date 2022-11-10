import { PreconditionNames } from '#lib/framework';
import { joinAnd, send } from '#lib/utilities';
import { bold } from '@discordjs/builders';
import type { ChatInputCommandDeniedPayload, Preconditions, UserError } from '@sapphire/framework';
import { Events, Identifiers, Listener } from '@sapphire/framework';
import { Constants, MessageEmbed } from 'discord.js';

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ChatInputCommandDenied, event: Events.ChatInputCommandDenied });
  }

  public async run(error: UserError, payload: ChatInputCommandDeniedPayload) {
    const embed = new MessageEmbed({ color: Constants.Colors.RED });

    this.renderEmbedBasedOnThePreconditionSapphireHasThrownErrorTo(embed, error, payload);
    await send(payload.interaction, builder => builder.addEmbed(() => embed));
  }

  private renderEmbedBasedOnThePreconditionSapphireHasThrownErrorTo(embed: MessageEmbed, error: UserError, _payload: ChatInputCommandDeniedPayload): void {
    switch (error.identifier as Identifiers & PreconditionNames) {
      case PreconditionNames.UserStaffPermissions: {
        embed.setTitle('Missing Staff Permissions').setDescription(`You need to have the configured staff role to run this command!`);
        break;
      }

      case PreconditionNames.UserOwnerOnly: {
        embed.setTitle('Missing Owner Privileges').setDescription('You must be the bot owner to run this command.');
        break;
      }

      case PreconditionNames.UserStatus: {
        embed.setTitle('User Blocked').setDescription("You're currently blocked from using this bot.");
        break;
      }

      case PreconditionNames.UserAccountAge: {
        embed.setTitle('Account Too New').setDescription('Your account is too young to use this bot.');
        break;
      }

      case PreconditionNames.GuildStatus: {
        embed.setTitle('Server Blocked').setDescription(error.message);
        break;
      }

      case Identifiers.PreconditionClientPermissions: {
        const context = <Preconditions['ClientPermissions']>error.context;
        embed.setTitle('Missing Bot Permissions').setDescription(`I'm missing the ${bold(joinAnd(context.permissions.toArray()))} permissions.`);
        break;
      }

      case Identifiers.PreconditionClientPermissionsNoClient: {
        embed.setTitle('Missing Bot Identity').setDescription(error.message);
        break;
      }

      case Identifiers.PreconditionClientPermissionsNoPermissions: {
        embed.setTitle('Missing Bot Permissions').setDescription(error.message);
        break;
      }

      case Identifiers.PreconditionCooldown: {
        embed.setTitle('On Cooldown').setDescription(error.message);
        break;
      }

      case Identifiers.PreconditionDMOnly:
      case Identifiers.PreconditionGuildNewsOnly:
      case Identifiers.PreconditionGuildNewsThreadOnly:
      case Identifiers.PreconditionGuildOnly:
      case Identifiers.PreconditionGuildPrivateThreadOnly:
      case Identifiers.PreconditionGuildPublicThreadOnly:
      case Identifiers.PreconditionGuildTextOnly: {
        embed.setTitle('Channel Blocked').setDescription('Oops! This command does not in this channel.');
        break;
      }

      case Identifiers.PreconditionMissingChatInputHandler:
      case Identifiers.PreconditionMissingContextMenuHandler:
      case Identifiers.PreconditionMissingMessageHandler: {
        embed.setTitle("I'm Clueless").setDescription('IDK but this command does not run from this command type anymore.');
        break;
      }

      case Identifiers.PreconditionNSFW: {
        embed.setTitle('NSFW Only').setDescription('This command is for NSFW channels only.');
        break;
      }

      case Identifiers.PreconditionThreadOnly: {
        embed.setTitle('Threads Only').setDescription('You cannot use this command outside threads.');
        break;
      }

      case Identifiers.PreconditionUserPermissions: {
        const context = <Preconditions['UserPermissions']>error.context;
        embed
          .setTitle('Missing User Permissions')
          .setDescription(`You don't have the ${bold(joinAnd(context.permissions.toArray()))} permissions to run this command!`);
        break;
      }
    }
  }
}
