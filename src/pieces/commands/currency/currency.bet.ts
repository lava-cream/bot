import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { hasDecimal, edit } from '#lib/utilities';
import { bold } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
  name: 'bet',
  description: 'Changes your bet amount.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BetCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const db = await this.container.db.players.fetch(command.user.id);
    const amount = command.options.getNumber('amount', true);
    const oldAmount = db.bet.value;

    switch(true) {
      case hasDecimal(amount): {
        return await edit(command, 'Decimals are not allowed, idiot.');
      };

      case amount === oldAmount: {
        return await edit(command, 'Okay changed, as if you would notice.');
      };

      case amount < db.minBet || amount > db.maxBet: {
        return await edit(command, `Bro you can only set it higher than ${bold(db.minBet.toLocaleString())} but lower than ${bold(db.maxBet.toLocaleString())} smh`);
      };
    }

    await db.run((db) => db.bet.update({ value: amount })).save();
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
