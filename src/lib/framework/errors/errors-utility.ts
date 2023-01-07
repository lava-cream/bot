import type { UserError } from '@sapphire/framework';
import { CommandOptionError } from './errors.command-option.js';
import { CommandError } from './errors.command.js';

/**
 * A typeguard checking if the specific {@link UserError} is a {@link CommandOptionError}.
 * @param error The error to chek for.
 * @returns A boolean
 * @since 6.0.0
 */
export function isCommandOptionError(error: UserError): error is CommandOptionError {
  return (
    Reflect.get(error, 'identifier') === CommandOptionError.name &&
    Reflect.has(error, 'option') &&
    typeof Reflect.get(error, 'option') === 'string' &&
    error instanceof CommandOptionError
  );
}

/**
 * A typeguard checking whether the specific {@link UserError} is a {@link CommandError}.
 * @param error The error to check for.
 * @returns A boolean.
 * @since 6.0.0
 */
export function isCommandError(error: UserError): error is CommandError {
  return Reflect.get(error, 'identifier') === CommandError.name && error instanceof CommandError;
}
