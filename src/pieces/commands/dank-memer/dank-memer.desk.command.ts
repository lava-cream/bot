import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';

import type { DonationDeskEntrySchema } from '#lib/database';
import { Collector, commandHasOption, edit, InteractionMessageContentBuilder, seconds } from '#lib/utilities';
import { Result } from '@sapphire/result';
import { isNullOrUndefined } from '@sapphire/utilities';
import type { TextChannel } from 'discord.js';
import { Constants } from 'discord.js';
import { ChannelType } from 'discord.js/node_modules/discord-api-types/v9.js';
import { CommandError } from '#lib/framework';

/**
 * Command Usage:
 *
 * desk create [id: string, name: string, description: string]
 * desk config [channel: TextChannel, access_role: Role, staff_role: Role]
 * desk edit
 * desk delete
 * desk channel [channel: TextChannel]
 */

const SubCommands = {
  Create: {
    name: 'create',
    options: {
      Identifier: 'id',
      Name: 'name',
      Description: 'description'
    }
  },
  Config: {
    name: 'config',
    options: {
      AccessChannel: 'access_channel',
      AccessRole: 'access_role',
      StaffRole: 'staff_role'
    }
  },
  Edit: {
    name: 'edit',
    options: {
      Identifier: 'id',
      Name: 'name',
      Description: 'description'
    }
  },
  Delete: 'delete',
  Channel: {
    name: 'channel',
    options: {
      Channel: 'channel'
    }
  }
} as const;

