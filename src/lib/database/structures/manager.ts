import { container } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';
import { ReturnModelType, mongoose, getModelForClass, Severity } from '@typegoose/typegoose';
import type { AnyParamConstructor } from '@typegoose/typegoose/lib/types';
import { BaseManager, Collection } from 'discord.js';
import type { CreateResolvableSchemaType, CastDocument, Schema } from './schema.js';
import type { Client } from '#lib/database/client/client';

export interface ManagerOptions<T extends Schema> {
  readonly holds: AnyParamConstructor<T>;
  readonly name: string;
  readonly client: Client;
}

export abstract class Manager<T extends Schema> extends BaseManager {
  protected readonly cache: Collection<T['_id'], CastDocument<T>>;
  public readonly model: ReturnModelType<AnyParamConstructor<T>>;

  public constructor(public options: ManagerOptions<T>) {
    super(container.client);
    this.cache = new Collection();
    this.model = getModelForClass(options.holds, {
      existingConnection: options.client.connection?.connection ?? mongoose.connection,
      existingMongoose: options.client.connection ?? mongoose,
      options: {
        allowMixed: Severity.ALLOW,
        customName: options.name
      }
    });
  }

  protected add(document: CastDocument<T>) {
    return this.cache.ensure(document._id, () => document);
  }

  protected remove(documentOrId: CreateResolvableSchemaType<T>): boolean {
    return this.cache.delete(typeof documentOrId === 'string' ? documentOrId : documentOrId._id);
  }

  public resolve(resolvable: CreateResolvableSchemaType<T>): CastDocument<T> | null {
    return this.cache.get(typeof resolvable === 'string' ? resolvable : resolvable._id) ?? null;
  }

  public resolveId(resolvable: CreateResolvableSchemaType<T>): string | null {
    return this.resolve(resolvable)?._id ?? null;
  }

  public async get(_id: string) {
    const document = await this.model.findOne({ _id }).catch(() => null);
    return document ?? null;
  }

  public async create(_id: string) {
    const created = await this.model.create({ _id });
    return await created.save();
  }

  public fetch(_id: string, force?: boolean): Promise<CastDocument<T>>;
  public async fetch(_id: string, force = false) {
    const cached = this.resolve(_id);
    if (!isNullOrUndefined(cached) && !force) return cached;

    const document = (await this.get(_id)) ?? (await this.create(_id));
    return this.add(document);
  }

  public async fetchAll(cache = true): Promise<CastDocument<T>[]> {
    const documents = await this.model.find({}).exec();
    if (cache) for (const doc of documents) this.add(doc);
    return documents;
  }

  public async delete(_id: string): Promise<void> {
    const document = await this.get(_id);
    if (isNullOrUndefined(document)) return;

    await document.remove();
    this.remove(document);
  }

  public async deleteAll(): Promise<boolean[]> {
    const documents = await this.fetchAll(false);
    const result = await Promise.allSettled(documents.map((d) => this.delete(d._id)));
    return result.map((r) => r.status === 'fulfilled');
  }
}
