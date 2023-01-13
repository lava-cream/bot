import type { PlayerSchema } from "#lib/database";
import { EmbedTemplates, InteractionMessageContentBuilder, parseNumber, ResponderError, send } from "#lib/utilities";
import { bold } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { isNullOrUndefined } from "@sapphire/utilities";
import type { User } from "discord.js";

@ApplyOptions<Command.Options>({
  name: 'share',
  description: 'Transfer coins to other players.',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export default class ShareCommand extends Command {
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const user = command.options.getMember('user', true);
    const amount = command.options.getString('amount', true);

    if (db.wallet.value <= 1) return ResponderError.send(command, 'You have nothing to share!');

    const parsedAmount = parseNumber(amount, {
      amount: db.wallet.value,
      minimum: 0,
      maximum: db.wallet.value
    });

    if (isNullOrUndefined(parsedAmount) || parsedAmount < 1) return ResponderError.send(command, 'Must be a valid number.');
    if (parsedAmount > db.wallet.value) return ResponderError.send(command, `You can't share that many. You only have ${bold(db.wallet.value.toLocaleString())} coins!`);

    const dbRecepient = await this.container.db.players.fetch(user.user.id);

    await db.run(({ wallet }) => wallet.subValue(parsedAmount)).save();
    await dbRecepient.run(({ wallet }) => wallet.addValue(parsedAmount)).save();
    await send(command, ShareCommand.renderSuccessfulTransactionMessage(parsedAmount, { db, user: command.user }, { db: dbRecepient, user: user.user }));
    return;
  }

  private static renderSuccessfulTransactionMessage(
    amount: number,
    sender: { db: PlayerSchema, user: User },
    recepient: { db: PlayerSchema, user: User }
  ) {
    return new InteractionMessageContentBuilder().addEmbed(() =>
      EmbedTemplates.createCamouflaged()
        .addFields(
          {
            name: 'Amount Shared',
            value: amount.toLocaleString()
          },
          {
            name: `${sender.user.username}'s Wallet`,
            value: sender.db.wallet.toLocaleString(),
            inline: true
          },
          {
            name: `${recepient.user.username}'s Wallet`,
            value: recepient.db.wallet.toLocaleString(),
            inline: true
          }
        )
    );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option => option.setName('user').setDescription('The user you want to share your coins with.').setRequired(true))
        .addStringOption(option => option.setName('amount').setDescription('A valid amount.').setRequired(true))
      , {
        idHints: ['1057916707299151942']
      }
    );
  }
}