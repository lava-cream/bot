import { container } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';
import { ReturnModelType, mongoose, getModelForClass, Severity } from '@typegoose/typegoose';
import type { AnyParamConstructor } from '@typegoose/typegoose/lib/types';
import { BaseManager, Collection } from 'discord.js';
import type { CreateResolvableSchemaType, CastDocument, Schema } from './schema.js';
import type DatabaseClient from '#lib/database/client/client';
import { isPromiseFulfilled } from '#lib/utilities';

/**
 * Options to construct a {@link Manager}.
 * @template T The schema's type.
 */
export interface ManagerOptions<T extends Schema> {
  /**
   * The database client.
   */
  readonly client: DatabaseClient;
  /**
   * The propped class, which is the manager of a document.
   */
  readonly holds: AnyParamConstructor<T>;
  /**
   * The name of the manager.
   */
  readonly name: string;
  /**
   * The timeout to remove a document from the cache.
   * @default Infinity
   */
  readonly cacheTimeout?: number;
}

/**
 * Represents a model manager.
 * @template T The schema's type. 
 */
export abstract class Manager<T extends Schema> extends BaseManager {
  /**
   * The manager's cache.
   */
  protected readonly cache: Collection<T['_id'], CastDocument<T>>;
  /**
   * The mongoose model attached.
   */
  public readonly model: ReturnModelType<AnyParamConstructor<T>>;

  /**
   * The manager's constructor.
   * @param options Options to construct a manager.
   */
  public constructor(public options: ManagerOptions<T>) {
    super(container.client);
    this.cache = new Collection();
    this.model = getModelForClass(options.holds, {
      existingConnection: options.client.connection ?? mongoose.connection,
      existingMongoose: mongoose,
      options: {
        allowMixed: Severity.ALLOW,
        customName: options.name
      }
    });
  }

  /**
   * Adds a document into this cache.
   * @param document The document to add.
   * @returns The document.
   */
  protected add(document: CastDocument<T>) {
    return this.cache.ensure(document._id, () => document);
  }

  /**
   * Removes a document from the cache.
   * @param documentOrId A document or ID.
   * @returns A boolean, the success of the operation.
   */
  protected remove(documentOrId: CreateResolvableSchemaType<T>): boolean {
    return this.cache.delete(typeof documentOrId === 'string' ? documentOrId : documentOrId._id);
  }

  /**
   * Returns the document (if present in cache).
   * @param resolvable A document resolvable.
   * @returns The document, `null` otherwise.
   */
  public resolve(resolvable: CreateResolvableSchemaType<T>): CastDocument<T> | null {
    return this.cache.get(typeof resolvable === 'string' ? resolvable : resolvable._id) ?? null;
  }

  /**
   * Checks if a document is present in the cache, and returns the ID.
   * @param resolvable A document resolvable.
   * @returns The document's id, `null` otherwise.
   */
  public resolveId(resolvable: CreateResolvableSchemaType<T>): string | null {
    return this.resolve(resolvable)?._id ?? null;
  }

  /**
   * Retreives a document from the model's collection.
   * @param _id The id of the document to get.
   * @returns A document, `null` otherwise.
   */
  public async get(_id: string) {
    const document = await this.model.findOne({ _id }).catch(() => null);
    return document ?? null;
  }

  /**
   * Inserts a new document into the manager's collection.
   * @param _id The id of the document to create.
   * @returns The document created.
   */
  public async create(_id: string) {
    const created = await this.model.create({ _id });
    return await created.save();
  }

  /**
   * Gets or creates a document into the collection.
   * @param _id The document's id.
   * @param force If you want to bypass cache checking.
   * @returns The document.
   */
  public async fetch(_id: string, force = false): Promise<CastDocument<T>> {
    const cached = this.resolve(_id);
    if (!isNullOrUndefined(cached) && !force) return cached;
    if (this.cache.has(_id)) this.remove(_id);

    const document = (await this.get(_id)) ?? (await this.create(_id));
    return this.add(document);
  }

  /**
   * Fetches all existing documents from this manager.
   * @param cache Whether the fetched documents should be added to cache or not.
   * @returns The documents.
   */
  public async fetchAll(cache = true): Promise<CastDocument<T>[]> {
    const documents = await this.model.find({}).exec();
    if (cache) for (const doc of documents) this.cache.set(doc._id, doc);
    return documents;
  }

  /**
   * Deletes an existing document from this manager. 
   * @param _id The id of the document to delete.
   * @returns The document's id.
   */
  public async delete(_id: string): Promise<string> {
    const document = await this.get(_id);

    if (!isNullOrUndefined(document)) {
      await document.remove();
      this.remove(document);
    }

    return _id;
  }

  /**
   * Deletes every document from this and this manager's collection.
   * @returns An array of document IDs.
   */
  public async deleteAll(): Promise<string[]> {
    const documents = await this.fetchAll(false);
    const result = await Promise.allSettled(documents.map((d) => this.delete(d._id)));
    return result.filter(isPromiseFulfilled).map(res => res.value);
  }
}