@ApplyOptions<Command.Options>({
  name: 'desk',
  description: "Manage the server's donation desk.",
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class DeskCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const db = await this.container.db.desks.fetch(command.guildId);

    switch (command.options.getSubcommand()) {
      case SubCommands.Create.name: {
        const { Identifier, Name, Description } = SubCommands.Create.options;

        const id = command.options.getString(Identifier, true);
        const name = command.options.getString(Name, true);
        const description = command.options.getString(Description, true);

        if (db.entries.resolve(id)) throw new CommandError('Lmao that entry with that ID exists already.');

        await db.run((db) => db.entries.create({ id, name, description })).save();
        await this.container.db.desks.sendOrUpdateMessage(db, command);

        return await edit(command, 'Done.');
      }

      case SubCommands.Config.name: {
        const { AccessChannel, AccessRole, StaffRole } = SubCommands.Config.options;

        if (!db.entries.entries.length) throw new CommandError("This server don't have any desk entries to configure.");

        const accessChannel = commandHasOption(command, AccessChannel, 'CHANNEL') ? (command.options.getChannel(AccessChannel) as TextChannel) : null;
        const accessRole = commandHasOption(command, AccessRole, 'ROLE') ? command.options.getRole(AccessRole) : null;
        const staffRole = commandHasOption(command, StaffRole, 'ROLE') ? command.options.getRole(StaffRole) : null;

        if ([accessChannel, accessRole, staffRole].every(isNullOrUndefined)) throw new CommandError('You gotta select at least one option lmao.');

        const desk = await this.awaitDeskEntry(command, db.entries.entries);
        if (!desk.isOk()) throw new CommandError('Lmao you have to respond, idiot.');

        desk.inspect((desk) => {
          if (!isNullOrUndefined(accessRole)) desk.roles.setAccess(accessRole.id);
          if (!isNullOrUndefined(staffRole)) desk.roles.setStaff(staffRole.id);
          if (!isNullOrUndefined(accessChannel)) db.channels.setAccess(accessChannel.id);
        });

        await db.save();
        await this.container.db.desks.sendOrUpdateMessage(db, command);

        return await edit(command, (builder) => builder.setContent('Done.').setRows().setEmbeds());
      }

      case SubCommands.Edit.name: {
        const { Identifier, Name, Description } = SubCommands.Edit.options;

        if (!db.entries.entries.length) throw new CommandError("This server don't have any desk entries to configure.");

        const desk = await this.awaitDeskEntry(command, db.entries.entries);
        if (!desk.isOk()) throw new CommandError('Lmao waiting here is illegal.');

        const id = commandHasOption(command, Identifier, 'STRING') ? command.options.getString(Identifier) : null;
        const name = commandHasOption(command, Name, 'STRING') ? command.options.getString(Name) : null;
        const description = commandHasOption(command, Description, 'STRING') ? command.options.getString(Description) : null;

        if ([id, name, description].every(isNullOrUndefined)) throw new CommandError('You gotta select at least one option lmao.');

        desk.inspect((desk) => {
          if (!isNullOrUndefined(name)) desk.setName(name);
          if (!isNullOrUndefined(description)) desk.setDescription(description);
        });

        await db.save();
        await this.container.db.desks.sendOrUpdateMessage(db, command);

        return await edit(command, (builder) => builder.setContent('Done.').setRows().setEmbeds());
      }

      case SubCommands.Delete: {
        if (!db.entries.entries.length) throw new CommandError("This server don't have any desk entries to configure.");

        const desk = await this.awaitDeskEntry(command, db.entries.entries);
        if (!desk.isOk()) throw new CommandError('Lmao you have to choose an entry to delete SMH.');

        await db.run((db) => db.entries.delete(desk.unwrap().id)).save();
        await this.container.db.desks.sendOrUpdateMessage(db, command);

        return await edit(command, (builder) => builder.setContent('Done.').setRows().setEmbeds());
      }
    }

    return;
  }

  private async awaitDeskEntry(
    command: CommandInteraction<'cached'>,
    entries: DonationDeskEntrySchema[]
  ): Promise<Result<DonationDeskEntrySchema, null>> {
    return Result.fromAsync(async () => {
      try {
        return await new Promise(async (resolve, reject) => {
          const collector = new Collector({
            message: await edit(command, this.renderPickerContent(entries, false)),
            componentType: 'BUTTON',
            time: seconds(30),
            max: Infinity,
            filter: async (button) => {
              const contextual = button.user.id === command.user.id;
              await button.deferUpdate();
              return contextual;
            },
            end: async (ctx) => {
              if (ctx.wasInternallyStopped()) {
                await edit(command, this.renderPickerContent(entries, true));
                return reject(null);
              }
            }
          });

          for (const entry of entries.values()) {
            collector.actions.add(entry.id, async (ctx) => {
              ctx.collector.stop(entry.id);
              return resolve(entry);
            });
          }

          await collector.start();
        });
      } catch {
        throw null;
      }
    });
  }

  private renderPickerContent(entries: DonationDeskEntrySchema[], failed: boolean): InteractionMessageContentBuilder {
    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle('Desk Entry Picker')
          .setColor(failed ? Constants.Colors.RED : Constants.Colors.NOT_QUITE_BLACK)
          .setDescription(failed ? 'SMH stop wasting my time.' : 'Please select an entry below to continue.')
      )
      .addRow((row) =>
        entries.reduce(
          (row, entry) =>
            row.addButtonComponent((btn) =>
              btn.setCustomId(entry.id).setLabel(entry.name).setStyle(Constants.MessageButtonStyles.SECONDARY).setDisabled(failed)
            ),
          row
        )
      );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Create.name)
            .setDescription('Create a donation desk.')
            .addStringOption((opt) =>
              opt.setName(SubCommands.Create.options.Identifier).setDescription('The id of the donation desk entry.').setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName(SubCommands.Create.options.Name).setDescription('The name of the donation desk entry.').setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName(SubCommands.Create.options.Description).setDescription('The description of the donation desk entry.').setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Config.name)
            .setDescription('Configure the necessary configurations for access roles/channels of an existing donation desk.')
            .addChannelOption((opt) =>
              opt
                .setName(SubCommands.Config.options.AccessChannel)
                .setDescription('The access channel where the donator should negotiate with the staff about their donation.')
                .addChannelTypes(ChannelType.GuildText)
            )
            .addRoleOption((opt) =>
              opt.setName(SubCommands.Config.options.AccessRole).setDescription('The access role to grant towards the donator.')
            )
            .addRoleOption((opt) => opt.setName(SubCommands.Config.options.StaffRole).setDescription('The staff role to ping.'))
        )
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Edit.name)
            .setDescription('Edits an existing donation desk entry.')
            .addStringOption((opt) => opt.setName(SubCommands.Create.options.Identifier).setDescription('The id of the donation desk entry to edit.'))
            .addStringOption((opt) => opt.setName(SubCommands.Create.options.Name).setDescription('The new name of the donation desk entry.'))
            .addStringOption((opt) =>
              opt.setName(SubCommands.Create.options.Description).setDescription('The new description of the donation desk entry.')
            )
        )
        .addSubcommand((sub) => sub.setName(SubCommands.Delete).setDescription('Deletes an existing donation desk.'))
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Channel.name)
            .setDescription('Configure the main desk channel.')
            .addChannelOption((opt) =>
              opt
                .setName(SubCommands.Channel.options.Channel)
                .setDescription('The access channel.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        )
    );
  }
}
