/**
 * Options to construct an {@link AmariClient}.
 */
export interface AmariClientOptions {
  /**
   * Your authorization token.
   */
  readonly token: string;
  /**
   * The global request rate-limit.
   * @default 60
   */
  readonly globalRateLimit?: number;
  /**
   * The version of the API to use.
   * @default 1
   */
  readonly apiVersion?: number;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AMARI_API_KEY: string;
    }
  }
}
