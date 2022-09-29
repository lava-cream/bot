import { type Command, type Result, container, ok, err } from '@sapphire/framework';
import { ResolverErrors } from '#lib/framework';

/**
 * Resolves a command based from a specific parameter.
 * @param parameter The user-level parameter.
 * @param keyword If the search should not be exact.
 * @returns The resulting command, or an argument identifier.
 * @version 5.2.0
 * @since 5.0.0
 */
export const resolveCommand = (parameter: string, keyword = false): Result<Command, ResolverErrors.InvalidCommand> => {
  for (const [name, command] of container.stores.get('commands')) {
    const keywordAliases = command.aliases.some((a) => a.toLowerCase().includes(parameter.toLocaleLowerCase()));
    const keywordName = name.toLowerCase().includes(parameter.toLowerCase());
    const exactAliases = command.aliases.some((a) => a.toLowerCase() === parameter.toLowerCase());
    const exactName = name.toLowerCase() === parameter.toLowerCase();

    if (keyword && (keywordAliases || keywordName)) return ok(command);
    if (!keyword && (exactAliases || exactName)) return ok(command);
  }

  return err(ResolverErrors.InvalidCommand);
};
