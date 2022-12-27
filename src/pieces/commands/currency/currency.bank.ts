import { CommandOptionError } from "#lib/framework";
import { DeferCommandInteraction, edit, parseNumber } from "#lib/utilities";
import { inlineCode } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import type { ApplicationCommandRegistry } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { isNullOrUndefined } from "@sapphire/utilities";
import { Constants } from "discord.js";

@ApplyOptions<Subcommand.Options>({
  name: 'bank',
  description: 'Manage your bank.',
  subcommands: [
    {
      name: 'deposit',
      chatInputRun: 'chatInputDeposit'
    },
    {
      name: 'withdraw',
      chatInputRun: 'chatInputWithdraw'
    }
  ]
})
export default class BankCommand extends Subcommand {
  @DeferCommandInteraction()
  public async chatInputDeposit(command: Subcommand.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const amount = command.options.getString('amount', true);
    const parsedAmount = parseNumber(amount, {
      amount: db.wallet.value,
      minimum: 0,
      maximum: Math.min(db.wallet.value, db.bank.space.value - db.wallet.value)
    });

    if (isNullOrUndefined(parsedAmount)) {
      throw new CommandOptionError({ option: 'amount', message: 'It should be a valid or actual number.' });
    }

    await db
      .run(db => {
        db.wallet.subValue(parsedAmount);
        db.bank.addValue(parsedAmount);
      })
      .save();
    
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Coins Deposited')
            .setColor(Constants.Colors.GREEN)
            .addFields(
              {
                name: 'Deposited',
                value: parsedAmount.toLocaleString(),
              },
              {
                name: 'Wallet',
                value: inlineCode(db.wallet.toLocaleString()),
                inline: true
              },
              {
                name: 'Bank',
                value: inlineCode(db.bank.toLocaleString()),
                inline: true
              }
            )
        )
    );
  }

  @DeferCommandInteraction()
  public async chatInputWithdraw(command: Subcommand.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const amount = command.options.getString('amount', true);
    const parsedAmount = parseNumber(amount, {
      amount: db.bank.value,
      minimum: 0,
      maximum: db.bank.value
    });

    if (isNullOrUndefined(parsedAmount)) {
      throw new CommandOptionError({ option: 'amount', message: 'It should be a valid or actual number.' });
    }

    await db
      .run(db => {
        db.wallet.addValue(parsedAmount);
        db.bank.subValue(parsedAmount);
      })
      .save();
    
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Coins Withdrawn')
            .setColor(Constants.Colors.GREEN)
            .addFields(
              {
                name: 'Withdrew',
                value: parsedAmount.toLocaleString(),
              },
              {
                name: 'Wallet',
                value: inlineCode(db.wallet.toLocaleString()),
                inline: true
              },
              {
                name: 'Bank',
                value: inlineCode(db.bank.toLocaleString()),
                inline: true
              }
            )
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
    );
  }
}