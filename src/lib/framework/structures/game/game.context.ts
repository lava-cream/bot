import type { PlayerSchema } from '#lib/database';
import type { PlayerGamesStatisticSchema } from '#lib/database/models/economy/player/player.game.schema.js';
import { CustomId, InteractionMessageContentBuilder, isCommandInteractionExpired } from '#lib/utilities';
import { Result } from '@sapphire/result';
import { isNullOrUndefined } from '@sapphire/utilities';
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
  public interactions = 1;
  /**
   * The custom id utility based on this context's attached command interaction.
   * @since 6.0.0
   */
  public customId: CustomId;
  /**
   * The last message id.
   */
  private messageId: string | null = null;

  /**
   * The constructor.
   * @param options Options to construct.
   */
  public constructor(public options: GameSessionOptions) {
    this.game = options.game;
    this.db = options.db;
    this.command = options.command;
    this.customId = new CustomId(options.command.createdAt);
  }

  /**
   * The game's statistics from the player's db entry.
   */
  public get dbGame() {
    return this.db.games.resolve(this.game.id) ?? this.db.games.create(this.game.id);
  }

  /**
   * Calls for the play method of the game.
   * @returns The return value of {@link Game#play}.
   */
  public play() {
    return Reflect.apply(this.game.play, this.game, [this]);
  }

  /**
   * Creates a follow-up response to the command interaction.
   * @param content Options to reply to the interaction.
   * @returns The message interaction.
   */
  public async respond(content: string | InteractionReplyOptions) {
    const message = await this.command.followUp(content);
    this.messageId = message.id;
    return message;
  }

  /**
   * Edits the most recent response of the command interaction.
   * @param content Options to reply to the interaction.
   * @returns The message interaction.
   */
  public async edit(content: string | WebhookEditMessageOptions): Promise<void> {
    if (isNullOrUndefined(this.messageId)) {
      await this.command.editReply(content);
      return;
    }

    this.messageId = (await this.command.webhook.editMessage(this.messageId, content)).id; 
  }

  /**
   * Updates the game's statistics.
   * @param coins The coins to add.
   * @returns This context.
   */
  public win(coins: number): this {
    return this.updateStats(this.dbGame.wins, coins, [this.dbGame.loses, this.dbGame.ties]);
  }

  /**
   * Updates the game's statistics.
   * @param coins The coins to add.
   * @returns This context.
   */
  public lose(coins: number): this {
    return this.updateStats(this.dbGame.loses, coins, [this.dbGame.wins, this.dbGame.ties]);
  }

  /**
   * Updates the game's statistics.
   * @param coins The coins to add.
   * @returns This context.
   */
  public tie(coins: number): this {
    return this.updateStats(this.dbGame.ties, coins, [this.dbGame.loses, this.dbGame.wins]);
  }

  /**
   * Ends the current session. Calls {@link GameContext#play()} again if necessary.
   * @param force Whether the game should not call {@link GameContext#play} again or not.
   */
  public async end(force = false): Promise<unknown> {
    if (isCommandInteractionExpired(this.command)) return;

    const checked = Result.from<void, string>(() => this.check(force));
    if (checked.isErr()) return this.respond(this.renderMessage(checked.unwrapErr()));

    return this.setInteractions(this.interactions + 1).play();
  }

  /**
   * Updates a statistic.
   * @param stat The stats to update.
   * @param coins The coins to add to the stat.
   * @param statsToResetStreak The stats to reset its respective streaks.
   * @returns This context.
   */
  protected updateStats(stat: PlayerGamesStatisticSchema, coins: number, statsToResetStreak: PlayerGamesStatisticSchema[]) {
    for (const stat of statsToResetStreak.values()) stat.streak.resetValue();

    stat.addValue(1).streak.addValue();
    stat.coins.addValue(coins);

    return this;
  }

  /**
   * Sets the interactions amount of this context.
   * @param value The value to set.
   * @returns This context.
   */
  protected setInteractions(value: number): this {
    this.interactions = value;
    return this;
  }

  /**
   * Does all the necessary checks to see if the player can still continue playing games or not.
   * @param force Whether the game ended forcefully.
   */
  protected check(force: boolean): void {
    if (force) throw 'This session has ended.';
    if (this.interactions >= this.game.interactionsLimit) throw 'You have reached the maximum interactions for this session.';
    if (this.db.energy.isExpired()) throw 'Your energy just expired!';
    if (this.db.bet.value > this.db.wallet.value) throw "You don't have enough coins to play anymore.";
    if (this.db.wallet.isMaxValue(this.db.upgrades.mastery)) throw 'Your wallet just reached its maximum capacity.';
  }

  /**
   * Renders the idle message.
   */
  private renderMessage(message: string) {
    return new InteractionMessageContentBuilder().addEmbed((embed) =>
      embed.setTitle('Game Ended').setColor(Constants.Colors.RED).setDescription(message)
    );
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
