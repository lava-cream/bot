import { AsyncQueue } from '@sapphire/async-queue';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { Result } from '@sapphire/result';
import type { BaseClient } from './base.client.js';

/**
 * The main request handler.
 */
export class RequestHandler {
  /**
   * Represents the handler's queue manager.
   */
  readonly #queue = new AsyncQueue();

  /**
   * The request handler's constructor.
   * @param client An amari bot client instance.
   */
  public constructor(public client: BaseClient) {}

  /**
   * Creates a GET request from the amari api.
   * @template T The expected type of the fetched value.
   * @param endpoint The endpoint to fetch the value from.
   */
  private get<T>(endpoint: string): Promise<T> {
    return fetch<T>(
      `${this.client.baseUrl}${endpoint}`,
      {
        signal: new AbortController().signal,
        headers: { Authorization: this.client.token }
      },
      FetchResultTypes.JSON
    );
  }

  /**
   * Checks for the result if it's an {@link Ok<T>}.
   * @template T The requested value type.
   * @template E The error type.
   * @param result The result from the get request.
   */
  private checkResult<T, E>(result: Result<T, E>): asserts result is Result.Ok<T> {
    if (result.isErr()) throw result.unwrapErr();
  }

  /**
   * @template T The expected return type.
   * @param endpoint The API url along with the endpoint.
   */
  public async request<T>(endpoint: string): Promise<T> {
    const response = await Result.fromAsync<T, Error>(async () => {
      await this.#queue.wait();

      try {
        return await this.get<T>(endpoint);
      } finally {
        this.#queue.shift();
      }
    });

    this.checkResult(response);
    return response.unwrap();
  }
}
