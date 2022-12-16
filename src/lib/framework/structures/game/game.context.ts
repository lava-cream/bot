import type { PlayerSchema } from '#lib/database';
import { ComponentId, InteractionMessageContentBuilder, isCommandInteractionExpired } from '#lib/utilities';
import { CommandInteraction, Constants, InteractionReplyOptions, WebhookEditMessageOptions } from 'discord.js';
import type { Game } from './game.piece.js';

/**
 * Represents a game context.
 */
export class GameContext {
  /**
   * The current game playing.
   */
  public game: Game;
  /**
   * The user's database entry.
   */
  public db: PlayerSchema.Document;
  /**
   * The command interaction object.
   */
  public command: CommandInteraction<'cached'>;
  /**
   * The amount of user interactions this context has took.
   */
  public interactions = 0;

  /**
   * The custom id util based on this context's command interaction.
   * @since 6.0.0
   */
  public customId: ComponentId;

  /**
   * The constructor.
   * @param options Options to construct.
   */
  public constructor(public options: GameSessionOptions) {
    this.game = options.game;
    this.db = options.db;
    this.command = options.command;
    this.customId = new ComponentId(new Date(options.command.createdTimestamp));
  }

  /**
   * Creates a follow-up response to the command interaction.
   * @param content Options to reply to the interaction.
   * @returns The message interaction.
   */
  public respond(content: string | InteractionReplyOptions) {
    return this.command.followUp(content);
  }

  /**
   * Edits the most recent response of the command interaction.
   * @param content Options to reply to the interaction.
   * @returns The message interaction.
   */
  public edit(content: string | WebhookEditMessageOptions) {
    return this.command.editReply(content);
  }

  /**
   * Ends the current session. Calls {@link Game#play()} again if necessary.
   */
  public async end(force = false): Promise<void> {
    if (isCommandInteractionExpired(this.command)) return;

    if (force) {
      await this.respond(this.renderIdleMessage('This session has ended.'));
      return;
    }

    if (this.interactions >= GameContext.MaximumInteractions) {
      await this.respond(this.renderIdleMessage('You have reached the maximum interactions for this session.'));
      return;
    }

    if (this.db.energy.isExpired()) {
      await this.respond(this.renderIdleMessage('Your energy just expired!'));
      return;
    }

    if (this.db.bet.value > this.db.wallet.value) {
      await this.respond(this.renderIdleMessage("You don't have enough coins to play anymore."));
      return;
    }

    if (this.db.wallet.isMaxValue(this.db.upgrades.mastery)) {
      await this.respond(this.renderIdleMessage('Your wallet just reached its maximum capacity.'));
      return;
    }

    this.interactions++;
    await this.game.play(this);
    return;
  }

  /**
   * Renders the idle message.
   */
  private renderIdleMessage(message: string) {
    return new InteractionMessageContentBuilder()
      .setAllowedMentions({ users: [this.command.user.id] })
      .setContent(this.command.user.toString())
      .addEmbed((embed) => embed.setColor(Constants.Colors.RED).setDescription(message).setTimestamp(this.command.createdTimestamp));
  }

  /**
   * The maximum amount of interactions a game context could only take.
   */
  private static MaximumInteractions = 60;
}

/**
 * Options to construct a game session.
 */
export interface GameSessionOptions {
  /**
   * The game to play.
   */
  readonly game: Game;
  /**
   * The user's economic shitfuckery.
   */
  readonly db: PlayerSchema.Document;
  /**
   * The command interaction from the `/play` (or whatever that is) command.
   */
  readonly command: CommandInteraction<'cached'>;
}
