import { CommandInteraction, Constants } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { hasDecimal, edit, DeferCommandInteraction, parseNumber, getUserAvatarURL } from '#lib/utilities';
import { bold, inlineCode } from '@discordjs/builders';
import { isNullOrUndefined } from '@sapphire/utilities';
import { CommandError } from '#lib/framework';

@ApplyOptions<Command.Options>({
  name: 'bet',
  description: 'Edits your bet amount.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BetCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const amount = parseNumber(command.options.getString('amount', true), { amount: db.bet.value, minimum: db.minBet, maximum: db.maxBet });
    const oldAmount = db.bet.value;

    if (isNullOrUndefined(amount) || hasDecimal(amount)) throw new CommandError('You need to pass an actual number.');
    if (amount === oldAmount) throw new CommandError("Cannot change your bet due to it being exactly similar.");
    if (amount < db.minBet) throw new CommandError(`You can't bet lower than your minimum ${bold(db.minBet.toLocaleString())} limit.`);
    if (amount > db.maxBet) throw new CommandError(`You can't bet higher than your maximum ${bold(db.maxBet.toLocaleString())} limit.`);
    if (amount > db.wallet.value) throw new CommandError(`You only have ${bold(db.wallet.value.toLocaleString())} coins.`);

    await db.run((db) => db.bet.setValue(amount)).save();
    await edit(command, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('Bet Changed')
            .setColor(Constants.Colors.GREEN)
            .setDescription('Successfully changed your bet.')
            .addFields(
              { name: 'Previous', value: inlineCode(oldAmount.toLocaleString()) },
              { name: 'New', value: inlineCode(amount.toLocaleString()) }
            )
            .setFooter({
              text: command.user.tag,
              iconURL: getUserAvatarURL(command.user)
            })
        )
    );

    return;
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('amount')
            .setDescription('Examples: 10k, 2t, 30%, 55.5% (% of max bet), min, max, half, full, 250_000 or 124,000.')
            .setRequired(true)
        )
    );
  }
}
