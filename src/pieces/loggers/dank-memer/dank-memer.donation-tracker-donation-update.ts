import { ApplyOptions } from '@sapphire/decorators';

import type { DonationTrackerCategorySchema } from '#lib/database/models/dank-memer/donation-tracker/donation-tracker.category.schema.js';
import { BaseLoggerPayload, LoggerType } from '#lib/framework/structures/logger/resources/logger.entries.js';
import { Logger } from '#lib/framework/structures/logger/resources/logger.piece.js';
import { getUserAvatarURL, MessageContentBuilder } from '#lib/utilities';
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

    for (const entry of tracker.categories.entries.values()) {
      if (isNullOrUndefined(entry.logs.id)) continue;

      await Resolvers.resolveGuildTextChannel(entry.logs.id, guild)
        .inspect((channel) => this.createHandler(guild.id, channel.id))
        .inspectErrAsync(() => tracker.run(() => entry.logs.setId(null)).save());
    }
  }

  public renderContent({ context, amount, method }: DonationUpdateLoggerPayload, builder: MessageContentBuilder) {
    builder.addEmbed((embed) => {
      embed
        .setTitle(`${context.donation.name} Donation`)
        .setURL(context.referencedMessage.url)
        .setThumbnail(getUserAvatarURL(context.donator.user))
        .setColor(Constants.Colors.BLURPLE)
        .addFields({ name: 'Generous Donator', value: `${context.donator.toString()} (${context.donator.id})` })
        .setFooter({
          text: context.donator.id,
          iconURL: getUserAvatarURL(context.donator.user)
        })
        .setTimestamp(new Date());

      switch (method) {
        case DonationUpdateMethod.Increment: {
          const withMultiplier = context.donation.multiplier * amount.amount;
          embed.addFields({
            name: 'Added Amount',
            value: inlineCode(`⏣ ${withMultiplier.toLocaleString()} (+${(withMultiplier - amount.amount).toLocaleString()}})`)
          });
          break;
        }

        case DonationUpdateMethod.Decrement: {
          embed.addFields({ name: 'Deducted Amount', value: inlineCode(`⏣ ${amount.amount.toLocaleString()}`) });
          break;
        }
      }

      embed.addFields(
        { name: 'Weekly Donations', value: inlineCode(amount.season.toLocaleString()) },
        { name: 'Responsible Staff', value: `${context.staff.toString()} (${context.staff.id})` }
      );

      return embed;
    });
  }
}
