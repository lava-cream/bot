import type { PlayerSchema } from "#lib/database";
import { CommandError, CommandOptionError } from "#lib/framework";
import { Collector, CustomId, edit, InteractionMessageContentBuilder, ModalActionRowBuilder, parseNumber, PlayerBank, seconds, send } from "#lib/utilities";
import { EmbedTemplates } from "#lib/utilities";
import { bold, inlineCode } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { isNullOrUndefined } from "@sapphire/utilities";
import { Constants, Modal } from "discord.js";

@ApplyOptions<Subcommand.Options>({
  name: 'bank',
  description: 'Manage your bank.',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  subcommands: [
    {
      name: 'deposit',
      chatInputRun: 'chatInputDeposit'
    },
    {
      name: 'withdraw',
      chatInputRun: 'chatInputWithdraw'
    },
    {
      name: 'space',
      chatInputRun: 'chatInputSpace'
    }
  ]
})
export default class BankCommand extends Subcommand {
  public async chatInputDeposit(command: Subcommand.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    if (db.bank.isMaxValue()) throw new CommandError('Your bank is full.');

    const amount = command.options.getString('amount', true);
    const parsedAmount = parseNumber(amount, {
      amount: db.wallet.value,
      minimum: 0,
      maximum: Math.min(db.wallet.value, db.bank.difference)
    });

    if (isNullOrUndefined(parsedAmount)) {
      throw new CommandOptionError({ option: 'amount', message: 'It should be a valid or actual number.' });
    }

    const cleanParsedAmount = Math.trunc(parsedAmount);
    if (cleanParsedAmount > db.bank.difference) {
      throw new CommandError(`You can only deposit up to ${bold(db.bank.difference.toLocaleString())} coins right now.`);
    }

    await db
      .run(db => {
        db.wallet.subValue(cleanParsedAmount);
        db.bank.addValue(cleanParsedAmount);
      })
      .save();

    await send(command, builder =>
      builder
        .addEmbed(() =>
          EmbedTemplates.createCamouflaged()
            .addFields(
              {
                name: 'Deposited',
                value: cleanParsedAmount.toLocaleString()
              },
              {
                name: 'Wallet Balance',
                value: db.wallet.toLocaleString(),
                inline: true
              },
              {
                name: 'Bank Balance',
                value: db.bank.toLocaleString(),
                inline: true
              }
            )
        )
    );
  }

  public async chatInputWithdraw(command: Subcommand.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    if (db.bank.value < 1) throw new CommandError('You have none to withdraw.');

    const amount = command.options.getString('amount', true);
    const parsedAmount = parseNumber(amount, {
      amount: db.bank.value,
      minimum: 0,
      maximum: db.bank.value
    });

    if (isNullOrUndefined(parsedAmount)) {
      throw new CommandOptionError({ option: 'amount', message: 'It should be a valid or actual number.' });
    }

    const cleanParsedAmount = Math.trunc(parsedAmount);
    if (cleanParsedAmount > db.bank.value) {
      throw new CommandError(`You only have ${bold(db.bank.toLocaleString())} in your bank lmao.`);
    }

    await db
      .run(db => {
        db.wallet.addValue(cleanParsedAmount);
        db.bank.subValue(cleanParsedAmount);
      })
      .save();

    await send(command, builder =>
      builder
        .addEmbed(() =>
          EmbedTemplates.createCamouflaged()
            .addFields(
              {
                name: 'Withdrawn',
                value: inlineCode(cleanParsedAmount.toLocaleString())
              },
              {
                name: 'Wallet Balance',
                value: inlineCode(db.wallet.toLocaleString()),
                inline: true
              },
              {
                name: 'Bank Balance',
                value: inlineCode(db.bank.toLocaleString()),
                inline: true
              }
            )
        )
    );
  }

  public async chatInputSpace(command: Subcommand.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const customId = new CustomId(command.createdAt);
    const message = await send(command, BankCommand.renderSpaceContent(db, customId, db.bank.space.isMaxRate()));

    if (db.bank.space.isMaxRate()) return;

    const collector = new Collector({
      message,
      componentType: 'BUTTON',
      max: Infinity,
      time: seconds(10),
      actions: {
        [customId.create('increase-multiplier')]: async ctx => {
          ctx.collector.resetTimer();

          await ctx.interaction.showModal(
            new Modal()
              .setTitle('What Percentage?')
              .setCustomId(customId.create('modal'))
              .setComponents(
                new ModalActionRowBuilder().addTextInputComponent(input =>
                  input
                    .setCustomId(customId.create('input'))
                    .setPlaceholder(`# between ${db.bank.space.rate + 1} and ${PlayerBank.MaxSpaceMultiplier}`)
                    .setRequired(true)
                    .setLabel('Percentage')
                    .setStyle(Constants.TextInputStyles.SHORT)
                )
              )
          );

          const modal = await ctx.interaction.awaitModalSubmit({ time: seconds(10) });
          const input = modal.fields.getTextInputValue(customId.create('input'));
          const parsedInput = parseNumber(input, {
            amount: db.bank.space.rate,
            minimum: db.bank.space.rate + 1,
            maximum: PlayerBank.MaxSpaceMultiplier
          });

          if (isNullOrUndefined(parsedInput)) {
            await modal.reply({ embeds: [EmbedTemplates.createSimple('It must be a valid number.')] });
            return;
          }

          await db.run(db => db.bank.space.setRate(parsedInput)).save();
          await modal.reply({ embeds: [EmbedTemplates.createSimple(`Successfully set your bank space multiplier to ${parsedInput}%.`)] });
        }
      },
      filter: button => {
        const contextual = button.user.id === command.user.id;
        return contextual || button.deferUpdate().then(() => false);
      },
      end: async () => {
        await edit(command, BankCommand.renderSpaceContent(db, customId, true));
      }
    });

    await collector.start();
  }

  private static renderSpaceContent(db: PlayerSchema, customId: CustomId, ended: boolean) {
    return new InteractionMessageContentBuilder()
      .addEmbed(() =>
        EmbedTemplates.createCamouflaged()
          .addFields(
            {
              name: 'Capacity',
              value: db.bank.space.toLocaleString(),
              inline: true
            },
            {
              name: 'Multiplier',
              value: `${db.bank.space.rate.toLocaleString()}`,
              inline: true
            }
          )
          .setTitle('Your Bank Space')
      )
      .addRow(row =>
        row.addButtonComponent(btn =>
          btn
            .setLabel('Increase Multiplier')
            .setCustomId(customId.create('increase-multiplier'))
            .setStyle(Constants.MessageButtonStyles.SECONDARY)
            .setDisabled(ended)
        )
      );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
          subcommand
            .setName('deposit')
            .setDescription('Deposit coins into your bank.')
            .addStringOption(option => option.setName('amount').setDescription('The amount you want to deposit.').setRequired(true))
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('withdraw')
            .setDescription('Withdraw coins from your bank.')
            .addStringOption(option => option.setName('amount').setDescription('The amount you want to withdraw.').setRequired(true))
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('space')
            .setDescription('Information regarding your bank space.')
        )
      , {
        idHints: ['1057190448243953684']
      }
    );
  }
}