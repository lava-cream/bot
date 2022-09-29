import type { DonationTrackerCategorySchema, DonationTrackerCategoryDonatorSchema } from './donation-tracker.category.schema.js';
import type { Client } from '#lib/database/client/client.js';
import { DonationUpdateLoggerPayload, DonationUpdateMethod } from '#pieces/loggers/dank-memer/dank-memer.donation-tracker-donation-update.js';
import { Manager } from '#lib/database/structures/manager.js';
import { DonationTrackerSchema } from './donation-tracker.schema.js';
import { isNullOrUndefined } from '@sapphire/utilities';
import { container, Resolvers } from '@sapphire/framework';
import { LoggerType } from '#lib/framework';
import { Result } from '@sapphire/result';
import type { GuildMember, Role } from 'discord.js';
import { toCollection } from '#lib/utilities';

export class DonationTrackerManager extends Manager<DonationTrackerSchema> {
  public constructor(client: Client) {
    super({ client, name: 'dank-memer.donation-tracker', holds: DonationTrackerSchema });
  }

  public async resolveOrCreateDonator(
    db: DonationTrackerSchema.Document,
    category: DonationTrackerCategorySchema,
    donatorId: string
  ): Promise<DonationTrackerCategoryDonatorSchema> {
    const donator = category.donators.resolve(donatorId);
    if (!isNullOrUndefined(donator)) return donator;

    const newDonator = category.donators.create({ id: donatorId, amount: 0, count: 0 });
    await db.save();

    return newDonator;
  }

  public async updateDonator(db: DonationTrackerSchema.Document, options: DonationUpdateLoggerPayload): Promise<boolean> {
    const { amount, context, method } = options;
    const category = db.categories.resolve(context.donation.id);
    const donator =
      category?.donators.resolve(context.donator.user.id) ?? category?.donators.create({ id: context.donator.user.id, amount: 0, count: 0 });
    if (isNullOrUndefined(category) || isNullOrUndefined(donator)) return false;

    const addedAmount = Math.round(amount.amount * category.multiplier);
    const addedSeason = Math.round(amount.season * category.multiplier);

    donator.season.setValue(donator.season.value + addedSeason);
    donator.setAmount(donator.amount + addedAmount).setCount(donator.count + (method === DonationUpdateMethod.Increment ? 1 : 0));

    await db.save();
    await this.syncDonatorAutorole(db, category, context.donator);

    const logged = await Result.fromAsync<void, false>(async () => {
      if (isNullOrUndefined(category.logs.id)) throw false;

      const channel = Resolvers.resolveGuildChannel(category.logs.id, options.guild);
      if (!channel.isOk() || !channel.unwrap().isText()) throw false;

      return void (await container.stores.get('loggers').get(LoggerType.DonationUpdate).log(options));
    });

    return logged.isOk();
  }

  public async syncDonatorAutorole(
    db: DonationTrackerSchema.Document,
    category: DonationTrackerCategorySchema,
    member: GuildMember
  ): Promise<Role[]> {
    const donator = await this.resolveOrCreateDonator(db, category, member.user.id);
    if (db.autoroles.entries.length < 1) return [];

    const rolesToSet = toCollection([], member.roles.cache.clone());
    for (const autorole of db.autoroles.entries.values()) rolesToSet.delete(autorole.id);

    const eligibleAutoroles = db.autoroles.entries.sort((a, b) => b.amount - a.amount).filter((e) => donator.amount >= e.amount);
    const mappedEligibleRoles = eligibleAutoroles
      .map((ear) => member.guild.roles.resolve(ear.id))
      .filter<Role>((r): r is Role => !isNullOrUndefined(r));

    await member.roles.set(toCollection(mappedEligibleRoles, rolesToSet));
    return mappedEligibleRoles;
  }
}
