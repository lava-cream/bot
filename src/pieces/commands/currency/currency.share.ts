import type { PlayerSchema } from "#lib/database";
import { CommandError } from "#lib/framework";
import { InteractionMessageContentBuilder, join, parseNumber, send } from "#lib/utilities";
import { bold } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { isNullOrUndefined } from "@sapphire/utilities";
import { Constants, User } from "discord.js";

@ApplyOptions<Command.Options>({
  name: 'share',
  description: 'Transfer coins to other players.',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export default class ShareCommand extends Command {
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const recepient = command.options.getMember('recepient', true);
    const amount = command.options.getString('amount', true);

    if (db.wallet.value <= 1) throw new CommandError('You have nothing to share!');

    const parsedAmount = parseNumber(amount, {
      amount: db.wallet.value,
      minimum: 0,
      maximum: db.wallet.value
    });

    if (isNullOrUndefined(parsedAmount) || parsedAmount < 1) throw new CommandError('Must be a valid number.');
    if (parsedAmount > db.wallet.value) throw new CommandError(`You can't share that many. You only have ${bold(db.wallet.value.toLocaleString())} coins!`);

    const dbRecepient = await this.container.db.players.fetch(recepient.user.id);

    await db.run(({ wallet }) => wallet.subValue(parsedAmount)).save();
    await dbRecepient.run(({ wallet }) => wallet.addValue(parsedAmount)).save();
    await send(command, ShareCommand.renderSuccessfulTransactionMessage(parsedAmount, { db, user: command.user }, { db: dbRecepient, user: recepient.user }));
  }

  private static renderSuccessfulTransactionMessage(
    amount: number,
    sender: { db: PlayerSchema, user: User },
    recepient: { db: PlayerSchema, user: User }
  ) {
    return new InteractionMessageContentBuilder()
      .addEmbed(embed => 
        embed
          .setColor(Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(
            join(
              `Successfully shared ${bold(amount.toLocaleString())} coins to ${bold(recepient.user.tag)}.`,
              `You now have ${bold(sender.db.wallet.toReadable(2))} coins, while they have ${bold(recepient.db.wallet.toReadable(2))} coins.`
            )
          )
      )
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