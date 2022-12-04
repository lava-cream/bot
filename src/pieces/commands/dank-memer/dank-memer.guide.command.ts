import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import type { ItemGuideCategorySchema, ItemGuideCategoryItemSchema } from '#lib/database';
import {
  type ButtonBuilder,
  seconds,
  MessageContentBuilder,
  InteractionMessageContentBuilder,
  Collector,
  join,
  removeElement,
  send,
  edit,
  parseNumber,
  modalActionRow
} from '#lib/utilities';
import { type TextChannel, Constants, Modal } from 'discord.js';
import { toTitleCase, isNullOrUndefined, chunk } from '@sapphire/utilities';
import { Result } from '@sapphire/result';
import { bold, inlineCode, channelMention } from '@discordjs/builders';
import { ChannelType } from 'discord.js/node_modules/discord-api-types/v9.js';

const SubCommands = {
  Create: {
    name: 'create',
    options: {
      Identifier: 'id',
      Name: 'name'
    }
  },
  Delete: 'delete',
  Generate: {
    name: 'generate',
    options: {
      Channel: 'channel'
    }
  },
  Rename: {
    name: 'rename',
    options: {
      Name: 'name'
    }
  },
  Manage: 'manage',
  Updates: {
    name: 'updates',
    options: {
      Channel: 'channel'
    }
  }
} as const;

enum CategoryPickerControl {
  Submit = 'submit',
  Cancel = 'cancel'
}

enum CategoryItemPickerPaginator {
  First = 'first',
  Back = 'back',
  Next = 'next',
  Last = 'last'
}

enum CategoryItemManagerControl {
  Edit = 'edit',
  Delete = 'delete'
}

enum CategoryItemManagerEditControl {
  Name = 'name',
  Price = 'price',
  Hide = 'hide'
}

enum CategoryItemManagerDeleteControl {
  Confirm = 'yes',
  Cancel = 'no'
}

