import type { PlayerSchema } from "#lib/database";
import { Collector, CustomId, edit, InteractionMessageContentBuilder, ModalActionRowBuilder, parseNumber, percent, PlayerBank, ResponderError, seconds, send } from "#lib/utilities";
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
    if (db.bank.isMaxValue()) return ResponderError.send(command, 'Your bank is full.');

    const amount = command.options.getString('amount', true);
    const parsedAmount = parseNumber(amount, {
      amount: db.wallet.value,
      minimum: 0,
      maximum: Math.min(db.wallet.value, db.bank.difference)
    });

    if (isNullOrUndefined(parsedAmount)) {
      return ResponderError.send(command, 'It should be a valid or actual number.');
    }

    const cleanParsedAmount = Math.trunc(parsedAmount);
    if (cleanParsedAmount > db.bank.difference) {
      return ResponderError.send(command, `You can only deposit up to ${bold(db.bank.difference.toLocaleString())} coins right now.`);
    }

    await db
      .run(db => {
        db.wallet.subValue(cleanParsedAmount);
        db.bank.addValue(cleanParsedAmount);
      })
      .save();

    return send(command, builder =>
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
    if (db.bank.value < 1) return ResponderError.send(command, 'You have none to withdraw.');

    const amount = command.options.getString('amount', true);
    const parsedAmount = parseNumber(amount, {
      amount: db.bank.value,
      minimum: 0,
      maximum: db.bank.value
    });

    if (isNullOrUndefined(parsedAmount)) {
      return ResponderError.send(command, 'It should be a valid or actual number.');
    }

    const cleanParsedAmount = Math.trunc(parsedAmount);
    if (cleanParsedAmount > db.bank.value) {
      return ResponderError.send(command, `You only have ${bold(db.bank.toLocaleString())} in your bank lmao.`);
    }

    await db
      .run(db => {
        db.wallet.addValue(cleanParsedAmount);
        db.bank.subValue(cleanParsedAmount);
      })
      .save();

    return send(command, builder =>
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
    const message = await send(command, BankCommand.renderSpaceContent(db, customId, false));

    const collector = new Collector({
      message,
      componentType: 'BUTTON',
      max: Infinity,
      time: seconds(10),
      actions: {
        [customId.create('set-multiplier')]: async ctx => {
          ctx.collector.resetTimer({ time: seconds(60) });

          await ctx.interaction.showModal(
            new Modal()
              .setTitle('Bank Space Multiplier')
              .setCustomId(customId.create('modal'))
              .setComponents(
                new ModalActionRowBuilder().addTextInputComponent(input =>
                  input
                    .setCustomId(customId.create('input'))
                    .setPlaceholder(`Between ${PlayerBank.MinSpaceMultiplier} and ${PlayerBank.MaxSpaceMultiplier}.`)
                    .setRequired(true)
                    .setLabel('Multiplier')
                    .setStyle(Constants.TextInputStyles.SHORT)
                )
              )
          );

          const modal = await ctx.interaction.awaitModalSubmit({ time: seconds(60) }).catch(() => null);
          if (isNullOrUndefined(modal)) {
            await ResponderError.send(command, "You didn't input anything!");
            return;
          }

          await modal.deferReply();

          const input = modal.fields.getTextInputValue(customId.create('input'));
          const parsedInput = parseNumber(input, {
            amount: db.bank.space.rate,
            minimum: PlayerBank.MinSpaceMultiplier,
            maximum: PlayerBank.MaxSpaceMultiplier
          });

          if (isNullOrUndefined(parsedInput)) {
            await ResponderError.edit(modal, 'It must be a valid number.');
            return;
          }

          await db.run(db => db.bank.space.setRate(parsedInput)).save();
          await edit(modal, builder => builder.addEmbed(() => EmbedTemplates.createSimple(`Successfully set your bank space multiplier to ${parsedInput}%.`)));
          return ctx.stop();
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
              name: `Capacity (${percent(db.bank.value, db.bank.space.value)} Full)`,
              value: db.bank.space.toLocaleString()
            },
            {
              name: 'Multiplier',
              value: `${db.bank.space.rate.toLocaleString()}%`
            }
          )
          .setTitle('Bank Space')
      )
      .addRow(row =>
        row.addButtonComponent(btn =>
          btn
            .setLabel('Set Multiplier')
            .setCustomId(customId.create('set-multiplier'))
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