import type { Loggers } from './logger.entries';
import { Logger } from './logger.piece.js';
import { srcDir } from '#lib/utilities';
import { Store } from '@sapphire/framework';
import { join } from 'node:path';

/**
 * The logger store.
 */
export class LoggerStore extends Store<Logger<Loggers.Keys>> {
  public constructor() {
    super(Logger, { name: 'loggers' });
    super.container.stores.get('listeners').registerPath(join(srcDir, 'logger', 'listeners'));
    // super.registerPath(join(srcDir, 'logger', 'pieces'));
  }

  public override get<K extends Loggers.Keys>(key: K): Logger<K>;
  public override get(key: string): undefined;
  public override get(key: string) {
    return super.find((l) => l.id === key) ?? super.get(key);
  }
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    loggers: LoggerStore;
  }
}
