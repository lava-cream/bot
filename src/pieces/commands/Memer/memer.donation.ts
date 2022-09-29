import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import { WebhookEditMessageOptions, MessageEditOptions, MessageSelectMenu, MessageActionRow } from 'discord.js';
import { Collector, getUserAvatarURL, join, seconds } from '#bot/util';
import type { MemerDonation, MemerDonationDonator } from '#bot/db';
import { type Ok, fromAsync, ok } from '@sapphire/result';
import { DonationUpdateMethods } from '#bot/logger/pieces/db.memer.donation.donator-update.js';
import { isNullOrUndefined } from '@sapphire/utilities';
import { bold, inlineCode } from '@discordjs/builders';
import { DiscordSnowflake } from '@sapphire/snowflake';
import { ChannelType } from 'discord.js/node_modules/discord-api-types/v9.js';

const enum SubCommands {
  Add = 'add',
  Autorole = 'autorole',
  Create = 'create',
  Delete = 'delete',
  Log = 'logs',
  Multiplier = 'multi',
  Profile = 'profile',
  Remove = 'remove',
  Top = 'top'
}

@ApplyOptions<Command.Options>({
  name: 'dono',
  description: 'Manage server donations.',
  requiredUserPermissions: ['MANAGE_MESSAGES']
})
export default class DonationCommand extends Command {
  fetchGuild(guildId: string) {
    return this.container.db.memers.fetch(guildId);
  }

  resolveDonation(donations: MemerDonation[], arg: string) {
    return donations.find((d) => {
      const bySpecificId = d.id.toLowerCase() === arg.toLowerCase();
      const bySpecificName = d.name.toLowerCase() === arg.toLowerCase();
      const byId = d.id.toLowerCase().includes(arg.toLowerCase());
      const byName = d.name.toLowerCase().includes(arg.toLowerCase());

      return bySpecificId || bySpecificName || byId || byName;
    });
  }

  public override async chatInputRun(command: CommandInteraction) {
    if (!command.inCachedGuild()) {
      await command.reply('This command is not available on personal channels.');
      return;
    }

    const subCommand = command.options.getSubcommand() as SubCommands;
    const result = await fromAsync<void, string>(() => this[subCommand].call(this, command));
    if (!result.success) await command[command.deferred || command.replied ? 'editReply' : 'reply'](result.error);

    return;
  }

  /**
   * The logic for the `add` subcommand.
   */
  async [SubCommands.Add](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const type = command.options.getString('donation', true).toLowerCase();
    const amount = command.options.getNumber('amount', true);
    const member = command.options.getMember('member') ?? command.member;

    const donation = this.resolveDonation(doc.donations, type);
    // todo: dropdown collector listing all available donation types then ask user to pick one.
    if (isNullOrUndefined(donation)) throw 'That donation type does not exist.';

    const donator = await fromAsync(this.container.db.memers.resolveDonationDonator(doc, donation, member.user));
    if (!donator.success) throw 'Cannot create donation entry for user.';

    const withMultiplier = Math.round(amount * donation.multiplier);
    const total = Math.round(withMultiplier + donator.value.amount);
    const seasonTotal = Math.round(withMultiplier + donator.value.season);
    const referencedMessage = await command.editReply({
      embeds: [
        {
          color: 'RANDOM',
          fields: [
            {
              name: 'Amount Added',
              value: inlineCode(withMultiplier.toLocaleString()),
              inline: false
            },
            {
              name: 'Total Donations',
              value: inlineCode(total.toLocaleString()),
              inline: true
            },
            {
              name: 'Weekly Donations',
              value: inlineCode(seasonTotal.toLocaleString()),
              inline: true
            }
          ]
        }
      ]
    });

    await this.container.db.memers.updateDonationDonator(doc, true, {
      amount: { amount: amount, season: amount },
      guild: command.guild,
      context: { donation, donator: member, referencedMessage, staff: command.user },
      method: DonationUpdateMethods.INCREMENT
    });

    return;
  }

