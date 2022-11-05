import type { DonationDeskEntryQuestionSchema, DonationDeskEntrySchema, DonationDeskSchema } from '#lib/database';
import { Collector, getGuildIconURL, getHighestRoleColor, getUserAvatarURL, join, MessageActionRowBuilder, minutes } from '#lib/utilities';
import { bold, memberNicknameMention, roleMention, userMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { isTextChannel } from '@sapphire/discord.js-utilities';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { chunk, isNullOrUndefined, noop } from '@sapphire/utilities';
import type { Option } from '@sapphire/result';
import type { MessageOptions, ModalActionRowComponent, SelectMenuInteraction, WebhookEditMessageOptions } from 'discord.js';
import { Constants, MessageActionRow, MessageEmbed, Modal, TextInputComponent } from 'discord.js';

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
  public override async parse(menu: SelectMenuInteraction): Promise<Option.None | Option.Some<Parsed>> {
    if (!menu.inCachedGuild()) return this.none();

    const db = await this.container.db.desks.fetch(menu.guild.id);
    if (isNullOrUndefined(db.channels.desk.id) || menu.message.id !== db.channels.desk.message) return this.none();

    const selected = menu.values.at(0);
    const entry = selected ? db.entries.resolve(selected) : null;
    if (isNullOrUndefined(entry) || !entry.questions.entries.length) return this.none();

    await menu.deferReply({ ephemeral: true });
    return this.some({ db, entry });
  }

  public async run(menu: SelectMenuInteraction<'cached'>, { db, entry }: Parsed) {
    if (isNullOrUndefined(entry.roles.access) || isNullOrUndefined(entry.roles.staff) || isNullOrUndefined(db.channels.access)) return;

    const access = await menu.guild.roles.fetch(entry.roles.access);
    const staff = await menu.guild.roles.fetch(entry.roles.staff);
    if (isNullOrUndefined(access) || isNullOrUndefined(staff)) {
      await menu.editReply({ content: 'Missing role configuration.' });
      return;
    }

    const desk = await menu.guild.channels.fetch(db.channels.access);
    if (isNullOrUndefined(desk) || !desk.isText() || !isTextChannel(desk)) {
      await menu.editReply({ content: 'Channel misconfiguration.' });
      return;
    }

    const responses: Response[] = [];
    const collector = new Collector({
      message: await menu.editReply(this.renderInitialContent(menu, entry, responses)),
      componentType: 'BUTTON',
      time: minutes(5),
      max: Infinity,
      filter: (button) => button.user.id === menu.user.id
    });

    for (const question of entry.questions.entries.values()) {
      collector.actions.add(question.id, async (ctx) => {
        ctx.collector.resetTimer();

        await ctx.interaction.showModal(
          new Modal()
            .setCustomId(question.id)
            .setTitle(question.label)
            .setComponents(
              new MessageActionRow<ModalActionRowComponent>().setComponents([
                new TextInputComponent()
                  .setStyle(Constants.TextInputStyles.PARAGRAPH)
                  .setLabel(question.value)
                  .setRequired(true)
                  .setCustomId(question.id)
              ])
            )
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
            if (!message) return void (await menu.followUp({ ephemeral: true, content: 'Lmao imagine running into an error. I guess you did.' }));

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
    menu: SelectMenuInteraction<'cached'>,
    entry: DonationDeskEntrySchema,
    responses: Response[],
    ended = false
  ): WebhookEditMessageOptions {
    const isSubmittable = responses.length === entry.questions.entries.length;
    const embed = new MessageEmbed()
      .setColor(isSubmittable ? Constants.Colors.GREEN : Constants.Colors.NOT_QUITE_BLACK)
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
              .setStyle(isSubmittable ? Constants.MessageButtonStyles.SUCCESS : Constants.MessageButtonStyles.PRIMARY)
          ),
        new MessageActionRowBuilder()
      )
    );

    components.push(
      Object.values(Controls).reduce(
        (row, label) =>
          row.addButtonComponent((btn) =>
            btn.setCustomId(label.toLowerCase()).setStyle(Constants.MessageButtonStyles.SUCCESS).setLabel(label).setDisabled(ended)
          ),
        new MessageActionRowBuilder()
      )
    );

    return { embeds: [embed], components };
  }

  private renderRequestContent(menu: SelectMenuInteraction<'cached'>, entry: DonationDeskEntrySchema, responses: Response[]): MessageOptions {
    const embed = new MessageEmbed()
      .setColor(getHighestRoleColor(menu.member))
      .setTitle(`${entry.name} Donation`)
      .setDescription(join(...responses.map((response) => `${bold(`${response.question.label}:`)} ${response.value}`)))
      .setFooter({ text: `${menu.user.tag} (${menu.user.id})`, iconURL: getUserAvatarURL(menu.user) });

    return {
      allowedMentions: { roles: [entry.roles.staff!], users: [menu.user.id] },
      content: `${roleMention(entry.roles.staff!)} ${menu.member.nickname ? memberNicknameMention(menu.user.id) : userMention(menu.user.id)}`,
      embeds: [embed]
    };
  }
}
