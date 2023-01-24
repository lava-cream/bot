import type { PlayerSchema } from '#lib/database';
import { CustomId, InteractionMessageContentBuilder } from '#lib/utilities';
import { EmbedTemplates } from '#lib/utilities/discord/templates/templates.embed.js';
import { Result } from '@sapphire/result';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Game } from './game.piece.js';
import { GameResponder } from './game.responder.js';
import { GameWinnings } from './game.winnings.js';

/**
 * Represents a game context.
 * @since 6.0.0
 */
export class GameContext {
	/**
	 * The command interaction object.
	 */
	public command: ChatInputCommandInteraction<'cached'>;
	/**
	 * A {@link CustomId} instance to easily create unique message component custom IDs.
	 */
	public customId: CustomId;
	/**
	 * The user's database entry.
	 */
	public db: PlayerSchema.Document;
	/**
	 * The current game playing.
	 */
	public game: Game;
	/**
	 * A {@link Responder} instance.
	 */
	public responder: GameResponder;
	/**
	 * The winnings calculator.
	 */
	public winnings: GameWinnings;

	/**
	 * The constructor.
	 * @param options Options to construct.
	 */
	public constructor(public options: GameContextOptions) {
		this.command = options.command;
		this.customId = new CustomId(options.command.createdAt);
		this.db = options.db;
		this.game = options.game;
		this.responder = new GameResponder(options.command);
		this.winnings = new GameWinnings();
	}

	/**
	 * The game's database schema from the player's db entry.
	 */
	public get schema() {
		return this.db.games.resolve(this.game.id) ?? this.db.games.create(this.game.id);
	}

	/**
	 * Calls for the play method of the game.
	 * @returns The return value of {@link Game#currencyPlay}.
	 */
	public play() {
		return Reflect.apply(this.game.currencyPlay, this.game, [this]);
	}

	/**
	 * Ends the current session. Calls {@link GameContext#play()} again if necessary.
	 * @param force Whether the game should not call {@link GameContext#play} again or not.
	 */
	public async end(force = false): Promise<unknown> {
		const checked = Result.from<void, string>(() => this.check(force));
		await checked.inspectErrAsync((err) => this.responder.send(() => this.renderMessage(err)));

		this.schema.setLastPlayed(new Date());
		if (force || checked.isErr()) await this.db.save();

		return checked.isOk() && this.play();
	}

	/**
	 * Does all the necessary checks to see if the player can still continue playing games or not.
	 * @param force Whether the game ended forcefully.
	 */
	protected check(force: boolean): void {
		if (force) throw 'This game has ended.';
		if (this.db.energy.isExpired()) throw 'Your energy just expired!';
		if (this.db.bet.value > this.db.wallet.value) throw "You don't have enough coins to play anymore.";
		if (this.db.wallet.isMaxValue(this.db.upgrades.mastery)) throw 'Your wallet just reached its maximum capacity.';
	}

	/**
	 * Renders the idle message.
	 */
	private renderMessage(message: string) {
		return new InteractionMessageContentBuilder().addEmbed(() => EmbedTemplates.createSimple(message));
	}
}

/**
 * Options to construct a {@link GameContext}.
 */
export interface GameContextOptions {
	/**
	 * The command interaction.
	 */
	readonly command: ChatInputCommandInteraction<'cached'>;
	/**
	 * The user's database entry.
	 */
	readonly db: PlayerSchema.Document;
	/**
	 * The game to play.
	 */
	readonly game: Game;
}
