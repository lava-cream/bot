import { Collector, CustomId, disableMessageComponents, edit, InteractionMessageContentBuilder, join, MessageContentBuilder, scatter, seconds, send, toReadable } from '#lib/utilities';
import { EmbedTemplates } from '#lib/utilities/discord/templates/templates.embed.js';
import { bold, inlineCode, memberNicknameMention, userMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum, Result } from '@sapphire/framework';
import { isNullOrUndefined, noop, toTitleCase } from '@sapphire/utilities';
import type { InteractionCollector, Message, MessageCollector, ThreadChannel } from 'discord.js';
import { ButtonInteraction, Collection, Constants, Snowflake } from 'discord.js';

enum Config {
  MaxSpamAmount = 25,
  MaxSpamPlayers = 10
}

enum Control {
  Join = 'spam-join',
  Start = 'spam-start',
  Stop = 'spam-stop'
}

enum Mode {
  Message = 'message',
  Button = 'button'
}

@ApplyOptions<Command.Options>({
  name: 'spam',
  description: 'Start a spam event.',
  detailedDescription: 'This spam event is a competition for spammers out there to win a cool prize!',
  requiredUserPermissions: ['MANAGE_MESSAGES'],
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class SpamCommand extends Command {
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const prize = Math.trunc(command.options.getNumber('prize', true));
    const mode = command.options.getString('mode', true) as Mode;

    const players: SpamCommand.Players = new Collection();
    const customId = new CustomId(command.createdAt);
    const payload: SpamCommand.Payload = { command, customId, prize, mode, players };

    const gatheredPlayers = await this.gatherPlayers(payload);
    if (gatheredPlayers.isErr()) return send(command, builder => builder.addEmbed(() => EmbedTemplates.createSimple(gatheredPlayers.unwrapErr())));

    const collected = await this.collectSpams(payload);
    if (collected.isErr()) return send(command, builder => builder.addEmbed(() => EmbedTemplates.createSimple(collected.unwrapErr())));

    const [winners, losers] = players.partition((player) => player.spams >= 1);

    await send(command, builder => builder.addEmbed(() => EmbedTemplates.createSimple('Sending result...')));
    await Promise.allSettled([...this.splitPrice(prize, winners).values()].sort((a, b) => b.spams - a.spams).map(async (player) => {
      const db = await this.container.db.players.fetch(player.button.user.id);
      await db.run(({ wallet }) => wallet.addValue(player.won)).save();  
    }));

    await send(command, builder => builder.addEmbed(embed => 
      embed  
        .setTitle(`${toReadable(prize)} ${toTitleCase(mode)} Spam Event`)
        .setColor(Constants.Colors.GOLD)
        .setDescription(join([...winners.concat(losers).values()].map(({ button, spams, won }, idx) => 
          `${spams > 0 ? ['🥇', '🥈', '🥉'].at(idx) ?? '👏' : '💀'} ${bold(spams.toLocaleString())} spams - ${bold(button.member.nickname ?? button.user.username)} won ${spams > 0 ? `${bold(won.toLocaleString())} coins` : 'nothing'}!`
        )))
    ));

    return;
  }

  private renderContent(ended: boolean, { command, customId, mode, prize, players }: SpamCommand.Payload) {
    return new InteractionMessageContentBuilder()
      .addEmbed(embed =>
        embed
          .setTitle(`${toTitleCase(mode)} Spam Event`)
          .setColor(ended ? Constants.Colors.DARK_BUT_NOT_BLACK : Constants.Colors.DARK_GOLD)
          .setDescription(`${bold(command.user.tag)} just started a ${bold(toReadable(prize, 2))} spam event!`)
          .setFields({
            name: `Players (${players.size}/${Config.MaxSpamPlayers})`,
            value: players.size ? players.map(({ button: { member, user: { id } } }) => member.nickname ? memberNicknameMention(id) : userMention(id)).join(', ') : 'No players yet.'
          })
      )
      .addRow(row =>
        Object.entries(Control).reduce((row, [key, control]) =>
          row.addButtonComponent(btn =>
            btn
              .setCustomId(customId.create(control))
              .setLabel(toTitleCase(key))
              .setStyle(ended ? Constants.MessageButtonStyles.SECONDARY : Constants.MessageButtonStyles.PRIMARY)
              .setDisabled(ended)
          ),
          row
        )
      )
  }

  private async gatherPlayers({ command, customId, mode, players, prize }: SpamCommand.Payload): Promise<Result<SpamCommand.Players, string>> {
    return Result.fromAsync(async () =>
      new Promise(async (resolve, reject) => {
        const collector = new Collector({
          message: await send(command, this.renderContent(false, { command, customId, mode, players, prize })),
          time: seconds(60),
          max: Infinity,
          componentType: 'BUTTON',
          actions: {
            [customId.create(Control.Join)]: async (ctx) => {
              if (players.has(ctx.interaction.user.id)) {
                await send(ctx.interaction, builder => builder.addEmbed(() => EmbedTemplates.createSimple('You already joined!')));
                return;
              }

              players.set(ctx.interaction.user.id, this.createPlayer(ctx.interaction));
              await edit(command, this.renderContent(false, { command, customId, mode, players, prize }));
              await send(ctx.interaction, builder => builder.addEmbed(() => EmbedTemplates.createSimple(`You successfully joined the event!`)));
              if (players.size === Config.MaxSpamPlayers) return ctx.stop();
            },
            [customId.create(Control.Start)]: async ctx => {
              if (ctx.interaction.user.id !== command.user.id) {
                await send(ctx.interaction, builder => builder.addEmbed(() => EmbedTemplates.createSimple("Hey! You're not the event host!")));
                return;
              }

              await send(ctx.interaction, builder => builder.addEmbed(() => EmbedTemplates.createSimple('You started the event!')));
              return ctx.stop();
            },
            [customId.create(Control.Stop)]: async ctx => {
              if (ctx.interaction.user.id !== command.user.id) {
                await send(ctx.interaction, builder => builder.addEmbed(() => EmbedTemplates.createSimple("Hey! You're not the event host!")));
                return;
              }

              await edit(command, builder => builder.addEmbed(() => EmbedTemplates.createSimple("The host stopped the event.")));
              await send(ctx.interaction, builder => builder.addEmbed(() => EmbedTemplates.createSimple('You stopped the event!')));
              return ctx.stop();
            }
          },
          filter: async (button) => {
            await button.deferReply({ ephemeral: true });
            return true;
          },
          end: async (context) => {
            await edit(command, this.renderContent(true, { command, customId, mode, players, prize }));

            if (context.wasInternallyStopped() && context.reason !== 'time') return reject('The event was internally stopped.');
            if (players.size <= 0) return reject(`The event didn't receive enough participants.`);
            return resolve(players);
          }
        });

        await collector.start();
      })
    );
  }

  private collectSpams(payload: SpamCommand.Payload): Promise<Result<SpamCommand.Players, string>> {
    return Result.fromAsync(() =>
      new Promise(async (resolve, reject) => {
        const { command, mode, players, prize }: SpamCommand.Payload = payload;
        const sentMessage = await this.sendMessage(payload);
        if (isNullOrUndefined(sentMessage.isErr())) return reject('Unable to send message.');

        const message = await payload.command.fetchReply(), { thread } = message;
        if (isNullOrUndefined(thread)) return reject('Thread channel missing.');

        const collector = this.getCollector({ ...payload, thread });

        collector.on('collect', (elem) => {
          const player = players.get(elem instanceof ButtonInteraction ? elem.user.id : elem.author.id);
          if (!isNullOrUndefined(player)) player.spams++;
          if (players.reduce((n, player) => player.spams + n, 0) >= Config.MaxSpamAmount * players.size) collector.stop('spam-limit');
        });

        collector.once('end', async () => {
          if (mode === Mode.Button) await sentMessage.unwrap().edit({ components: disableMessageComponents(sentMessage.unwrap().components) });

          await thread.send(new MessageContentBuilder().addEmbed(() => EmbedTemplates.createSimple('The results are in and the event has ended!')));
          await thread.edit({ locked: true, archived: true }, `${mode} spam event ended`).catch(noop);

          return resolve(this.splitPrice(prize, players));
        });

        await send(command, builder => builder
          .addEmbed(() => EmbedTemplates.createSimple('The event has started!'))
          .addRow(row => row.addButtonComponent(btn => 
            btn
              .setStyle(Constants.MessageButtonStyles.LINK)  
              .setLabel(thread.name)
              .setURL(sentMessage.unwrap().url)
          ))
        );
      })
    );
  }

  private createPlayer(button: ButtonInteraction<'cached'>): SpamCommand.Player {
    return { button, spams: 0, won: 0 };
  }

  private splitPrice(prize: number, players: SpamCommand.Players): SpamCommand.Players {
    const payouts = scatter(prize, players.size);
    const sortedPlayers = players.sort((a, b) => b.spams - a.spams);

    for (const [index, prize] of payouts.entries()) {
      const playerId = players.keyAt(index);
      const player = playerId ? sortedPlayers.get(playerId) : null;

      if (!isNullOrUndefined(player)) Reflect.set(player, 'won', prize.value);
    }

    return players;
  }

  private async sendMessage(payload: SpamCommand.Payload): Promise<Result<Message<boolean>, string>> {
    return Result.fromAsync(() =>
      new Promise(async (resolve, reject) => {
        const commandMessage = await payload.command.fetchReply();
        if (commandMessage.channel.type !== 'GUILD_TEXT') return reject('Not in a text channel.');

        const atEveryoneRole = commandMessage.channel.permissionOverwrites.resolve(payload.command.guildId);
        if (!isNullOrUndefined(atEveryoneRole)) await atEveryoneRole.edit({ SEND_MESSAGES_IN_THREADS: payload.mode === Mode.Message });

        const thread = await commandMessage.channel.threads.create({
          startMessage: commandMessage.id,
          name: 'Spam Event',
          invitable: true,
          type: 'GUILD_PUBLIC_THREAD',
          autoArchiveDuration: 'MAX'
        });

        const content = new MessageContentBuilder()
          .addEmbed(() =>
            EmbedTemplates.createSimple(`Spam ${bold(commandMessage.guild.name)} ${inlineCode(Math.trunc(Config.MaxSpamAmount * payload.players.size).toLocaleString())} times!`)
          );

        switch (payload.mode) {
          case Mode.Button: {
            return resolve(await thread.send(
              content.addRow(row =>
                row.addButtonComponent(btn =>
                  btn
                    .setStyle(Constants.MessageButtonStyles.SECONDARY)
                    .setLabel(commandMessage.guild.name)
                    .setCustomId(payload.customId.create(this.name))
                )
              )
            ));
          }

          case Mode.Message: {
            return resolve(await thread.send(content));
          };
        }
      })
    );
  }

  // private getCollector(payload: SpamCommand.Payload & { mode: Mode.Message; thread: ThreadChannel }): MessageCollector;
  // private getCollector(payload: SpamCommand.Payload & { mode: Mode.Button; thread: ThreadChannel }): InteractionCollector<ButtonInteraction>;
  private getCollector(payload: SpamCommand.Payload & { thread: ThreadChannel }): MessageCollector | InteractionCollector<ButtonInteraction> {
    switch (payload.mode) {
      case Mode.Button: {
        return payload.thread.createMessageComponentCollector({
          max: Infinity,
          time: seconds(60),
          componentType: 'BUTTON',
          filter: async button => {
            await button.deferUpdate();
            return payload.players.has(button.user.id);
          }
        });
      };

      case Mode.Message: {
        return payload.thread.createMessageCollector({
          max: Infinity,
          time: seconds(60),
          filter: message => payload.players.has(message.author.id) && message.content.toLowerCase().includes(payload.command.guild.name.toLowerCase())
        });
      };
    }
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addNumberOption((option) =>
          option
            .setName('prize')
            .setDescription('The prize pool to be split by the players.')
            .setRequired(true)
            .setMinValue(5_000_000)
        )
        .addStringOption(option =>
          option
            .setName('mode')
            .setDescription('The mode of spam.')
            .setRequired(true)
            .addChoices(...Object.entries(Mode).map(([name, value]) => ({ name, value })))
        )
    );
  }
}

export declare namespace SpamCommand {
  /**
   * Represents a group of {@link Player players}.
   */
  type Players = Collection<Snowflake, Player>;

  /**
   * Represents a spammer.
   */
  interface Player {
    button: ButtonInteraction<'cached'>;
    spams: number;
    won: number;
  }

  /**
   * The generic payload to process the whole command.
   */
  interface Payload {
    command: Command.ChatInputInteraction<'cached'>;
    customId: CustomId;
    mode: Mode;
    players: Players;
    prize: number;
  }
}