import { UserError } from '@sapphire/framework';

/**
 * Represents an error for commands.
 * @since 6.0.0
 */
export class CommandError extends UserError {
  public constructor({ message }: CommandError.Options) {
    super({ identifier: CommandError.name, message });
  }
}

export type CommandErrorOptions = Required<Pick<UserError.Options, 'message'>>;

export declare namespace CommandError {
  type Options = CommandErrorOptions;
}