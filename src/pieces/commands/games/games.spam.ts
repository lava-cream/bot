import {
  type ButtonBuilder,
  createResponsiveTimer,
  getHighestRoleColor,
  isPromiseFulfilled,
  join,
  pluralise,
  randomColor,
  scatter,
  seconds,
  toOrdinal,
  toReadable,
  InteractionMessageContentBuilder,
  send,
  edit,
  toNearestReadable,
  getGuildIconURL
} from '#lib/utilities';
import { bold, inlineCode, memberNicknameMention, userMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { isTextChannel } from '@sapphire/discord.js-utilities';
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { isNullOrUndefined, noop } from '@sapphire/utilities';
import { ButtonInteraction, Collection, CommandInteraction, Constants, Message, Snowflake, User } from 'discord.js';

interface Spammer {
  spams: number;
  button: ButtonInteraction<'cached'>;
  won: number;
}

enum SpamControls {
  Join = 'bot.commands.spam.join',
  Start = 'bot.commands.spam.start',
  Stop = 'bot.commands.spam.stop'
}

enum SpamConfig {
  MinimumSpamAmount = 15,
  MaximumSpamPlayers = 30,
}

type SpamPlayers = Collection<Snowflake, Spammer>;

@ApplyOptions<Command.Options>({
  name: 'spam',
  description: 'Start a spam event! Top spammer gets the most payouts while the bottom one gets the least.',
  requiredUserPermissions: ['MANAGE_MESSAGES'],
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class SpamCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const prize = Math.trunc(command.options.getNumber('prize', true));
    const lock = command.options.getBoolean('lock_channel') ?? true;
    const players: SpamPlayers = new Collection();
    const message = await edit(command, () => SpamCommand.renderIntroEmbed(command.user, players, prize));

    await Promise.all([
      SpamCommand.collectSpammers(command, prize, message, players, command.guild.name),
      createResponsiveTimer(60, async (seconds) => {
        if ([30, 15, 3, 2, 1].includes(seconds)) {
          await send(command, bold(`Starting in ${seconds} ${pluralise('second', seconds)}...`)).catch(noop);
        }
      })
    ]);

    if (players.size < 3) {
      await send(command, `The event received only ${bold(players.size.toString())} participants which isn't enough to start a spam event.`);
      return;
    }

    if (lock) await SpamCommand.manageChannel(message, true);

    const [winners] = await Promise.all([
      SpamCommand.collectMessages(message, players, command.guild.name),
      createResponsiveTimer(60, async (seconds) => {
        if ([30, 15, 3, 2, 1].includes(seconds)) {
          await send(command, bold(`${seconds} ${pluralise('second', seconds)} left!`));
        }
      })
    ]);

    if (lock) {
      await SpamCommand.manageChannel(message, false);
      await send(command, bold('This channel has been locked.'));
    }

    await send(command, content => content.addEmbed(embed => embed.setColor(Constants.Colors.DARK_GOLD).setDescription('Awaiting results...')));

    const results = await Promise.allSettled(
      SpamCommand.getResults(prize, winners).map(async (result) => {
        await send(result.button, (content) => 
          content
            .setEphemeral(true)
            .addEmbed(embed => 
              embed  
                .setColor(Constants.Colors.GREEN)
                .setDescription(join(
                  `You won ${inlineCode(result.won.toLocaleString())} coins.`,
                  `That's ${inlineCode(toNearestReadable(result.won))} for each message!\n`,
                  'The host will distribute your share shortly.'
                ))
                .setFooter({
                  text: command.guild.name,
                  iconURL: getGuildIconURL(command.guild) ?? undefined
                })
            )
        );

        return result;
      })
    );

    const losers = await Promise.all(
      players
        .filter((p) => !results.some((r) => (isPromiseFulfilled(r) ? p.button.user.id === r.value.button.user.id : true)))
        .map(async (loser) => {
          await send(loser.button, (content) => content.setEphemeral(true).setContent(`You lost the battle. Better luck next time!`));
          return loser;
        })
    );

    await edit(command, (content) =>
      content.addEmbed((embed) =>
        embed
          .setColor(getHighestRoleColor(command.member))
          .setTitle(`${bold(results.length.toLocaleString())} people managed to split ${bold(`⏣ ${prize.toLocaleString()}`)}`)
          .setDescription(
            join(
              ...results.filter<PromiseFulfilledResult<Spammer>>(isPromiseFulfilled).map(({ value: { spams, button, won } }, idx) => {
                const emojis = ['🥇', '🥈', '🥉'] as const;
                return `${bold(`${emojis.at(idx) ?? '👏'} ${spams.toLocaleString()}`)} - ${bold(button.user.username)} got ${bold(won.toLocaleString())}`;
              }),
              ...losers.map(({ button, spams }) => `${bold(`💀 ${spams.toLocaleString()} - ${button.user.username} didn't make it`)}`)
            )
          )
      )
    );
  }

  private static async manageChannel(message: Message<true>, SEND_MESSAGES: boolean) {
    try {
      if (isTextChannel(message.channel)) {
        await message.channel.permissionOverwrites.edit(message.guild.id, { SEND_MESSAGES });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private static renderIntroEmbed(host: User, players: SpamPlayers, prize: number, ended = false, failed = false) {
    return new InteractionMessageContentBuilder<ButtonBuilder>()
      .addEmbed((embed) =>
        embed
          .setTitle(`${toReadable(prize)} Spam Event`)
          .setColor(!ended ? randomColor() : failed ? Constants.Colors.RED : Constants.Colors.NOT_QUITE_BLACK)
          .setDescription(
            ended
              ? failed
                ? 'The event has been cancelled.'
                : 'The event has started! Spam as much as you can.'
              : 'Click the join button to join! Will start in a minute.'
          )
          .setFields({
            name: `Players (${players.size} Players)`,
            value: !players.size
              ? 'No players yet.'
              : players.map(({ button: { member, user } }) => (member.nickname ? memberNicknameMention(member.id) : userMention(user.id))).join(', ')
          })
          .setFooter({ text: `Hosted by ${host.tag}` })
      )
      .addRow((row) =>
        Object.entries(SpamControls).reduce(
          (row, [label, customId]) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(customId)
                .setLabel(label)
                .setDisabled(ended)
                .setStyle(
                  ended
                    ? failed
                      ? Constants.MessageButtonStyles.DANGER
                      : Constants.MessageButtonStyles.SECONDARY
                    : Constants.MessageButtonStyles.PRIMARY
                )
            ),
          row
        )
      );
  }

  private static createSpammer(button: Spammer['button']): Spammer {
    return { won: 0, spams: 0, button };
  }

  private static renderJoinedEvent(players: SpamPlayers) {
    return new InteractionMessageContentBuilder().addEmbed((embed) =>
      embed
        .setTitle('Event Joined')
        .setColor(Constants.Colors.GREEN)
        .setDescription(`You're the ${toOrdinal(players.size)} player to join!`)
    );
  }

  private static renderAlreadyJoined() {
    return new InteractionMessageContentBuilder().addEmbed((embed) =>
      embed.setTitle('Already Joined').setColor(Constants.Colors.RED).setDescription('You already joined the event, weirdo.')
    );
  }

  private static renderNotEventHost() {
    return new InteractionMessageContentBuilder().addEmbed((embed) =>
      embed.setTitle('Stop It.').setColor(Constants.Colors.RED).setDescription("Get some help. You're not the event host.")
    );
  }

  private static renderSpamMessage(word: string) {
    return new InteractionMessageContentBuilder().addEmbed((embed) =>
      embed
        .setTitle(word)
        .setColor(Constants.Colors.GREEN)
        .setDescription(`Spam ${bold(word)}`)
    );
  }

  private static collectSpammers(
    command: CommandInteraction<'cached'>,
    prize: number,
    message: Message<true>,
    players: SpamPlayers,
    word: string
  ): Promise<SpamPlayers> {
    return new Promise(async (resolve, reject) => {
      const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(60)
      });

      collector.on('collect', async (button) => {
        await button.deferReply({ ephemeral: true });
        switch (button.customId as SpamControls) {
          case SpamControls.Join: {
            if (players.has(button.user.id)) {
              await edit(button, this.renderAlreadyJoined());
              await collector.handleDispose(button);
              return;
            }

            players.set(button.user.id, this.createSpammer(button));
            await edit(button, this.renderJoinedEvent(players));
            await edit(command, this.renderIntroEmbed(command.user, players, prize, false, false));
            if (players.size === SpamConfig.MaximumSpamPlayers) collector.stop('max_capacity');
            break;
          }

          case SpamControls.Start: {
            if (command.user.id !== button.user.id) {
              await edit(button, this.renderNotEventHost());
              return;
            }

            await edit(button, 'You started the event!');
            collector.stop('start');
            break;
          }

          case SpamControls.Stop: {
            if (command.user.id !== button.user.id) {
              await edit(button, this.renderNotEventHost());
              return;
            }

            await edit(command, this.renderIntroEmbed(button.user, players, prize, true, true));
            await edit(button, 'You stopped the event.');
            collector.stop(button.customId);
            break;
          }
        }
      });

      collector.on('end', async (_, reason) => {
        if (reason === SpamControls.Stop) return;
        if (players.size < 1) {
          await send(command, content => content.setEphemeral(true).setContent('No one joined.'));
          await edit(command, this.renderIntroEmbed(command.user, players, prize, true, true));
          return reject(players);
        }

        await edit(command, this.renderIntroEmbed(command.user, players, prize, true, false));
        await send(command, SpamCommand.renderSpamMessage(word));
        return resolve(players);
      });
    });
  }

  private static collectMessages(message: Message<true>, players: SpamPlayers, word: string): Promise<Spammer[]> {
    return new Promise((resolve) => {
      const collector = message.channel.createMessageCollector({
        max: Infinity,
        time: seconds(60),
        filter: (msg) => players.has(msg.author.id) && msg.content.toLowerCase().includes(word.toLowerCase())
      });

      collector.on('collect', (message) => {
        const spammer = players.get(message.author.id);
        if (!isNullOrUndefined(spammer)) spammer.spams++;
      });

      collector.once('end', () =>
        resolve([
          ...players
            .filter((p) => p.spams >= SpamConfig.MinimumSpamAmount)
            .sort((a, b) => b.spams - a.spams)
            .values()
        ])
      );
    });
  }

  private static getResults(prize: number, winners: Spammer[]): Spammer[] {
    const payouts = scatter(prize, winners.length);

    for (const [index, winner] of winners.entries()) {
      winner.won = payouts.at(index)?.value ?? 0;
    }

    return winners;
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addNumberOption((builder) =>
          builder
            .setName('prize')
            .setDescription('The amount to be split by the players.')
            .setRequired(true)
            .setMinValue(5_000_000)
        )
        .addBooleanOption((builder) => builder.setName('lock_channel').setDescription('Whether or not to unlock this channel when the event starts.'))
    );
  }
}
