import { ClientOptions, transformOptions } from './client.options.js';
import { isNullOrUndefined } from '@sapphire/utilities';
import mongoose from 'mongoose';

/**
 * The base database client. Handles the establishment of connection between this application and the database.
 */
export class BaseClient {
  /**
   * The constructor of this client.
   * @param options Options to connect to the client.
   */
  public constructor(protected options: ClientOptions) {}

  /**
   * The current mongoose connection.
   */
  public get connection() {
    return mongoose.connections.at(0);
  }

  /**
   * Creates a single connection to mongodb via mongoose.
   */
  public async connect(): Promise<void> {
    await mongoose.connect(this.options.connectionUri, transformOptions(this.options));
  }

  /**
   * Disconnects the current connection to mongodb.
   * @returns None.
   */
  public async destroy(): Promise<void> {
    return this.isConnected() ? await this.connection.connection.close() : void 0;
  }

  /**
   * A typeguard indicating this client has established a connection to mongodb.
   * @returns A boolean.
   */
  public isConnected(): this is this & { connection: typeof mongoose } {
    return !isNullOrUndefined(this.connection);
  }
}
