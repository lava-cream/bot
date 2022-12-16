import { UserError } from '@sapphire/framework';

/**
 * As the name of the class implies, this represents an error of a command option input.
 * @since 6.0.0
 */
export class CommandOptionError extends UserError {
  /**
   * The option the reason why this error was thrown.
   */
  public readonly option: string;
  public constructor({ message, option }: CommandOptionError.Options) {
    super({ identifier: CommandOptionError.name, message });
    this.option = option;
  }
}

export interface CommandOptionErrorOptions extends Required<Pick<UserError.Options, 'message'>> {
  option: string;
}

export declare namespace CommandOptionError {
  type Options = CommandOptionErrorOptions;
}
