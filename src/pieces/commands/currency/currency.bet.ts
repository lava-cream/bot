import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { hasDecimal, edit, DeferCommandInteraction, parseNumber } from '#lib/utilities';
import { bold } from '@discordjs/builders';
import { isNullOrUndefined } from '@sapphire/utilities';

@ApplyOptions<Command.Options>({
  name: 'bet',
  description: 'Changes your bet amount.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BetCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const amount = parseNumber(command.options.getString('amount', true), { amount: db.bet.value, minimum: db.minBet, maximum: db.maxBet });
    const oldAmount = db.bet.value;

    if (isNullOrUndefined(amount)) {
      return await edit(command, 'You actually need to input a REAL number smh.');
    }

    switch(true) {
      case hasDecimal(amount): {
        return await edit(command, 'Decimals are not allowed, idiot.');
      };

      case amount === oldAmount: {
        return await edit(command, 'Stop making me stupid. You entered the same amount.');
      };

      case amount < db.minBet || amount > db.maxBet: {
        return await edit(command, `Bro you can only set it higher than ${bold(db.minBet.toLocaleString())} but lower than ${bold(db.maxBet.toLocaleString())} smh`);
      };
    }

    await db.run((db) => db.bet.setValue(amount)).save();
    return await edit(command, `Successfully changed your bet from ${bold(oldAmount.toLocaleString())} to ${bold(amount.toLocaleString())} coins.`);
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