  /**
   * Logic for the `autorole` subcommand.
   */
  async [SubCommands.Autorole](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const donation = command.options.getString('donation', true);
    const role = command.options.getRole('role', true);
    const amount = command.options.getNumber('amount');

    const thisDonation = this.resolveDonation(doc.donations, donation);
    if (isNullOrUndefined(thisDonation)) throw 'No donation found.';

    const autorole = thisDonation.autoroles.find((ar) => ar.role === role.id);
    if (isNullOrUndefined(autorole)) {
      if (isNullOrUndefined(amount)) throw 'You need an amount to set for the new autorole.';
      await doc.createDonationAutorole(thisDonation.id, role.id, amount).save();
      await command.editReply(
        `Successfully created the ${bold(role.name)} autorole and set the amount to ${inlineCode(amount.toLocaleString())} coins.`
      );
      return;
    }

    if (isNullOrUndefined(amount)) {
      await doc.removeDonationAutorole(thisDonation.id, role.id).save();
      await command.editReply(`Successfully deleted ${bold(role.name)} from ${inlineCode(thisDonation.name)}'s autorole entries.`);
      return;
    }

    await doc.updateDonationAutorole(thisDonation.id, role.id, { amount }).save();
    await command.editReply(`Successfully edited ${bold(role.name)}'s amount to ${inlineCode(autorole.amount.toLocaleString())} coins.`);
  }

  /**
   * Logic for the `create` subcommand.
   */
  async [SubCommands.Create](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const id = command.options.getString('id', true);
    const name = command.options.getString('name', true);
    const multiplier = command.options.getNumber('multiplier') ?? 1;

    const exists = doc.donations.find((d) => d.id === id);
    if (!isNullOrUndefined(exists)) throw "You can't create another donation with the same existing id.";

    await doc.createDonation(id, name).updateDonation(id, { multiplier }).save();
    await command.editReply(`Successfilly created the **${name}** donation type with a \`x${multiplier}\` multiplier.`);
    return;
  }

  /**
   * Logic for the `delete` subcommand.
   */
  async [SubCommands.Delete](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const donation = command.options.getString('donation', true);

    const resolved = this.resolveDonation(doc.donations, donation);
    // dropdown
    if (isNullOrUndefined(resolved)) throw 'Cannot find the donation type you are looking for.';

    await doc.deleteDonation(resolved.id).save();
    await command.editReply(`Successfully deleted the **${resolved.name}** donation.`);
    return;
  }

  /**
   * Logic for the `logs` subcommand.
   */
  async [SubCommands.Log](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const donation = command.options.getString('donation', true);
    const channel = command.options.getChannel('channel');

    const exists = this.resolveDonation(doc.donations, donation);
    if (isNullOrUndefined(exists)) throw "That donation doesn't exist.";

    if (isNullOrUndefined(channel)) {
      await doc.updateDonation(exists.id, { logs: null }).save();
      await command.editReply(`Logs for the ${bold(exists.name)} donation has been disabled.`);
      return;
    }

    if (!channel.isText()) throw 'That channel is not a text channel.';

    await doc.updateDonation(exists.id, { logs: channel.id }).save();
    await command.editReply(`Logs for the ${bold(exists.name)} donation has been linked to ${channel}`);
    return;
  }

  /**
   * Logic for the `multiplier` subcommand.
   * @param command The interaction.
   * @returns Void.
   */
  async [SubCommands.Multiplier](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const donation = command.options.getString('donation', true);
    const multiplier = command.options.getNumber('multiplier', true);

    const thisDonation = this.resolveDonation(doc.donations, donation);
    if (isNullOrUndefined(thisDonation)) throw 'No donation found.';

    await doc.updateDonation(thisDonation.id, { multiplier }).save();
    await command.editReply('Done.');
    return;
  }

