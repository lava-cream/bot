import type { ConnectOptions } from 'mongoose';
import { seconds } from '#lib/utilities/common/common.dates.js';

export interface ClientOptions {
  readonly username: string;
  readonly password: string;
  readonly connectionUri: string;
  readonly databaseName: string;
  readonly connectTimeoutMS?: number;
}

export const transformOptions = (options: ClientOptions): ConnectOptions => ({
  dbName: options.databaseName,
  loggerLevel: 'info',
  autoCreate: true,
  connectTimeoutMS: options.connectTimeoutMS ?? seconds(10),
  retryWrites: true,
  w: 'majority',
  auth: {
    username: options.username,
    password: options.password
  }
});

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_DB_NAME: string;
      MONGO_PASS: string;
      MONGO_USER: string;
      MONGO_URI: string;
    }
  }
}
