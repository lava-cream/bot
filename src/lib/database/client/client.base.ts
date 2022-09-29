import { ClientOptions, transformOptions } from './client.options.js';
import mongoose from 'mongoose';

export class BaseClient {
  public connection: typeof mongoose = null!;

  public constructor(protected options: ClientOptions) {}

  public async connect(): Promise<void> {
    this.connection = await mongoose.connect(this.options.connectionUri, transformOptions(this.options));
  }

  public async destroy(): Promise<void> {
    return void (await this.connection?.connection.close());
  }
}
