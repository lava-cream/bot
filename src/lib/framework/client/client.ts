import { ApplicationCommandRegistries, Piece, RegisterBehavior, SapphireClient, Store } from '@sapphire/framework';
import { Guild, Permissions, Team, User } from 'discord.js';
import { isNullOrUndefined, toTitleCase } from '@sapphire/utilities';
import { piecesDir, pluralise } from '#lib/utilities';
import { BoosterStore, GameStore, LoggerStore } from '#lib/framework/structures/index.js';
import chalk from 'chalk';

/**
 * Represents the discord client to use.
 * @extends SapphireClient
 * @since 5.1.0
 * @version 6.0.0
 */
export default class LavaClient extends SapphireClient {
  static {
    Reflect.set(Store.defaultStrategy, 'onLoadAll', (store: Store<Piece>) => {
      store.container.logger.info(
        chalk`{whiteBright Loaded {greenBright ${store.size}} ${toTitleCase(
          (store.name.toLowerCase().endsWith('s') ? store.name.toLowerCase() : pluralise(store.name.toLowerCase(), store.size)).replaceAll('-', ' ')
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

  public override generateInvite(): string {
    return super.generateInvite({
      scopes: ['applications.commands'],
      permissions: [Permissions.FLAGS.USE_APPLICATION_COMMANDS]
    });
  }

  public override async login(token = process.env.DISCORD_TOKEN) {
    this.stores.registerPath(piecesDir);
    this.stores.register(new BoosterStore()).register(new GameStore()).register(new LoggerStore());

    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);

    return super.login(token);
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