  /**
   * Logic for the `profile` subcommand.
   */
  async [SubCommands.Profile](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const user = command.options.getUser('user') ?? command.user;
    if (!doc.donations.length) throw 'No donations were found from this guild.';

    let activeDonation: MemerDonation = doc.donations.at(0)!;
    let activeDonorData = await fromAsync(this.container.db.memers.resolveDonationDonator(doc, activeDonation, user));
    if (!activeDonorData.success) throw 'Unable to create donator data.';

    const getComponents = (ended: boolean): MessageActionRow[] => [
      new MessageActionRow<MessageSelectMenu>({
        components: [
          new MessageSelectMenu({
            customId: 'lava.top-donations',
            placeholder: 'Select Donation Type',
            disabled: ended,
            max_values: 1,
            options: doc.donations.map((d) => ({
              default: activeDonation.id === d.id,
              label: d.name,
              value: d.id
            }))
          })
        ]
      })
    ];

    const getContent = (data: MemerDonationDonator, ended: boolean): WebhookEditMessageOptions | MessageEditOptions => ({
      components: getComponents(ended),
      embeds: [
        {
          title: `${user.username}'s ${activeDonation.name} Donations`,
          color: 'BLUE',
          fields: [
            {
              name: 'Total Donated',
              value: inlineCode(data.amount.toLocaleString())
            },
            {
              name: 'Times Donated',
              value: inlineCode(data.count.toLocaleString())
            },
            {
              name: 'Average Donation',
              value: inlineCode((Math.round(data.amount / data.count) || 0).toLocaleString())
            },
            {
              name: 'Weekly Donations',
              value: inlineCode(data.season.toLocaleString())
            }
          ],
          footer: {
            text: command.client.user!.username,
            iconURL: getUserAvatarURL(command.client.user!)
          }
        }
      ]
    });

    const collector = Collector.create(await command.editReply(<WebhookEditMessageOptions>getContent(activeDonorData.value, false)), 'SELECT_MENU');

    collector.actions.add('lava.top-donations', async (ctx) => {
      ctx.collector.resetTimer({ time: seconds(10) });

      activeDonation = doc.donations.find((d) => d.id === ctx.interaction.values[0])!;
      activeDonorData = ok(activeDonation.donators.find((d) => d.id === user.id)!);
      await ctx.interaction.editReply(<WebhookEditMessageOptions>getContent(activeDonorData.value, false));
    });

    collector.setEndAction(async (ctx) => {
      if (ctx.reason === 'time') {
        const content = getContent((<Ok<MemerDonationDonator>>activeDonorData).value, true);
        void (!isNullOrUndefined(ctx.interaction)
          ? await ctx.interaction.editReply(<WebhookEditMessageOptions>content)
          : await ctx.message.edit(<MessageEditOptions>content));
      }
    });

    await collector.run({
      max: 10,
      componentType: 'SELECT_MENU',
      time: seconds(30),
      filter: async (menu) => {
        const context = menu.user.id === command.user.id;
        await menu.deferUpdate();
        return context;
      }
    });
  }

  /**
   * Logic for the `remove` command.
   */
  async [SubCommands.Remove](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    const type = command.options.getString('donation', true).toLowerCase();
    const amount = command.options.getNumber('amount', true);
    const member = command.options.getMember('member') ?? command.member;

    const donation = this.resolveDonation(doc.donations, type);
    // todo: dropdown collector listing all available donation types then ask user to pick one.
    if (isNullOrUndefined(donation)) throw "That donation type doesn't exist.";

    const donator = await fromAsync(this.container.db.memers.resolveDonationDonator(doc, donation, member.user));
    if (!donator.success) throw 'Cannot create donation entry for user.';

    const total = Math.round(donator.value.amount - amount);
    const seasonTotal = Math.round(donator.value.season - amount);
    const referencedMessage = await command.editReply({
      embeds: [
        {
          color: 'RANDOM',
          fields: [
            {
              name: 'Amount Removed',
              value: inlineCode(amount.toLocaleString())
            },
            {
              name: 'Total Donations',
              value: inlineCode(total.toLocaleString()),
              inline: true
            },
            {
              name: 'Weekly Donations',
              value: inlineCode(seasonTotal.toLocaleString())
            }
          ]
        }
      ]
    });

    await this.container.db.memers.updateDonationDonator(doc, false, {
      amount: { amount: amount, season: amount },
      guild: command.guild,
      context: { donation, donator: member, referencedMessage, staff: command.user },
      method: DonationUpdateMethods.DECREMENT
    });
  }

