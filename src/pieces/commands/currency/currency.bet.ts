import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { hasDecimal, parseNumber, InteractionMessageContentBuilder, send, ResponderError } from '#lib/utilities';
import { bold } from '@discordjs/builders';
import { isNullOrUndefined } from '@sapphire/utilities';
import type { PlayerSchema } from '#lib/database';
import { EmbedTemplates } from '#lib/utilities';

@ApplyOptions<Command.Options>({
	name: 'bet',
	description: 'Edits your bet amount.',
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BetCommand extends Command {
	public override async chatInputRun(command: Command.ChatInputCommandInteraction<'cached'>) {
		const db = await this.container.db.players.fetch(command.user.id);
		const amount = command.options.getString('amount');

		if (isNullOrUndefined(amount)) {
			return send(command, BetCommand.renderCurrentBetMessage(db));
		}

		const parsedAmount = parseNumber(amount, {
			amount: db.bet.value,
			minimum: db.minBet,
			maximum: db.maxBet
		});

		if (isNullOrUndefined(parsedAmount) || hasDecimal(parsedAmount)) return ResponderError.send(command, 'You need to pass an actual number.');
		if (parsedAmount === db.bet.value) return ResponderError.send(command, 'Cannot change your bet to the same one.');
		if (parsedAmount < db.minBet)
			return ResponderError.send(command, `You can't bet lower than your minimum ${bold(db.minBet.toLocaleString())} limit.`);
		if (parsedAmount > db.maxBet)
			return ResponderError.send(command, `You can't bet higher than your maximum ${bold(db.maxBet.toLocaleString())} limit.`);
		if (parsedAmount > db.wallet.value) return ResponderError.send(command, `You only have ${bold(db.wallet.value.toLocaleString())} coins.`);

		await db.run((db) => db.bet.setValue(parsedAmount)).save();
		await send(command, BetCommand.renderBetUpdatedMessage(db));
		return;
	}

	private static renderCurrentBetMessage(db: PlayerSchema) {
		return new InteractionMessageContentBuilder().addEmbed(() =>
			EmbedTemplates.createSimple(`Your current bet is ${bold(db.bet.toLocaleString())} coins.`)
		);
	}

	private static renderBetUpdatedMessage(db: PlayerSchema) {
		return new InteractionMessageContentBuilder().addEmbed(() =>
			EmbedTemplates.createSimple(`You're now betting ${bold(db.bet.toLocaleString())} coins. Goodluck playing!`)
		);
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((option) =>
						option
							.setName('amount')
							.setDescription('Examples: 10k, 2t, 30%, 55.5% (% of max bet), min, max, half, full, 250_000 or 124,000.')
					),
			{
				idHints: ['1050341969324408902']
			}
		);
	}
}
