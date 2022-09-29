import type { Client } from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { createComponentId, join, MessageContentBuilder, type SelectMenuBuilder } from '#lib/utilities';
import { bold } from '@discordjs/builders';
import { Resolvers } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';
import type { CommandInteraction, MessageEditOptions, MessageOptions, MessageSelectOptionData } from 'discord.js';
import { DonationDeskSchema } from './donation-desk.schema.js';

export class DonationDeskManager extends Manager<DonationDeskSchema> {
  public constructor(client: Client) {
    super({ client, name: 'dank-memer.donation-desk', holds: DonationDeskSchema });
  }

  public async sendOrUpdateMessage(db: DonationDeskSchema.Document, command: CommandInteraction<'cached'>): Promise<boolean> {
    if (isNullOrUndefined(db.channels.desk.id) || isNullOrUndefined(db.channels.desk.message)) return false;

    const channel = Resolvers.resolveGuildTextChannel(db.channels.desk.id, command.guild);
    if (channel.isErr()) {
      if (!isNullOrUndefined(db.channels.desk.id)) await db.run((db) => db.channels.desk.update({ id: null, message: null })).save();
      return false;
    }

    const message = await command.fetchReply();
    const srcMessage = await Resolvers.resolveMessage(db.channels.desk.message, { messageOrInteraction: message, channel: channel.unwrap() });
    if (!db.entries.entries.length && srcMessage.isOk()) {
      await srcMessage.unwrap().delete();
      await db.run((db) => db.channels.desk.setMessage(null)).save();
      return false;
    }

    const messageContent = new MessageContentBuilder<SelectMenuBuilder>()
      .setContent(null)
      .addEmbed((embed) => embed.setDescription(join(bold("Welcome to our server's donation desk!"), 'Use the dropdown below to get started.')))
      .addRow((row) =>
        row.addSelectMenuComponent((menu) =>
          menu
            .setCustomId(createComponentId('menu').toString())
            .setPlaceholder('Select a donation category')
            .setOptions(
              db.entries.entries.map(
                (e) =>
                  <MessageSelectOptionData>{
                    label: e.name,
                    description: e.description,
                    default: false,
                    value: e.id
                  }
              )
            )
        )
      );

    try {
      if (srcMessage.isOk()) {
        await srcMessage.unwrap().edit(messageContent as MessageEditOptions);
      } else {
        await channel.unwrap().send(messageContent as MessageOptions);
      }

      return true;
    } catch {
      return false;
    }
  }
}
