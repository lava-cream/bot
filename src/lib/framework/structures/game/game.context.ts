import type { PlayerSchema } from '#lib/database';
import { ComponentId, InteractionMessageContentBuilder, isCommandInteractionExpired } from '#lib/utilities';
import { Result } from '@sapphire/result';
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
   * The amount of user interactions this context has spent.
   */
  public interactions = 0;
  /**
   * The custom id utility based on this context's attached command interaction.
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
    this.customId = new ComponentId(options.command.createdAt);
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
    
    const checked = Result.from<void, string>(this.check(force));
    if (checked.isErr()) return void await this.respond(this.renderMessage(checked.unwrapErr()));

    this.interactions++;
    await this.game.play(this);
    return;
  }

  /**
   * Does all the necessary checks to see if the player can still continue playing games or not.
   * @param force Whether the game ended forcefully.
   */
  protected check(force: boolean) {
    if (force) throw 'This session has ended.';
    if (this.interactions >= GameContext.MaximumInteractions) throw 'You have reached the maximum interactions for this session.'; 
    if (this.db.energy.isExpired()) throw 'Your energy just expired!';
    if (this.db.bet.value > this.db.wallet.value) throw "You don't have enough coins to play anymore.";
    if (this.db.wallet.isMaxValue(this.db.upgrades.mastery)) throw 'Your wallet just reached its maximum capacity.';
  }

  /**
   * Renders the idle message.
   */
  private renderMessage(message: string) {
    return new InteractionMessageContentBuilder()
      .addEmbed((embed) => embed.setTitle('Game Ended').setColor(Constants.Colors.RED).setDescription(message));
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
