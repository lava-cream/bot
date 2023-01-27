import { Command, ApplicationCommandRegistry } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import {
	percent,
	send,
	InteractionMessageContentBuilder,
	toReadable,
	CustomId,
	Collector,
	seconds,
	edit,
	ActionRowBuilder,
	TextInputComponentBuilder,
	ResponderError,
	parseNumber,
	hasDecimal
} from '#lib/utilities';
import { ButtonStyle, ComponentType, ModalBuilder, TextInputStyle, User } from 'discord.js';
import type { PlayerSchema } from '#lib/database';
import { EmbedTemplates } from '#lib/utilities';
import { isNullOrUndefined, toTitleCase } from '@sapphire/utilities';

enum BankControl {
	Withdraw = 'withdraw',
	Deposit = 'deposit'
}

@ApplyOptions<Command.Options>({
	name: 'balance',
	description: "Checks for the balance of yours or someone else's."
})
export default class BalanceCommand extends Command {
	public override async chatInputRun(command: Command.ChatInputCommandInteraction) {
		const user = command.options.getUser('user') ?? command.user;
		const db = await this.container.db.players.fetch(user.id);
		const customId = new CustomId(command.createdAt);
		const message = await send(command, BalanceCommand.renderContent(command, user, db, customId, false));

		if (command.user.id !== user.id) return;

		const collector = new Collector({
			message,
			componentType: ComponentType.Button,
			max: Infinity,
			time: seconds(60),
			filter: (button) => button.user.id === command.user.id,
			end: async () => {
				await edit(command, BalanceCommand.renderContent(command, user, db, customId, true));
			}
		});

		for (const bankControl of Object.values(BankControl)) {
			collector.actions.add(customId.create(bankControl), async (ctx) => {
				ctx.collector.resetTimer();

				const modalComponents = [
					new ActionRowBuilder<TextInputComponentBuilder>().addTextInputComponent((textInput) =>
						textInput
							.setCustomId(customId.create('input'))
							.setStyle(TextInputStyle.Short)
							.setLabel(`${toTitleCase(bankControl)} Amount`)
							.setPlaceholder(`Type the amount to ${bankControl}.`)
							.setRequired(true)
					)
				];

				const modalContent = new ModalBuilder().setCustomId(customId.create('modal')).setTitle('Enter Amount').setComponents(modalComponents);

				await ctx.interaction.showModal(modalContent);
				const modal = await ctx.interaction.awaitModalSubmit({ time: seconds(60) }).catch(() => null);
				if (isNullOrUndefined(modal)) {
					await ResponderError.send(ctx.interaction, "You didn't type anything!");
					return;
				}

				const input = modal.fields.getTextInputValue(customId.create('input'));
				const parsedInput = parseNumber(input, {
					amount: bankControl === BankControl.Deposit ? db.wallet.value : db.bank.value,
					maximum: bankControl === BankControl.Deposit ? db.bank.difference : db.bank.value,
					minimum: 0
				});

				if (isNullOrUndefined(parsedInput) || hasDecimal(parsedInput)) {
					await ResponderError.send(modal, 'You have to input a valid number.');
					return;
				}

				switch (bankControl) {
					case BankControl.Deposit: {
						db.wallet.subValue(parsedInput);
						db.wallet.addValue(parsedInput);
						break;
					}

					case BankControl.Withdraw: {
						db.wallet.addValue(parsedInput);
						db.bank.subValue(parsedInput);
						break;
					}
				}

				await db.save();
				await edit(modal, BalanceCommand.renderContent(command, user, db, customId, false));
			});
		}

		await collector.start();
	}

	private static renderContent(command: Command.ChatInputCommandInteraction, user: User, db: PlayerSchema, customId: CustomId, ended: boolean) {
		const content = new InteractionMessageContentBuilder().addEmbed(() =>
			EmbedTemplates.createCamouflaged()
				.setTitle(`${user.username}'s balance`)
				.addFields(
					{
						name: 'Wallet',
						value: db.wallet.toLocaleString(),
						inline: true
					},
					{
						name: `Bank (${percent(db.bank.value, db.bank.space.value)} Full)`,
						value: `${db.bank.toLocaleString()}/${toReadable(db.bank.space.value, 2)}`,
						inline: true
					},
					{
						name: 'Net Worth',
						value: db.netWorth.toLocaleString()
					}
				)
		);

		if (command.user.id === user.id) {
			content.addRow((row) =>
				Object.entries(BankControl).reduce(
					(row, [label, id]) =>
						row.addButtonComponent((btn) =>
							btn.setCustomId(customId.create(id)).setLabel(label).setDisabled(ended).setStyle(ButtonStyle.Secondary)
						),
					row
				)
			);
		}

		return content;
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addUserOption((option) => option.setName('user').setDescription('The user to check for.')),
			{
				idHints: ['1050341967051108403']
			}
		);
	}
}
