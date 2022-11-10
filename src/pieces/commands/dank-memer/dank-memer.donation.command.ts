import { CommandInteraction, Constants, MessageSelectOptionData, TextChannel } from 'discord.js';
import { ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';

import { chunk, isNullOrUndefined } from '@sapphire/utilities';
import { DonationTrackerCategorySchema, DonationTrackerCategoryStatus, DonationTrackerSchema } from '#lib/database';
import { DeferCommandInteraction, ButtonBuilder, Collector, ComponentId, edit, getUserAvatarURL, InteractionMessageContentBuilder, seconds, send, paginate, MessageContentBuilder, randomColor, join, randomItem } from '#lib/utilities';
import { bold, channelMention, inlineCode } from '@discordjs/builders';
import { DonationUpdateMethod } from '#pieces/loggers/dank-memer/dank-memer.donation-tracker-donation-update';
import { CommandError, CommandOptionError } from '#lib/framework';

@ApplyOptions<Subcommand.Options>({
  name: 'donation',
  description: "Manage the server's donations.",
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  subcommands: [
    {
      name: 'create',
      type: 'group',
      entries: [
        {
          name: 'category',
          chatInputRun: 'chatInputCreateCategory'
        },
        {
          name: 'autorole',
          chatInputRun: 'chatInputCreateAutorole'
        }
      ]
    },
    {
      name: 'delete',
      type: 'group',
      entries: [
        {
          name: 'category',
          chatInputRun: 'chatInputDeleteCategory'
        },
        {
          name: 'autorole',
          chatInputRun: 'chatInputDeleteAutorole'
        }
      ]
    },
    {
      name: 'weekly',
      type: 'group',
      entries: [
        {
          name: 'leaderboard',
          chatInputRun: 'chatInputWeeklyLeaderboard'
        },
        {
          name: 'reset',
          chatInputRun: 'chatInputWeeklyReset'
        }
      ]
    },
    {
      name: 'logs',
      type: 'group',
      entries: [
        {
          name: 'set',
          chatInputRun: 'chatInputLogsSet',
        },
        {
          name: 'disable',
          chatInputRun: 'chatInputLogsDisable'
        }
      ]
    },
    {
      name: 'default',
      chatInputRun: 'chatInputDefault'
    },
    {
      name: 'add',
      chatInputRun: 'chatInputAdd'
    },
    {
      name: 'subtract',
      chatInputRun: 'chatInputSubtract'
    },
    {
      name: 'profile',
      chatInputRun: 'chatInputProfile'
    },
    {
      name: 'leaderboard',
      chatInputRun: 'chatInputLeaderboard'
    },
  ]
})
export default class DonationCommand extends Subcommand {
  @DeferCommandInteraction()
  public async chatInputCreateCategory(command: CommandInteraction<'cached'>) {
    const id = command.options.getString('id', true);
    const name = command.options.getString('name', true);
    const multiplier = command.options.getNumber('multiplier') ?? 1;
    const logs = command.options.getChannel('logs') as TextChannel | null;
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = db.categories.resolve(id);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'A category with that id already exists.', option: 'id' });

    await db.run(db => db.categories.create({ id, name, multiplier, logs: logs?.id, default: false, status: DonationTrackerCategoryStatus.Enabled })).save();
    await edit(command, builder =>
      builder
        .addEmbed(embed =>
          embed
            .setTitle('Category Created')
            .setColor(Constants.Colors.GREEN)
            .setDescription(`The new ${bold(name)} donation category has been created.`)
            .addFields(
              {
                name: 'ID',
                value: id,
                inline: true
              },
              {
                name: 'Multiplier',
                value: `${inlineCode(multiplier.toLocaleString())}x`,
                inline: true
              },
              {
                name: 'Logs',
                value: !isNullOrUndefined(logs) ? channelMention(logs.id) : 'none',
                inline: true
              }
            )
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputCreateAutorole(command: CommandInteraction<'cached'>) {
    const role = command.options.getRole('role', true);
    const amount = command.options.getNumber('amount', true);
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedAutorole = db.autoroles.resolve(role.id);
    if (!isNullOrUndefined(resolvedAutorole)) throw new CommandOptionError({ message: 'That autorole already exists.', option: 'role' });

    await db.run(db => db.autoroles.create({ id: role.id, amount })).save();
    await edit(command, builder =>
      builder
        .addEmbed(embed =>
          embed
            .setTitle('Autorole Created')
            .setColor(Constants.Colors.RED)
            .setDescription(`The new ${role.toString()} autorole has been created.`)
            .addFields({
              name: 'Minimum Amount Required',
              value: amount.toLocaleString()
            })
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputDeleteCategory(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('id', true);
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = db.categories.resolve(category);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'A category with that ID does not exist.', option: 'id' });

    await db.run(db => db.categories.delete(resolvedCategory.id)).save();
    await edit(command, builder =>
      builder
        .addEmbed(embed =>
          embed
            .setTitle('Category Deleted')
            .setColor(Constants.Colors.GREEN)
            .setDescription(`The ${bold(resolvedCategory.name)} donation category has been deleted successfully.`)
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputDeleteAutorole(command: CommandInteraction<'cached'>) {
    const role = command.options.getRole('role', true);
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedAutorole = db.autoroles.resolve(role.id);
    if (isNullOrUndefined(resolvedAutorole)) throw new CommandOptionError({ message: 'The input did not resolve to an existing autorole.', option: 'role' });

    await db.run(db => db.autoroles.delete(role.id)).save();
    await edit(command, builder =>
      builder
        .addEmbed(embed =>
          embed
            .setTitle('Autorole Deleted')
            .setColor(Constants.Colors.GREEN)
            .setDescription(`The ${role.toString()} autorole has been deleted successfully.`)
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputWeeklyLeaderboard(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'The input did not resolve to an existing donation category.', option: 'category' });

    await paginate(
      command,
      chunk(resolvedCategory.donators.entries
        .sort((a, b) => b.season.value - a.season.value)
        .map((d, i) => {
          const member = command.guild.members.resolve(d.id);
          return `${bold(`#${i+1}`)} - ${inlineCode(d.season.value.toLocaleString())} - ${member?.user.tag ?? d.id}`;
        }), 
        5
      )
        .map((donators, index, arr) => 
          new MessageContentBuilder()
            .addEmbed(embed => 
              embed
                .setDescription(donators.join('\n'))
                .setColor(randomColor())
                .setFooter({ text: `Page ${index + 1}/${arr.length}` })
            )
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputWeeklyReset(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.trackers.fetch(command.guildId);

    const defaultCategory = db.categories.default;
    if (isNullOrUndefined(defaultCategory)) throw new CommandError({ message: "This server has not configured a default donation category. Please ask the server staff to do so." });

    const sorted = defaultCategory.donators.entries.sort((a, b) => b.season.value - a.season.value);
    await db.run(() => sorted.forEach((donator, index) => donator.season.setValue(0).setStreak(donator.season.streak + (+(index === 0))))).save();
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle("Weekly Leaderboard Reset")
            .setColor(Constants.Colors.GOLD)
            .setDescription(
              join(sorted
                .slice(0, 10)
                .map((d, i) => {
                  const emoji = ['🥇', '🥈', '🥉'].at(i) ?? '👏';
                  const member = command.guild.members.resolve(d.id);
                  return `${emoji} ${inlineCode(d.season.value.toLocaleString())} - ${member?.user.tag ?? d.id}`;
                }))
            )
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputLogsSet(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const logs = command.options.getChannel('channel', true) as TextChannel;
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'The input did not resolve into a valid donation category.', option: 'category' });

    await db.run(() => resolvedCategory.logs.setId(logs.id)).save();
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Logs Set')
            .setColor(Constants.Colors.GREEN)
            .setDescription(`Successfully configured the logs for ${bold(resolvedCategory.name)} to ${channelMention(logs.id)}.`)
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputLogsDisable(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'The input did not resolve into a valid donation category.', option: 'category' });

    await db.run(() => resolvedCategory.logs.setId(null)).save();
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Logs Disabled')
            .setColor(Constants.Colors.GREEN)
            .setDescription(`The logs channel for ${bold(resolvedCategory.name)} has been cleared.`)
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputDefault(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.trackers.fetch(command.guildId);
    const componentId = new ComponentId(new Date(command.createdTimestamp));

    const renderContent = (selected: DonationTrackerCategorySchema | null) => {
      return new InteractionMessageContentBuilder<ButtonBuilder>()
        .addEmbed(embed =>
          embed
            .setTitle('Select Category')
            .setColor(Constants.Colors.NOT_QUITE_BLACK)
            .setDescription('Choose the category you want to set as default.')
        )
        .addRow(row =>
          db.categories.entries
            .filter(entry => {
              const def = db.categories.default;
              return !isNullOrUndefined(def) ? def.id === entry.id : true;
            })
            .reduce(
              (row, category) =>
                row.addButtonComponent(btn =>
                  btn
                    .setCustomId(componentId.create(category.id).id)
                    .setStyle(category.id === selected?.id ? Constants.MessageButtonStyles.PRIMARY : Constants.MessageButtonStyles.SECONDARY)
                    .setLabel(category.name)
                    .setDisabled(!isNullOrUndefined(selected))
                ),
              row
            )
        )
    };

    const collector = new Collector({
      message: await edit(command, () => renderContent(null)),
      componentType: 'BUTTON',
      max: Infinity,
      time: seconds(60),
      filter: async button => {
        const contextual = button.user.id === command.user.id;
        await button.deferUpdate();
        return contextual;
      },
    });

    for (const category of db.categories.entries) {
      collector.actions.add(componentId.create(category.id).id, async ctx => {
        ctx.collector.stop(ctx.interaction.customId);
        await edit(ctx.interaction, () => renderContent(category));
        await send(ctx.interaction, builder => builder
          .addEmbed(embed =>
            embed
              .setTitle('Success')
              .setColor(Constants.Colors.GREEN)
              .setDescription(`Category ${bold(category.name)} has been successfully set as the default donation.`)
          )
        );
      });
    }

    await collector.start();
  }

  @DeferCommandInteraction()
  public async chatInputAdd(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const rawAmount = command.options.getNumber('amount', true);
    const member = command.options.getMember('user') ?? command.member;
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) {
      await edit(command, builder => builder.addEmbed(embed => embed.setTitle('Category Not Found').setColor(Constants.Colors.RED).setDescription('Cannot find that donation category.')));
      return;
    }

    const amount = Math.round(rawAmount * resolvedCategory.multiplier);
    const donator = DonationCommand.resolveCategoryDonator(member.user.id, resolvedCategory);
    // await db.run(() => donator.setAmount(amount + donator.amount).setCount(donator.count + 1).season.setValue(amount + donator.amount)).save();
    const message = await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Donation Added')
            .setColor(Constants.Colors.GREEN)
            .addFields(
              {
                name: 'Amount Added',
                value: `${rawAmount.toLocaleString()} (+${(amount - rawAmount).toLocaleString()})`,
              },
              {
                name: 'New Total',
                value: donator.amount.toLocaleString(),
                inline: true
              },
              {
                name: 'New Weekly Total',
                value: donator.season.value.toLocaleString(),
                inline: true,
              }
            )
            .setFooter({
              text: member.user.tag,
              iconURL: getUserAvatarURL(member.user)
            })
        )
    );

    await this.container.db.trackers.updateDonator(
      db,
      {
        amount: {
          amount,
          season: donator.season.value
        },
        guild: command.guild,
        method: DonationUpdateMethod.Decrement,
        context: {
          donator: member,
          referencedMessage: message,
          staff: command.member.user,
          donation: resolvedCategory,
        }
      }
    );
  }

  @DeferCommandInteraction()
  public async chatInputSubtract(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const amount = command.options.getNumber('amount', true);
    const member = command.options.getMember('user') ?? command.member;
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) {
      await edit(command, builder => builder.addEmbed(embed => embed.setTitle('Category Not Found').setColor(Constants.Colors.RED).setDescription('Cannot find that donation category.')));
      return;
    }

    const donator = DonationCommand.resolveCategoryDonator(member.user.id, resolvedCategory);
    // await db.run(() => donator.setAmount(donator.amount - amount).season.setValue(donator.season.value - amount)).save();
    const message = await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Donation Subtracted')
            .setColor(Constants.Colors.GREEN)
            .addFields(
              {
                name: 'Amount Removed',
                value: amount.toLocaleString()
              },
              {
                name: 'New Total',
                value: donator.amount.toLocaleString(),
                inline: true
              },
              {
                name: 'New Weekly Total',
                value: donator.season.value.toLocaleString(),
                inline: true
              }
            )
            .setFooter({
              text: member.user.tag,
              iconURL: getUserAvatarURL(member.user)
            })
        )
    );

    await this.container.db.trackers.updateDonator(
      db,
      {
        amount: {
          amount,
          season: donator.season.value
        },
        guild: command.guild,
        method: DonationUpdateMethod.Decrement,
        context: {
          donator: member,
          referencedMessage: message,
          staff: command.member.user,
          donation: resolvedCategory,
        }
      }
    );
  }

  @DeferCommandInteraction()
  public async chatInputProfile(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const member = command.options.getMember('user') ?? command.member;
    const db = await this.container.db.trackers.fetch(command.guildId);
    const componentId = new ComponentId(new Date(command.createdTimestamp));

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'The input did not resolve into an existing category.', option: 'category' });

    const renderContent = (category: DonationTrackerCategorySchema, ended: boolean) => {
      const donator = DonationCommand.resolveCategoryDonator(member.user.id, category);

      return new InteractionMessageContentBuilder()
        .addEmbed(embed => 
          embed  
            .setTitle(`${member.user.username}'s donation profile`)
            .setColor(randomColor())
            .setFields(
              {
                name: 'Total Donations',
                value: donator.amount.toLocaleString(),
                inline: true
              },
              {
                name: 'Weekly Donations',
                value: donator.season.value.toLocaleString(),
                inline: true
              },
              {
                name: 'Total Weekly Donations',
                value: donator.season.total.toLocaleString(),
                inline: true
              }
            )
        )
        .addRow(row => 
          row  
            .addSelectMenuComponent(menu => 
              menu  
                .setCustomId(componentId.create('categories').id)
                .setMaxValues(1)
                .setMinValues(1)
                .setDisabled(ended)
                .setOptions(
                  ...db.categories.entries.map(entry => (<MessageSelectOptionData>{
                    label: entry.name,
                    value: entry.id,
                    default: entry.id === category.id
                  }))
                )
            )
        )
    };

    const collector = new Collector({
      message: await edit(command, () => renderContent(randomItem(db.categories.entries), false)),
      componentType: 'SELECT_MENU',
      max: Infinity,
      time: seconds(60),
      filter: async menu => {
        const contextual = menu.user.id === command.user.id;
        await menu.deferUpdate();
        return contextual;
      }
    });

    collector.actions.add(componentId.create('categories').id, async ctx => {
      const selected = ctx.interaction.values.at(0);
      const selectedCategory = !isNullOrUndefined(selected) ? db.categories.resolve(selected) : null;
      if (isNullOrUndefined(selectedCategory)) return;

      await edit(ctx.interaction, () => renderContent(selectedCategory, false));
      return ctx.collector.resetTimer({ time: seconds(30) });
    });

    await collector.start();
  }

  @DeferCommandInteraction()
  public async chatInputLeaderboard(command: CommandInteraction<'cached'>) {
    const category = command.options.getString('category', true);
    const db = await this.container.db.trackers.fetch(command.guildId);

    const resolvedCategory = DonationCommand.resolveCategory(category, db);
    if (isNullOrUndefined(resolvedCategory)) throw new CommandOptionError({ message: 'The input did not resolve into an existing donation category.', option: 'category' });

    const sorted = resolvedCategory.donators.entries.sort((a, b) => b.amount - a.amount);
    const userPosition = sorted.findIndex(d => d.id === command.user.id) + 1; // if not found, this is 0 instead of -1
    const top10 = sorted.slice(0, 10);
    const userDonator = sorted.find(d => d.id === command.user.id) ?? DonationCommand.resolveCategoryDonator(command.user.id, resolvedCategory);

    await db.save();
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle(`Top ${top10.length} "${resolvedCategory.name}" Donators`)
            .setDescription(join(
              ...top10.map((donor, idx) => {
                const member = command.guild.members.resolve(donor.id);
                return `${bold(`#${idx + 1}`)} ${inlineCode(donor.amount.toLocaleString())} - ${member?.user.tag ?? donor.id}`;
              }),
              userPosition !== 0 ? `\n${bold(`#${userPosition}`)} ${inlineCode(userDonator.amount.toLocaleString())} - ${command.user.tag}` : ''
            ))
        )
    );
  }

  public static resolveCategory(query: string, db: DonationTrackerSchema) {
    return db.categories.resolve(query) ?? db.categories.find(c => c.id.toLowerCase().includes(query)) ?? db.categories.find(c => c.name.toLowerCase().includes(query));
  }

  public static resolveCategoryDonator(userId: string, category: DonationTrackerCategorySchema) {
    return category.donators.resolve(userId) ?? category.donators.create({ id: userId, amount: 0 });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => 
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommandGroup(group => 
          group
            .setName('create')  
            .addSubcommand(sub => 
              sub  
                .setName('autorole')
                .setDescription('Create a new autorole. Autoroles will respect the configured default donation category.')
            )
            .addSubcommand(sub => 
              sub  
                .setName('category')
                .setDescription('Create a new donation category.')
            )
        )
        .addSubcommandGroup(group => 
          group
            .setName('delete')  
            .addSubcommand(sub => 
              sub  
                .setName('autorole')
                .setDescription('Delete an existing autorole.')
            )
            .addSubcommand(sub => 
              sub  
                .setName('category')
                .setDescription('Delete an existing donation category.')
            )
        )
        .addSubcommandGroup(group => 
          group
            .setName('weekly')  
            .addSubcommand(sub => 
              sub  
                .setName('leaderboard')
                .setDescription('View the leading donators from a donation category this week.')
            )
            .addSubcommand(sub => 
              sub  
                .setName('reset')
                .setDescription('Reset the weekly donators leaderboard for the default donation category.')
            )
        )
    );
  }
}
