import type { AmariClientOptions } from './options.client.js';
import { RequestHandler } from './request-handler.client.js';

export class BaseClient {
  public requestHandler: RequestHandler;
  public baseUrl: string;

  protected constructor(public options: AmariClientOptions) {
    this.requestHandler = new RequestHandler(this);
    this.baseUrl = `https://amaribot.com/api/v${options.apiVersion ?? 1}`;
  }

  public get token() {
    return this.options.token;
  }
}