  /**
   * Logic for the `top` command.
   */
  async [SubCommands.Top](command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const doc = await this.fetchGuild(command.guildId);
    if (!doc.donations.length) throw 'No donations were found from this guild.';

    const menuId = DiscordSnowflake.generate().toString();
    let active: MemerDonation = doc.donations[0];

    const getComponents = (ended: boolean): MessageActionRow[] => [
      new MessageActionRow<MessageSelectMenu>({
        components: [
          new MessageSelectMenu({
            customId: menuId,
            placeholder: 'Select Donation Type',
            disabled: ended,
            max_values: 1,
            options: doc.donations.map((d) => ({
              default: active.id === d.id,
              label: d.name,
              value: d.id
            }))
          })
        ]
      })
    ];

    const getTopDonors = () => active.donators.sort((a, b) => b.amount - a.amount).slice(0, 10);
    const mapDonators = (donators: MemerDonationDonator[]) => {
      return donators.map((d, i) => {
        const user = command.client.users.resolve(d.id);
        return `**#${i + 1}** ${d.amount.toLocaleString()} — ${user?.tag ?? d.id}`;
      });
    };

    const getContent = (ended: boolean): WebhookEditMessageOptions | MessageEditOptions => ({
      components: getComponents(ended),
      embeds: [
        {
          title: `Showing ${active.name} Donations`,
          color: 'BLUE',
          description: join(...mapDonators(getTopDonors()))
        }
      ]
    });

    const collector = Collector.create(await command.editReply(<WebhookEditMessageOptions>getContent(false)), 'SELECT_MENU');

    collector.actions.add(menuId, async (ctx) => {
      active = doc.donations.find((d) => d.id === ctx.interaction.values[0])!;
      await ctx.interaction.editReply(<WebhookEditMessageOptions>getContent(false));
      ctx.collector.resetTimer({ time: seconds(10) });
    });

    collector.setEndAction(async (ctx) => {
      if (ctx.reason === 'time') {
        const content = getContent(true);
        void (!isNullOrUndefined(ctx.interaction)
          ? await ctx.interaction.editReply(<WebhookEditMessageOptions>content)
          : await ctx.message.edit(<MessageEditOptions>content));
      }
    });

    await collector.run({
      max: 10,
      componentType: 'SELECT_MENU',
      time: seconds(20),
      filter: async (menu) => {
        const context = menu.user.id === command.user.id;
        await menu.deferUpdate();
        return context;
      }
    });
  }

  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Add)
              .setDescription("Add yours/someone's coins donated for a specific donation type.")
              .addStringOption((builder) =>
                builder.setName('donation').setDescription('A donation type that exists. Could be the id or name of it.').setRequired(true)
              )
              .addNumberOption((builder) => builder.setName('amount').setDescription('The amount to add.').setRequired(true).setMinValue(1))
              .addUserOption((builder) => builder.setName('member').setDescription('The member to add the amount from. Defaults to you.'))
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Autorole)
              .setDescription('Modify donation autoroles. Roles are distributed when a donor reaches a configured donation amount.')
              .addStringOption((builder) => builder.setName('donation').setDescription('A donation id or name that exists.').setRequired(true))
              .addRoleOption((builder) =>
                builder.setName('role').setDescription('The role to create or delete from the donation autorole.').setRequired(true)
              )
              .addNumberOption((builder) =>
                builder.setName('amount').setDescription('The amount to set. Leave this option blank to delete the autorole.')
              )
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Create)
              .setDescription('Creates a donation type.')
              .addStringOption((builder) => builder.setName('id').setDescription('The id of this donation type.').setRequired(true))
              .addStringOption((builder) => builder.setName('name').setDescription('The name of this donation type.').setRequired(true))
              .addNumberOption((builder) =>
                builder.setName('multiplier').setDescription('The donatio multiplier of this donation type.').setMinValue(1).setMaxValue(100)
              )
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Delete)
              .setDescription('Deletes a donation type.')
              .addStringOption((builder) => builder.setName('donation').setDescription('The id or name of the donation.').setRequired(true))
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Log)
              .setDescription('Configure the logs channel of a donation type.')
              .addStringOption((builder) =>
                builder.setName('donation').setDescription('The id or name of the donation you want to enable the logs for.').setRequired(true)
              )
              .addChannelOption((builder) =>
                builder
                  .setName('channel')
                  .setDescription('The logs channel. Leave this option blank to disable.')
                  .addChannelTypes(ChannelType.GuildText)
              )
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Multiplier)
              .setDescription('Configure the multiplier to apply against a donation.')
              .addStringOption((builder) => builder.setName('donation').setDescription('The id or name of the donation.').setRequired(true))
              .addNumberOption((builder) =>
                builder.setName('multiplier').setDescription('The multiplier.').setRequired(true).setMinValue(1).setMaxValue(100)
              )
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Profile)
              .setDescription("Checks for yours or someone else's donation profile.")
              .addUserOption((builder) => builder.setName('user').setDescription('The user to check for.'))
          )
          .addSubcommand((builder) =>
            builder
              .setName(SubCommands.Remove)
              .setDescription("Remove yours/someone's coins donated for a specific donation type.")
              .addStringOption((builder) =>
                builder.setName('donation').setDescription('A donation type that exists. Could be the id or name of it.').setRequired(true)
              )
              .addNumberOption((builder) => builder.setName('amount').setDescription('The amount to remove.').setRequired(true))
              .addUserOption((builder) => builder.setName('member').setDescription('The member to remove the amount from. Defaults to you.'))
          )
          .addSubcommand((builder) => builder.setName(SubCommands.Top).setDescription('View the leading donators from all donation types.')),
      {
        idHints: ['953202140954902538']
      }
    );
  }
}
