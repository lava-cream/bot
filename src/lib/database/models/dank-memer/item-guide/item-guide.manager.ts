import type DatabaseClient from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { ItemGuideSchema } from './item-guide.schema.js';

import type { ItemGuideCategorySchema, ItemGuideCategoryItemSchema } from './item-guide.category.schema.js';
import { isNullOrUndefined } from '@sapphire/utilities';
import { Resolvers } from '@sapphire/framework';
import { type Guild, Constants, MessageEmbed } from 'discord.js';
import { MessageContentBuilder } from '#lib/utilities';
import { inlineCode, underscore, bold } from '@discordjs/builders';
import { Result } from '@sapphire/result';

export const enum ItemGuideItemUpdateType {
  Name = 1,
  Price = 2,
  Hidden = 3
}

export interface ItemGuideItemUpdateOptions {
  guild: Guild;
  db: ItemGuideSchema.Document;
  category: ItemGuideCategorySchema;
  type: ItemGuideItemUpdateType;
}

export class ItemGuideManager extends Manager<ItemGuideSchema> {
  public constructor(client: DatabaseClient) {
    super({ client, name: 'dank-memer.item-guide', holds: ItemGuideSchema });
  }

  public async sendItemUpdate(
    oldItem: ItemGuideCategoryItemSchema,
    newItem: ItemGuideCategoryItemSchema,
    options: ItemGuideItemUpdateOptions
  ): Promise<boolean> {
    const { db, category, guild, type } = options;
    const embed = new MessageEmbed()
      .setTitle(bold(`${category.name} / ${underscore(newItem.name)}`))
      .setColor(Constants.Colors.NOT_QUITE_BLACK)
      .setFooter({ text: `${category.id}.${newItem.id}` });

    if (isNullOrUndefined(db.channels.updates)) return false;

    const resolvedChannel = Resolvers.resolveGuildTextChannel(db.channels.updates, guild);
    if (resolvedChannel.isErr()) return false;

    switch (type) {
      case ItemGuideItemUpdateType.Name: {
        embed.addFields({ name: 'Previous Name', value: oldItem.name, inline: true }, { name: 'New Name', value: newItem.name, inline: true });
        break;
      }

      case ItemGuideItemUpdateType.Price: {
        embed.addFields(
          { name: 'Previous Price', value: inlineCode(oldItem.price.toLocaleString()), inline: true },
          { name: 'New Price', value: inlineCode(newItem.price.toLocaleString()), inline: true },
          { name: 'Difference', value: inlineCode((newItem.price - oldItem.price).toLocaleString()), inline: false }
        );
        break;
      }

      case ItemGuideItemUpdateType.Hidden: {
        embed.addFields({ name: 'Currently Hidden', value: inlineCode(newItem.hidden.toString()), inline: true });
        break;
      }
    }

    const content = new MessageContentBuilder().addEmbed(() => embed);
    const sent = await Result.fromAsync(resolvedChannel.unwrap().send(content));

    return sent.isOk();
  }
}
