import { ApplyOptions } from '@sapphire/decorators';

import type { DonationTrackerCategorySchema } from '#lib/database/models/dank-memer/donation-tracker/donation-tracker.category.schema.js';
import { BaseLoggerPayload, LoggerType } from '#lib/framework/structures/logger/resources/logger.entries.js';
import { Logger } from '#lib/framework/structures/logger/resources/logger.piece.js';
import { getUserAvatarURL, isPromiseFulfilled, MessageContentBuilder } from '#lib/utilities';
import { inlineCode } from '@discordjs/builders';
import { Resolvers } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';
import { Constants, Guild, GuildMember, Message, User } from 'discord.js';

declare module '#lib/framework/structures/logger/resources/logger.entries' {
  interface Loggers {
    [LoggerType.DonationUpdate]: DonationUpdateLoggerPayload;
  }
}

export interface DonationUpdateLoggerPayload extends BaseLoggerPayload {
  method: DonationUpdateMethod;
  amount: Record<'amount' | 'season', number>;
  context: {
    donation: DonationTrackerCategorySchema;
    staff: User;
    donator: GuildMember;
    referencedMessage: Message<true>;
  };
}

export enum DonationUpdateMethod {
  Increment = 1,
  Decrement = 2
}

@ApplyOptions<Logger.Options<LoggerType.DonationUpdate>>({
  id: LoggerType.DonationUpdate,
  name: 'Donation Update'
})
export class DonationUpdateLogger extends Logger<LoggerType.DonationUpdate> {
  public async sync(guild: Guild) {
    const tracker = await this.container.db.trackers.fetch(guild.id);
    const channels = await Promise.allSettled(
      tracker.categories.categories.map(async (c) => {
        if (isNullOrUndefined(c.logs.id)) return null;

        const channel = await Resolvers.resolveGuildTextChannel(c.logs.id, guild);
        if (channel.isErr()) {
          await tracker.run(() => c.logs.update({ id: null, enabled: false })).save();
          return null;
        }

        return channel.unwrap();
      })
    );

    for (const channel of channels) {
      if (!isPromiseFulfilled(channel) || isNullOrUndefined(channel.value)) continue;
      this.createHandler(guild.id, channel.value.id);
    }
  }

  public renderContent({ context, amount, method }: DonationUpdateLoggerPayload) {
    return new MessageContentBuilder().addEmbed((embed) => {
      embed
        .setTitle(`${context.donation.name} Donation`)
        .setURL(context.referencedMessage.url)
        .setThumbnail(getUserAvatarURL(context.donator.user))
        .setColor(Constants.Colors.BLURPLE)
        .addField('Generous Donator', `${context.donator.toString()} (${context.donator.id})`)
        .setFooter({
          text: context.donator.id,
          iconURL: getUserAvatarURL(context.donator.user)
        })
        .setTimestamp(new Date());

      switch (method) {
        case DonationUpdateMethod.Increment: {
          const withMultiplier = context.donation.multiplier * amount.amount;
          embed.addField('Added Amount', inlineCode(`⏣ ${withMultiplier.toLocaleString()} (+${(withMultiplier - amount.amount).toLocaleString()}})`));
          break;
        }

        case DonationUpdateMethod.Decrement: {
          embed.addField('Deducted Amount', inlineCode(amount.amount.toLocaleString()));
          break;
        }
      }

      embed.addField('Weekly Donations', inlineCode(amount.season.toLocaleString()));
      embed.addField('Responsible Staff', `${context.staff.toString()} (${context.staff.id})`);

      return embed;
    });
  }
}
