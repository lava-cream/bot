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
   * The constructor.
   * @param options Options to construct.
   */
  public constructor(public options: GameSessionOptions) {
    this.game = options.game;
    this.db = options.db;
    this.command = options.command;
  }

  /**
   * The custom id util based on this context's command interaction.
   * @since 6.0.0
   */
  public get customId() {
    return new ComponentId(new Date(this.command.createdTimestamp));
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
   * Ends the current session. Calls {@link Game#play()} again if the energy is still up.
   */
  public async end(failed = false): Promise<void> {
    if (isCommandInteractionExpired(this.command)) return;
    
    if (this.interactions === GameContext.MaximumInteractions) {
      await this.respond(this.renderIdleMessage("You have reached the maximum interactions for the current session so the session has ended."));
      return;
    }

    if (failed) {
      await this.respond(this.renderIdleMessage("You have been idle for so long. The current session has ended."));
      return;
    }

    if (this.db.energy.isExpired()) {
      await this.respond(this.renderIdleMessage("Your energy has expired! The current session has ended."))
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
      .addEmbed((embed) => embed.setTitle('Exiting Game...').setColor(Constants.Colors.RED).setDescription(message));
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
