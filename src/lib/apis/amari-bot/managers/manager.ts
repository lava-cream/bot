import { Collection } from '@discordjs/collection';
import type { Constructable } from 'discord.js';
import type AmariClient from '../client/amari.client.js';

export interface BaseFetchOptions {
  cache?: boolean;
  force?: boolean;
}

export abstract class Manager<Holds, Resolvable> {
  public readonly holds: Constructable<Holds>;
  public readonly cache: Collection<string, Holds>;

  protected constructor(public client: AmariClient, holds: Constructable<Holds>) {
    this.holds = holds;
    this.cache = new Collection();
  }

  protected add(id: string, thing: Holds): Holds {
    return this.cache.ensure(id, () => thing);
  }

  protected remove(resolvable: string): boolean {
    return this.cache.delete(resolvable);
  }

  public resolve(resolvable: Holds): Holds;
  public resolve(resolvable: Resolvable): Holds | null;
  public resolve(resolvable: Holds | Resolvable): Holds | null {
    if (resolvable instanceof this.holds) return resolvable;
    if (typeof resolvable === 'string') return this.cache.get(resolvable) ?? null;
    return null;
  }

  public valueOf() {
    return this.cache;
  }
}