@ApplyOptions<Command.Options>({
  name: 'guide',
  description: "Manage the server's item guides.",
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  requiredUserPermissions: ['MANAGE_GUILD']
})
export default class GuideCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const db = await this.container.db.guides.fetch(command.guildId);

    const checkGuideCategories = async (): Promise<boolean> => {
      const has = db.categories.entries.length > 0;
      if (!has) await edit(command, 'This server does not have existing item guides.');
      return has;
    };

    const checkGuideItems = async (category: ItemGuideCategorySchema): Promise<boolean> => {
      const has = category.items.entries.length > 0;
      if (!has) await edit(command, 'This item guide has no items.');
      return has;
    };

    switch (command.options.getSubcommand()) {
      case SubCommands.Create.name: {
        const { Name, Identifier } = SubCommands.Create.options;

        const id = command.options.getString(Identifier, true);
        const name = command.options.getString(Name, true);

        if (db.categories.resolve(id)) return await edit(command, 'A guide with that id already exists.');

        const created = db.categories.create({ id, name });
        await db.save();

        return await edit(command, `Successfully created the ${bold(created.name)} item guide.`);
      }

      case SubCommands.Delete: {
        if (!(await checkGuideCategories())) return;

        const category = await this.awaitGuideCategory(command, db.categories.entries, 1);
        if (category.isErr()) return await send(command, 'Lmao you have to choose something to delete.');

        const selection = category.unwrap().at(0);
        if (isNullOrUndefined(selection)) return await send(command, "Hmm something's not right here.");

        await db.run((db) => db.categories.delete(selection.id)).save();
        return await send(command, `Successfully deleted the ${bold(selection.name)} item guide from this server.`);
      }

      case SubCommands.Generate.name: {
        const { Channel } = SubCommands.Generate.options;

        if (!(await checkGuideCategories())) return;

        const channel = command.options.getChannel(Channel, true) as TextChannel;

        const categories = await this.awaitGuideCategory(command, db.categories.entries, Math.min(5, db.categories.entries.length));
        if (categories.isErr()) return await send(command, 'Lmao you have to choose multiple guides to generate...');

        const message = await channel.send(
          categories.unwrap().reduce(
            (builder, category) =>
              builder.addEmbed((embed) =>
                embed
                  .setTitle(category.name)
                  .setColor(Constants.Colors.NOT_QUITE_BLACK)
                  .setDescription(join(category.items.entries.map((item) => `${bold(item.id)} — ${inlineCode(item.price.toLocaleString())}`)))
              ),
            new MessageContentBuilder()
          )
        );

        await db.run((db) => db.channels.main.setId(message.id)).save();
        return await send(command, `Successfully sent ${bold(categories.unwrap().length.toString())} item guides to ${channelMention(channel.id)}`);
      }

      case SubCommands.Rename.name: {
        const { Name } = SubCommands.Rename.options;

        if (!(await checkGuideCategories())) return;

        const name = command.options.getString(Name, true);

        const category = await this.awaitGuideCategory(command, db.categories.entries, 1);
        if (category.isErr()) return await send(command, 'Lmao you need to choose something to delete.');

        const selection = category.unwrap().at(0);
        if (isNullOrUndefined(selection)) return await send(command, 'Hmm somethings not right...');

        const { name: oldName } = selection;

        await db.run((db) => db.categories.resolve(selection.id)?.setName(name)).save();
        return await send(command, `Successfully renamed the ${bold(oldName)} item guide to ${bold(name)}.`);
      }

      case SubCommands.Manage: {
        if (!(await checkGuideCategories())) return;

        const category = await this.awaitGuideCategory(command, db.categories.entries, 1);
        if (category.isErr()) return await send(command, 'Lmao you have to choose something to manage.');

        const categorySelection = category.unwrap().at(0);
        if (isNullOrUndefined(categorySelection)) return await send(command, 'Hmm somethings not right...');

        if (!(await checkGuideItems(categorySelection))) return;

        const selectedItem = await this.awaitGuideCategoryItem(command, categorySelection);
        if (selectedItem.isErr()) return await send(command, 'Lol you have to choose an item to manage.');

        const item = selectedItem.unwrap();
        const message = await send(command, (content) =>
          content.addEmbed((embed) =>
            embed
              .setTitle('Item Manager')
              .setColor(Constants.Colors.NOT_QUITE_BLACK)
              .setDescription(`Use the buttons below to manage the ${bold(item.name)} item.`)
          )
        );

        const run = async (): Promise<void> => {
          try {
            const click = await message.awaitMessageComponent({
              componentType: 'BUTTON',
              time: seconds(60),
              filter: async (button) => {
                const contextual = button.user.id === command.user.id;
                await button.deferUpdate();
                return contextual;
              }
            });

            switch (click.customId) {
              case CategoryItemManagerControl.Edit: {
                const renderContent = (ended: boolean) => {
                  return new InteractionMessageContentBuilder()
                    .addEmbed((embed) =>
                      embed
                        .setTitle('Item Editor')
                        .setColor(ended ? Constants.Colors.NOT_QUITE_BLACK : Constants.Colors.BLURPLE)
                        .setDescription('Choose an item property to edit. Changes are automatically saved.')
                        .addFields(
                          { name: 'ID', value: inlineCode(item.id), inline: false },
                          { name: 'Name', value: item.name, inline: true },
                          { name: 'Price', value: item.price.toLocaleString(), inline: true },
                          { name: 'Hidden', value: `${item.hidden}`, inline: true }
                        )
                    )
                    .addRow((row) =>
                      Object.values(CategoryItemManagerEditControl).reduce(
                        (row, control) =>
                          row.addButtonComponent((btn) =>
                            btn
                              .setCustomId(control)
                              .setDisabled(ended)
                              .setStyle(ended ? Constants.MessageButtonStyles.SECONDARY : Constants.MessageButtonStyles.PRIMARY)
                              .setLabel(toTitleCase(control))
                          ),
                        row
                      )
                    );
                };

                const op = await Result.fromAsync<void>(async function run() {
                  const message2 = await edit(click, renderContent(false));
                  const click2 = await message2.awaitMessageComponent({
                    componentType: 'BUTTON',
                    time: seconds(60),
                    filter: async (button) => {
                      const contextual = button.user.id === command.user.id;
                      if (!contextual) await button.deferUpdate();
                      return contextual;
                    }
                  });

                  await click2.showModal(
                    new Modal()
                      .setTitle(`New Item's ${toTitleCase(click2.customId)}`)
                      .setCustomId(click2.customId)
                      .addComponents(
                        modalActionRow((row) =>
                          row.addTextInputComponent((txtInp) =>
                            txtInp
                              .setCustomId(click2.customId)
                              .setStyle(Constants.TextInputStyles.PARAGRAPH)
                              .setRequired(true)
                              .setPlaceholder('A valid amount.')
                          )
                        )
                      )
                  );

                  const op2 = await Result.fromAsync<void, null>(async () => {
                    const modal = await click2.awaitModalSubmit({
                      componentType: 'TEXT_INPUT',
                      time: seconds(60),
                      filter: (modal) => modal.deferUpdate().then(() => true)
                    });

                    const input = modal.fields.getTextInputValue(click2.customId);

                    switch (click2.customId) {
                      case CategoryItemManagerEditControl.Name: {
                        await db.run(() => item.setName(input)).save();
                        await edit(click2, renderContent(false));

                        return await run();
                      }

                      case CategoryItemManagerEditControl.Price: {
                        const parsedInput = parseNumber(input, { minimum: 0, maximum: Infinity, amount: 0 });

                        if (isNullOrUndefined(parsedInput)) {
                          await modal.reply('You entered a wrong amount!');
                        } else {
                          await db.run(() => item.setPrice(parsedInput)).save();
                          await edit(click2, renderContent(false));
                        }

                        return await run();
                      }
                    }
                  });

                  if (op2.isErr()) {
                    await edit(click2, renderContent(true));
                    await send(click2, 'Something went wrong :c');
                  }
                });

                if (op.isErr()) await send(click, 'Something went wrong :c');
                break;
              }

              case CategoryItemManagerControl.Delete: {
                const renderContent = (confirmed: null | boolean) => {
                  return new InteractionMessageContentBuilder()
                    .addEmbed((embed) =>
                      embed
                        .setTitle(isNullOrUndefined(confirmed) ? 'Confirm Action' : confirmed ? 'Action Confirmed' : 'Action Cancelled')
                        .setColor(isNullOrUndefined(confirmed) ? Constants.Colors.BLURPLE : confirmed ? Constants.Colors.GREEN : Constants.Colors.RED)
                        .setDescription(
                          isNullOrUndefined(confirmed)
                            ? `Do you want to delete ${bold(item.name)}?`
                            : confirmed
                            ? `Successfully deleted ${bold(item.name)} from the ${bold(categorySelection.name)} item guide.`
                            : 'Ok then.'
                        )
                        .setFooter({ text: `Item Guide: ${categorySelection.name}` })
                    )
                    .addRow((row) =>
                      Object.values(CategoryItemManagerDeleteControl).reduce(
                        (row, control) =>
                          row.addButtonComponent((btn) =>
                            btn
                              .setLabel(toTitleCase(control))
                              .setCustomId(control)
                              .setDisabled(!isNullOrUndefined(confirmed))
                              .setStyle(
                                !isNullOrUndefined(confirmed)
                                  ? (confirmed && control === CategoryItemManagerDeleteControl.Confirm) ||
                                    (!confirmed && control === CategoryItemManagerDeleteControl.Cancel)
                                    ? Constants.MessageButtonStyles.SUCCESS
                                    : Constants.MessageButtonStyles.SECONDARY
                                  : Constants.MessageButtonStyles.PRIMARY
                              )
                          ),
                        row
                      )
                    );
                };

                const op = await Result.fromAsync<void>(async () => {
                  const message2 = await edit(click, renderContent(null));
                  const click2 = await message2.awaitMessageComponent({
                    componentType: 'BUTTON',
                    time: seconds(60),
                    filter: async (button) => {
                      const contextual = button.user.id === command.user.id;
                      if (!contextual) await button.deferUpdate();
                      return contextual;
                    }
                  });

                  switch (click2.customId) {
                    case CategoryItemManagerDeleteControl.Confirm: {
                      await db.run(() => categorySelection.items.delete(item.id)).save();
                      await edit(click2, renderContent(true));
                      break;
                    }

                    case CategoryItemManagerDeleteControl.Cancel: {
                      await edit(click2, renderContent(false));
                      break;
                    }
                  }
                });

                if (op.isErr()) await send(click, 'Something went wrong :c');
                break;
              }
            }
          } catch {
            await send(command, 'Something went wrong :c');
          }
        };

        return await run();
      }

      case SubCommands.Updates.name: {
        const channel = command.options.getChannel(SubCommands.Updates.options.Channel) as TextChannel | null;
        if (isNullOrUndefined(channel)) {
          await db.run((db) => db.channels.setUpdates(null)).save();
          return await edit(command, 'Successfully removed the updates channel configuration.');
        }

        await db.run((db) => db.channels.setUpdates(channel.id)).save();
        return await edit(
          command,
          `Successfully set the updates channel to ${channelMention(
            channel.id
          )}. Try changing the price of an item to see if it works! If not, you should contact my developer about the probable bug.`
        );
      }
    }

    return;
  }

  private awaitGuideCategory(
    command: CommandInteraction<'cached'>,
    entries: ItemGuideCategorySchema[],
    limit: number,
    filterBlank = false
  ): Promise<Result<ItemGuideCategorySchema[], null>> {
    return Result.fromAsync(async () => {
      try {
        return await new Promise(async (resolve, reject) => {
          const selections: ItemGuideCategorySchema[] = [];
          const collector = new Collector({
            message: await edit(command, this.renderGuideCategoryPickerContent(entries, selections, filterBlank, limit, false)),
            componentType: 'BUTTON',
            max: Infinity,
            time: seconds(60),
            filter: async (button) => {
              const contextual = button.user.id === command.user.id;
              await button.deferUpdate();
              return contextual;
            },
            end: async (ctx) => {
              if (ctx.wasInternallyStopped()) {
                await edit(command, this.renderGuideCategoryPickerContent(entries, selections, filterBlank, limit, true));
                return reject();
              }
            }
          });

          const isSelected = (category: ItemGuideCategorySchema) => selections.some((select) => select.id === category.id);

          for (const entry of entries.values()) {
            collector.actions.add(entry.id, async (ctx) => {
              if (!isSelected(entry)) removeElement(selections, (s) => s.id === entry.id);
              else selections.push(entry);

              await edit(ctx.interaction, this.renderGuideCategoryPickerContent(entries, selections, filterBlank, limit, false));
            });
          }

          for (const control of Object.values(CategoryPickerControl)) {
            collector.actions.add(control, async (ctx) => {
              ctx.collector.stop(control);
              await edit(ctx.interaction, this.renderGuideCategoryPickerContent(entries, selections, filterBlank, limit, true));

              switch (control) {
                case CategoryPickerControl.Submit: {
                  return resolve(selections);
                }

                case CategoryPickerControl.Cancel: {
                  return reject();
                }
              }
            });
          }

          await collector.start();
        });
      } catch {
        throw null;
      }
    });
  }

  private renderGuideCategoryPickerContent(
    entries: ItemGuideCategorySchema[],
    selections: ItemGuideCategorySchema[],
    filterBlank: boolean,
    limit: number,
    ended: boolean
  ) {
    const limited = selections.length === limit;
    const isSelected = (category: ItemGuideCategorySchema) => entries.some((entry) => entry.id === category.id);
    const isEmpty = (category: ItemGuideCategorySchema) => !category.items.entries.length;

    return new InteractionMessageContentBuilder<ButtonBuilder>()
      .addEmbed((embed) =>
        embed
          .setTitle('Item Guide(s) Selector')
          .setColor(limited ? Constants.Colors.GREEN : Constants.Colors.NOT_QUITE_BLACK)
          .setDescription(
            limited
              ? "You can click the buttons again to deselect the guides you've already selected."
              : `Select up to ${limit} item guide${limit > 1 ? 's' : ''} below. You have ${selections.length - limit} left.`
          )
      )
      .addRow((row) =>
        entries.reduce(
          (row, entry) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(entry.id)
                .setLabel(entry.name)
                .setDisabled(ended || filterBlank || (!isSelected(entry) && limited))
                .setStyle(
                  !isEmpty(entry)
                    ? isSelected(entry)
                      ? ended && limited
                        ? Constants.MessageButtonStyles.SUCCESS
                        : Constants.MessageButtonStyles.DANGER
                      : Constants.MessageButtonStyles.SECONDARY
                    : Constants.MessageButtonStyles.SECONDARY
                )
            ),
          Object.values(CategoryPickerControl).reduce(
            (row, control) =>
              row.addButtonComponent((btn) =>
                btn
                  .setCustomId(CategoryPickerControl.Submit)
                  .setDisabled(ended || (control === CategoryPickerControl.Submit ? selections.length < 1 : ended))
                  .setLabel(toTitleCase(CategoryPickerControl.Submit))
                  .setStyle(Constants.MessageButtonStyles.PRIMARY)
              ),
            row
          )
        )
      );
  }

  private awaitGuideCategoryItem(
    command: CommandInteraction<'cached'>,
    category: ItemGuideCategorySchema,
    pageFocused = 0
  ): Promise<Result<ItemGuideCategoryItemSchema, null>> {
    return Result.fromAsync(async () => {
      try {
        return await new Promise(async (resolve, reject) => {
          const collector = new Collector({
            message: await edit(command, this.renderGuideCategoryItemPickerContent(category, 5, pageFocused, false)),
            componentType: 'BUTTON',
            max: Infinity,
            time: seconds(60),
            filter: async (button) => {
              const contextual = button.user.id === command.user.id;
              await button.deferUpdate();
              return contextual;
            },
            end: async (ctx) => {
              if (ctx.wasInternallyStopped()) {
                await edit(command, this.renderGuideCategoryItemPickerContent(category, 5, pageFocused, true));
                return reject();
              }
            }
          });

          for (const control of Object.values(CategoryItemPickerPaginator)) {
            collector.actions.add(control, async (ctx) => {
              switch (control) {
                case CategoryItemPickerPaginator.First: {
                  pageFocused = 0;
                  break;
                }

                case CategoryItemPickerPaginator.Back: {
                  pageFocused -= pageFocused === 0 ? 0 : 1;
                  break;
                }

                case CategoryItemPickerPaginator.Next: {
                  pageFocused += pageFocused === category.items.entries.length - 1 ? 0 : 1;
                  break;
                }

                case CategoryItemPickerPaginator.Last: {
                  pageFocused = category.items.entries.length - 1;
                  break;
                }
              }

              await edit(ctx.interaction, this.renderGuideCategoryItemPickerContent(category, 5, pageFocused, false));
            });
          }

          for (const item of category.items.entries.values()) {
            collector.actions.add(item.id, (ctx) => {
              ctx.collector.stop(ctx.interaction.customId);
              return resolve(item);
            });
          }

          await collector.start();
        });
      } catch {
        throw null;
      }
    });
  }

  private renderGuideCategoryItemPickerContent(category: ItemGuideCategorySchema, itemsPerPage: number, page: number, ended: boolean) {
    return new InteractionMessageContentBuilder<ButtonBuilder>()
      .addEmbed((embed) =>
        embed
          .setTitle('Item Selector')
          .setColor(Constants.Colors.BLURPLE)
          .setDescription('Please select an item from this item guide. Grayed-out items were marked as hidden.')
          .setFooter({ text: `Category: ${category.name}` })
      )
      .addRow((row) =>
        Object.values(CategoryItemPickerPaginator).reduce(
          (row, paginator) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(paginator)
                .setLabel(toTitleCase(paginator))
                .setStyle(Constants.MessageButtonStyles.PRIMARY)
                .setDisabled(
                  ended ||
                    ([CategoryItemPickerPaginator.First, CategoryItemPickerPaginator.Back].includes(paginator) && page === 0) ||
                    ([CategoryItemPickerPaginator.Last, CategoryItemPickerPaginator.Next].includes(paginator) &&
                      page === chunk(category.items.entries, itemsPerPage).length)
                )
            ),
          row
        )
      )
      .addRow(
        (row) =>
          chunk(category.items.entries, itemsPerPage)
            .at(page)
            ?.reduce(
              (row, item) =>
                row.addButtonComponent((btn) =>
                  btn
                    .setCustomId(item.id)
                    .setLabel(item.name)
                    .setStyle(!item.isHidden() ? Constants.MessageButtonStyles.SUCCESS : Constants.MessageButtonStyles.SECONDARY)
                    .setDisabled(ended)
                ),
              row
            ) ?? row
      );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Create.name)
            .setDescription('Creates a new item guide.')
            .addStringOption((opt) =>
              opt.setName(SubCommands.Create.options.Identifier).setDescription('The id of this item guide.').setRequired(true)
            )
            .addStringOption((opt) => opt.setName(SubCommands.Create.options.Name).setDescription('The name of this item guide.').setRequired(true))
        )
        .addSubcommand((sub) => sub.setName(SubCommands.Delete).setDescription('Deletes an existing item guide.'))
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Generate.name)
            .setDescription('Generates item guides.')
            .addChannelOption((opt) =>
              opt
                .setName(SubCommands.Generate.options.Channel)
                .setDescription('The channel where you want to generate the item guides.')
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Rename.name)
            .setDescription('Renames an existing item guide.')
            .addStringOption((opt) =>
              opt.setName(SubCommands.Rename.options.Name).setDescription('The new name of the item guide.').setRequired(true)
            )
        )
        .addSubcommand((sub) => sub.setName(SubCommands.Manage).setDescription('Create, edit or delete specific items from an existing item guide.'))
        .addSubcommand((sub) =>
          sub
            .setName(SubCommands.Updates.name)
            .setDescription("Whenever an item's price is updated, it sends the details about the update on the channel.")
            .addChannelOption((opt) =>
              opt
                .setName(SubCommands.Generate.options.Channel)
                .setDescription('The channel. Leave blank to remove the setting.')
                .addChannelTypes(ChannelType.GuildText)
            )
        )
    );
  }
}
