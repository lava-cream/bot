import { PreconditionNames } from '#lib/framework';
import { createEmbed, send } from '#lib/utilities';
import { time, TimestampStyles } from '@discordjs/builders';
import type { ChatInputCommandDeniedPayload, Preconditions, UserError } from '@sapphire/framework';
import { Events, Identifiers, Listener } from '@sapphire/framework';
import { Constants, Permissions } from 'discord.js';

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
  public constructor(context: Listener.Context) {
    super(context, { event: Events.ChatInputCommandDenied });
  }

  public async run(error: UserError, payload: ChatInputCommandDeniedPayload) {
    const embed = createEmbed(embed => embed.setColor(Constants.Colors.DARK_BUT_NOT_BLACK));

    if (this.isClientMissingPermissions(error, error.context)) {
      embed;
    } else if (this.isClientPermissionsNoClient(error)) {
      embed.setDescription("The bot can't check its permission from this channel.");
    } else if (this.isClientHasZeroPermissions(error)) {
      embed.setDescription("The bot does not have any of the required permissions to run the command in this channel.");
    } else if (this.isCooldown(error, error.context)) {
      embed.setDescription(`You're in cooldown. You can use this command again ${time(new Date().getTime() + error.context.delay, TimestampStyles.RelativeTime)}.`);
    } else if (this.isChannelTypeMismatched(error)) {
      embed.setDescription("This command should not be ran on text channels like this.");
    } else if (this.isMissingCommandHandler(error)) {
      embed.setDescription("This command exists, but it doesn't run. Why?");
    } else if (this.isNSFW(error)) {
      embed.setDescription('You cannot run this command outside NSFW channels.');
    } else if (this.isThreadOnly(error)) {
      embed.setDescription('You cannot run this command outside threads.');
    } else if (this.isUserPermissions(error, error.context)) {
      embed;
    } else if (this.isUserMissingStaffPermissions(error)) {
      embed.setDescription('You need to be a server staff to use this command.');
    } else if (this.isOwnerOnly(error)) {
      embed.setDescription('This command is not available for you.');
    } else if (this.isUserStatusBlocked(error)) {
      embed.setDescription("You're currently blocked for using this bot.");
    } else if (this.isUserAccountYoung(error)) {
      embed.setDescription('Your account is too young to use this bot!');
    } else if (this.isGuildStatusBlocked(error)) {
      embed.setDescription("This server is currently blocked from using this bot.");
    } else {
      embed.setDescription('You cannot run this command. I wonder why.');
      this.container.logger.error(`"${payload.interaction.user.tag} (${payload.interaction.user.id})" was blocked from using "${payload.context.commandName}" for an unknown reason`, { error, payload });
    }

    await send(payload.interaction, (builder) => builder.addEmbed(() => embed));
  }

  public isUserMissingStaffPermissions(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === PreconditionNames.UserStaffPermissions;
  }

  public isOwnerOnly(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === PreconditionNames.UserOwnerOnly;
  }

  public isUserStatusBlocked(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === PreconditionNames.UserStatus;
  }

  public isUserAccountYoung(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === PreconditionNames.UserAccountAge;
  }

  public isGuildStatusBlocked(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === PreconditionNames.GuildStatus;
  }

  public isClientMissingPermissions(error: UserError, context: unknown): context is Preconditions['ClientPermissions'] {
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionClientPermissions && Reflect.get(context as object, 'permissions') instanceof Permissions;
  }

  public isClientPermissionsNoClient(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionClientPermissionsNoClient;
  }

  public isClientHasZeroPermissions(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionClientPermissionsNoPermissions;
  }

  public isCooldown(error: UserError, context: unknown): context is Preconditions['Cooldown'] {
    const cooldownContextKeys = ['scope', 'delay', 'limit', 'filteredUsers']satisfies (keyof Preconditions['Cooldown'])[];
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionCooldown && cooldownContextKeys.some(key => Reflect.has(context as object, key));
  }

  public isChannelTypeMismatched(error: UserError): boolean {
    return [
      Identifiers.PreconditionDMOnly,
      Identifiers.PreconditionGuildNewsOnly,
      Identifiers.PreconditionGuildNewsThreadOnly,
      Identifiers.PreconditionGuildOnly,
      Identifiers.PreconditionGuildPrivateThreadOnly,
      Identifiers.PreconditionGuildPublicThreadOnly,
      Identifiers.PreconditionGuildTextOnly
    ].includes(error.identifier as Identifiers);
  }

  public isMissingCommandHandler(error: UserError): boolean {
    return [Identifiers.PreconditionMissingChatInputHandler, Identifiers.PreconditionMissingContextMenuHandler, Identifiers.PreconditionMissingMessageHandler].includes(error.identifier as Identifiers);
  }

  public isNSFW(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionNSFW;
  }

  public isThreadOnly(error: UserError): boolean {
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionThreadOnly;
  }

  public isUserPermissions(error: UserError, context: unknown): context is Preconditions['UserPermissions'] {
    return Reflect.get(error, 'identifier') === Identifiers.PreconditionUserPermissions &&
      Reflect.has(context as object, 'permissions') &&
      Reflect.get(context as object, 'permissions') instanceof Permissions;
  }
}
