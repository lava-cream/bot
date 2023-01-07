import { UserError } from '@sapphire/framework';

/**
 * Represents an error for commands.
 * @since 6.0.0
 */
export class CommandError extends UserError {
  public constructor(optionsOrString: string | CommandError.Options) {
    super({
      identifier: CommandError.name,
      message: typeof optionsOrString === 'string' ? optionsOrString : optionsOrString.message
    });
  }
}

export type CommandErrorOptions = Required<Pick<UserError.Options, 'message'>>;

export declare namespace CommandError {
  type Options = CommandErrorOptions;
}
