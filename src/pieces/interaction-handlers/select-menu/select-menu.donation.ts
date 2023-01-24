import type { DonationDeskEntryQuestionSchema, DonationDeskEntrySchema, DonationDeskSchema } from '#lib/database';
import {
	Collector,
	getGuildIconURL,
	getHighestRoleColor,
	getUserAvatarURL,
	join,
	ActionRowBuilder,
	minutes,
	TextInputComponentBuilder,
	ButtonComponentBuilder
} from '#lib/utilities';
import { bold, userMention, roleMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { chunk, isNullOrUndefined, noop } from '@sapphire/utilities';
import type { Option } from '@sapphire/result';
import {
	ButtonStyle,
	ChannelType,
	Colors,
	ComponentType,
	MessageCreateOptions,
	StringSelectMenuInteraction,
	TextInputStyle,
	WebhookEditMessageOptions
} from 'discord.js';
import { EmbedBuilder, ModalBuilder } from 'discord.js';

declare interface Parsed {
	readonly db: DonationDeskSchema.Document;
	readonly entry: DonationDeskEntrySchema;
}

declare interface Response {
	value: string | null;
	question: DonationDeskEntryQuestionSchema;
}

enum Controls {
	Submit = 'Submit',
	Cancel = 'Cancel'
}

@ApplyOptions<InteractionHandler.Options>({
	name: 'donationDesk',
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class DonationDeskInteractionHandler extends InteractionHandler {
	public override async parse(menu: StringSelectMenuInteraction): Promise<Option.None | Option.Some<Parsed>> {
		if (!menu.inCachedGuild()) return this.none();

		const db = await this.container.db.desks.fetch(menu.guild.id);
		if (isNullOrUndefined(db.channels.desk.id) || menu.message.id !== db.channels.desk.message) return this.none();

		const selected = menu.values.at(0);
		const entry = selected ? db.entries.resolve(selected) : null;
		if (isNullOrUndefined(entry) || !entry.questions.entries.length) return this.none();

		await menu.deferReply({ ephemeral: true });
		return this.some({ db, entry });
	}

	public async run(menu: StringSelectMenuInteraction<'cached'>, { db, entry }: Parsed) {
		if (isNullOrUndefined(entry.roles.access) || isNullOrUndefined(entry.roles.staff) || isNullOrUndefined(db.channels.access)) return;

		const access = await menu.guild.roles.fetch(entry.roles.access);
		const staff = await menu.guild.roles.fetch(entry.roles.staff);
		if (isNullOrUndefined(access) || isNullOrUndefined(staff)) {
			await menu.editReply({ content: 'Missing role configuration.' });
			return;
		}

		const desk = await menu.guild.channels.fetch(db.channels.access);
		if (isNullOrUndefined(desk) || desk.type !== ChannelType.GuildText) {
			await menu.editReply({ content: 'Channel misconfiguration.' });
			return;
		}

		const responses: Response[] = [];
		const collector = new Collector({
			message: await menu.editReply(this.renderInitialContent(menu, entry, responses)),
			componentType: ComponentType.Button,
			time: minutes(5),
			max: Infinity,
			filter: (button) => button.user.id === menu.user.id
		});

		for (const question of entry.questions.entries.values()) {
			collector.actions.add(question.id, async (ctx) => {
				ctx.collector.resetTimer();

				const components = [
					new ActionRowBuilder<TextInputComponentBuilder>().setComponents(
						new TextInputComponentBuilder()
							.setStyle(TextInputStyle.Paragraph)
							.setLabel(question.value)
							.setRequired(true)
							.setCustomId(question.id)
					)
				];

				await ctx.interaction.showModal(
					new ModalBuilder()
						.setCustomId(question.id)
						.setTitle(question.label)
						.setComponents(...components)
				);

				const modal = await ctx.interaction.awaitModalSubmit({ time: minutes(2.5) });
				responses.push({ question, value: modal.fields.getTextInputValue(question.id) });
			});
		}

		for (const control of Object.values(Controls)) {
			switch (control) {
				case Controls.Submit: {
					collector.actions.add(control.toLowerCase(), async (ctx) => {
						const message = await desk.send(this.renderRequestContent(menu, entry, responses)).catch(noop);
						if (!message)
							return void (await menu.followUp({ ephemeral: true, content: 'Lmao imagine running into an error. I guess you did.' }));

						await menu.member.roles.add(access, 'donation access').catch(noop);
						await db
							.run((db) => {
								const request = db.entries.resolve(entry.id)?.requests.create({
									id: ctx.interaction.user.id,
									message: message.id
								});

								for (const response of responses.values()) {
									request?.data.create({
										id: response.question.id,
										response: response.value!
									});
								}
							})
							.save()
							.catch(noop);

						return ctx.collector.stop(control.toLowerCase());
					});

					break;
				}

				case Controls.Cancel: {
					collector.actions.add(control.toLowerCase(), async (ctx) => {
						await ctx.interaction.editReply(this.renderInitialContent(menu, entry, responses, true));
						ctx.collector.stop(control.toLowerCase());
					});

					break;
				}
			}
		}

		await collector.start();
	}

	protected renderInitialContent(
		menu: StringSelectMenuInteraction<'cached'>,
		entry: DonationDeskEntrySchema,
		responses: Response[],
		ended = false
	): WebhookEditMessageOptions {
		const isSubmittable = responses.length === entry.questions.entries.length;
		const embed = new EmbedBuilder()
			.setColor(isSubmittable ? Colors.Green : Colors.NotQuiteBlack)
			.setDescription(
				responses.length === 0
					? 'Click the buttons below to start filling up your donation!'
					: join(...responses.map((response) => `${bold(`${response.question.label}:`)} ${response.value}`))
			)
			.setFooter({ text: menu.guild.name, iconURL: getGuildIconURL(menu.guild) ?? void 0 })
			.setTimestamp(new Date().setTime(menu.createdTimestamp));

		const components = chunk(responses, 5).map((responses) =>
			responses.reduce(
				(row, response) =>
					row.addButtonComponent((btn) =>
						btn
							.setCustomId(response.question.id)
							.setLabel(response.question.label)
							.setDisabled(ended)
							.setStyle(isSubmittable ? ButtonStyle.Success : ButtonStyle.Primary)
					),
				new ActionRowBuilder<ButtonComponentBuilder>()
			)
		);

		components.push(
			Object.values(Controls).reduce(
				(row, label) =>
					row.addButtonComponent((btn) =>
						btn.setCustomId(label.toLowerCase()).setStyle(ButtonStyle.Success).setLabel(label).setDisabled(ended)
					),
				new ActionRowBuilder<ButtonComponentBuilder>()
			)
		);

		return { embeds: [embed], components };
	}

	private renderRequestContent(
		menu: StringSelectMenuInteraction<'cached'>,
		entry: DonationDeskEntrySchema,
		responses: Response[]
	): MessageCreateOptions {
		const embed = new EmbedBuilder()
			.setColor(getHighestRoleColor(menu.member))
			.setTitle(`${entry.name} Donation`)
			.setDescription(join(...responses.map((response) => `${bold(`${response.question.label}:`)} ${response.value}`)))
			.setFooter({ text: `${menu.user.tag} (${menu.user.id})`, iconURL: getUserAvatarURL(menu.user) });

		return {
			allowedMentions: { roles: [entry.roles.staff!], users: [menu.user.id] },
			content: `${roleMention(entry.roles.staff!)} ${menu.member.nickname ? userMention(menu.user.id) : userMention(menu.user.id)}`,
			embeds: [embed]
		};
	}
}
