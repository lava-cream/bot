import { CommandError } from "#lib/framework";
import { DeferCommandInteraction, join, parseNumber, send } from "#lib/utilities";
import { bold } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { isNullOrUndefined } from "@sapphire/utilities";
import { Constants } from "discord.js";

@ApplyOptions<Command.Options>({
  name: 'share',
  description: 'Transfer coins to other players.',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export default class ShareCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const recepient = command.options.getMember('recepient', true);
    const amount = command.options.getString('amount', true);

    if (db.wallet.value <= 1) {
      throw new CommandError('You have nothing to share');
    }

    const parsedAmount = parseNumber(amount, {
      amount: db.wallet.value,
      minimum: 0,
      maximum: db.wallet.value
    });

    if (isNullOrUndefined(parsedAmount)) {
      throw new CommandError('Must be a valid number.');
    }
    if (parsedAmount > db.wallet.value) {
      throw new CommandError(`You only have ${bold(db.wallet.value.toLocaleString())} coins, can't share that many.`);
    }

    const dbRecepient = await this.container.db.players.fetch(recepient.user.id);

    await db.run(({ wallet }) => wallet.subValue(parsedAmount)).save();
    await dbRecepient.run(({ wallet }) => wallet.addValue(parsedAmount)).save();
    await send(command, builder =>
      builder.addEmbed(embed =>
        embed
          .setColor(Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(
            join(
              `Successfully shared ${bold(parsedAmount.toLocaleString())} coins to ${bold(recepient.user.tag)}.`,
              `You now have ${bold(db.wallet.shortenValue(2))} coins, while they have ${dbRecepient.wallet.shortenValue(2)} coins.`
            )
          )

      )
    );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option => option.setName('recepient').setDescription('The user you want to share your coins with.').setRequired(true))
        .addStringOption(option => option.setName('amount').setDescription('A valid amount.').setRequired(true))
      , {
        idHints: ['1057916707299151942']
      }
    );
  }
}