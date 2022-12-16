import { piecesDir, pluralise } from '#lib/utilities';
import { ApplicationCommandRegistries, container, Piece, RegisterBehavior, SapphireClient, Store } from '@sapphire/framework';
import { isNullOrUndefined, toTitleCase } from '@sapphire/utilities';
import chalk from 'chalk';
import { ClientOptions, Guild, InviteGenerationOptions, Permissions, Team, User } from 'discord.js';

/**
 * Represents the discord client to use.
 * @since 5.1.0
 * @extends SapphireClient
 */
export default class MemersClient extends SapphireClient {
  public constructor(options: ClientOptions) {
    super(options);

    container.client = this;
    container.logger.debug('[CLIENT]', `Instance of ${this.constructor.name} created.`);

    Reflect.set(Store.defaultStrategy, 'onLoadAll', (store: Store<Piece>) => {
      store.container.logger.info(
        chalk`{whiteBright Loaded {greenBright ${store.size}} ${toTitleCase(
          (
            store.name.toLowerCase().endsWith('s')
              ? store.name.toLowerCase()
              : pluralise(store.name.toLowerCase(), store.size)
          )
            .replaceAll('-', ' ')
        )}}`
      );
    });
  }

  public override get support(): Guild | null {
    return this.guilds.resolve(this.options.supportGuild);
  }

  public override get owner(): User | null {
    return this.isReady() && !isNullOrUndefined(this.application.owner)
      ? this.application.owner instanceof Team
        ? !isNullOrUndefined(this.application.owner.owner)
          ? this.users.resolve(this.application.owner.owner.id)
          : null
        : this.users.resolve(this.application.owner.id)
      : null;
  }

  public override generateInvite(options?: InviteGenerationOptions): string {
    return super.generateInvite(
      options ?? {
        scopes: ['applications.commands', 'bot'],
        permissions: [Permissions.FLAGS.ADMINISTRATOR]
      }
    );
  }

  public override async login(token = process.env.DISCORD_TOKEN) {
    this.stores.registerPath(piecesDir);

    const { GameStore, LoggerStore } = await import('#lib/framework/index.js');
    this.stores.register(new GameStore()).register(new LoggerStore());

    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);

    return await super.login(token);
  }
}

declare module 'discord.js' {
  interface Client<Ready extends boolean = boolean> {
    readonly support: If<Ready, Guild>;
    readonly owner: If<Ready, User>;
    generateInvite(): string;
  }

  interface ClientOptions {
    supportGuild: string;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string;
    }
  }
}
