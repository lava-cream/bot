import type { PlayerSchema } from '#lib/database';
import { InteractionMessageContentBuilder, isCommandInteractionExpired } from '#lib/utilities';
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
   * The command interaction received from the gateway.
   */
  public command: CommandInteraction<'cached'>;

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
   * Ends the current session. Calls {@link Game#play()} again if the energy is not gonna die.
   */
  public async end(failed = false): Promise<void> {
    if (isCommandInteractionExpired(this.command)) return;

    if (failed) {
      return void (await this.respond(this.renderIdleMessage("You've been idle for too long. The game session has ended.")));
    }

    if (this.db.energy.isExpired()) {
      return void (await this.respond(this.renderIdleMessage('Your energy has expired! You have to run this command again to reactivate it.')));
    }

    return void (await this.game.play.call(this.game, this));
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
