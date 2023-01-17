import { Booster, BoosterShopOffer, BoosterShopOfferType, BoosterShopOfferUnit } from "#lib/framework";
import { Collector, CustomId, edit, EmbedTemplates, InteractionMessageContentBuilder, join, minutes, send, update } from "#lib/utilities";
import { bold } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum, container } from "@sapphire/framework";
import { DurationFormatter } from "@sapphire/time-utilities";
import { isFunction, isNullOrUndefined, toTitleCase } from "@sapphire/utilities";
import { Constants } from "discord.js";

@ApplyOptions<Command.Options>({
  name: 'boosters',
  description: 'View or use game boosters.',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export default class BoostersCommand extends Command {
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const customId = new CustomId(command.createdAt);

    let booster: Booster | null = null;
    let boosterShopOffer: BoosterShopOffer | null = null;

    const collector = new Collector({
      message: await send(command, BoostersCommand.renderBoosterPickerContent(customId, booster, boosterShopOffer, false)),
      max: Infinity,
      time: minutes(1),
      actions: {
        [customId.create('picker')]: async (ctx) => {
          if (!ctx.interaction.isSelectMenu()) return;

          const selectedBoosterId = ctx.interaction.values.at(0) ?? null;
          const selectedBooster = selectedBoosterId ? container.stores.get('boosters').get(selectedBoosterId) ?? null : null;

          await update(ctx.interaction, BoostersCommand.renderBoosterPickerContent(customId, booster = selectedBooster, null, false));
        },
        [customId.create('shop-offer')]: async (ctx) => {
          if (!ctx.interaction.isSelectMenu()) return;
          if (isNullOrUndefined(booster)) return;

          const selectedBoosterShopOfferId = ctx.interaction.values.at(0) ?? null;
          const selectedBoosterShopOffer = selectedBoosterShopOfferId ? booster.shopOffers.find(so => so.id === selectedBoosterShopOfferId) ?? null : null;

          await update(ctx.interaction, BoostersCommand.renderBoosterPickerContent(customId, booster, boosterShopOffer = selectedBoosterShopOffer, false));
        },
        [customId.create('buy')]: async ctx => {
          if (!ctx.interaction.isButton()) return;
          if (isNullOrUndefined(booster) || isNullOrUndefined(boosterShopOffer)) return;

          const schema = db.boosters.resolve(booster.id) ?? db.boosters.create(booster.id, { expire: 0 });

          const { unit, cost, type, value } = boosterShopOffer;
          const { name } = booster;

          switch(unit) {
            case BoosterShopOfferUnit.Coins: {
              db.wallet.subValue(cost);
              break;
            };

            case BoosterShopOfferUnit.Energy: {
              db.energy.subEnergy(cost);
              break;
            };

            case BoosterShopOfferUnit.Star: {
              db.energy.subValue(cost);
              break;
            };
          }

          const finalValue = isFunction(value) ? value() : value;

          switch(type) {
            case BoosterShopOfferType.Duration: {
              schema.setExpire(Date.now() + finalValue);
              break;
            };

            case BoosterShopOfferType.Quantity: {
              schema.quantity.addValue(finalValue);
              break;
            };
          }

          const unitEmoji = unit === BoosterShopOfferUnit.Star ? '⭐' : unit === BoosterShopOfferUnit.Energy ? '⚡' : '🪙'; 

          await send(ctx.interaction, builder => 
            builder.addEmbed(() => EmbedTemplates.createSimple(`Successfully bought ${bold(name)} for ${unitEmoji} ${bold(cost.toLocaleString())}.`))  
          )
        },
      },
      filter: component => component.user.id === command.user.id,
      end: async () => {
        await edit(command, BoostersCommand.renderBoosterPickerContent(customId, booster, boosterShopOffer, true));
      }
    });

    await collector.start();
  }

  private static renderBoosterPickerContent(customId: CustomId, selectedBooster: Booster | null, selectedShopOffer: BoosterShopOffer | null, ended: boolean) {
    return new InteractionMessageContentBuilder()
      .addRow(row => {
        row.addSelectMenuComponent(menu => {
          menu
            .setCustomId(customId.create('picker'))
            .setPlaceholder('Select Booster')
            .setMaxValues(1)
            .setDisabled(ended);

          return container.stores
            .get('boosters')
            .reduce((menu, booster) =>
              menu.addOption({
                label: booster.name,
                value: booster.id,
                description: booster.description,
                default: selectedBooster?.id === booster.id
              }),
              menu
            );
        });

        if (!isNullOrUndefined(selectedBooster)) {
          row.addSelectMenuComponent(menu => {
            menu
              .setCustomId(customId.create('shop-offer'))
              .setPlaceholder('Select Offer')
              .setDisabled(ended)
              .setMaxValues(1);

            return selectedBooster.shopOffers
              .reduce((menu, shopOffer) =>
                menu.addOption({
                  label: shopOffer.cost.toLocaleString(),
                  emoji: shopOffer.unit === BoosterShopOfferUnit.Star ? '⭐' : shopOffer.unit === BoosterShopOfferUnit.Energy ? '⚡' : '🪙',
                  value: shopOffer.id,
                  default: selectedShopOffer?.id === shopOffer.id,
                  description: `${shopOffer.type === BoosterShopOfferType.Duration ? 'Duration' : 'Quantity'}: ${isFunction(shopOffer.value) ? 'Random Value' : shopOffer.type === BoosterShopOfferType.Duration ? new DurationFormatter().format(shopOffer.value, Infinity, { right: ', ' }) : shopOffer.value.toLocaleString()}`
                }),
                menu
              );
          });

          for (const control of ['buy', 'cancel'] as const) {
            row.addButtonComponent(btn =>
              btn
                .setCustomId(customId.create(control))
                .setLabel(toTitleCase(control))
                .setStyle(Constants.MessageButtonStyles.SECONDARY)
                .setDisabled(control === 'buy' ? isNullOrUndefined(selectedShopOffer) || ended : ended)
            );
          }
        }

        return row;
      })
      .addEmbed(() =>
        EmbedTemplates.createCamouflaged(embed => {
          embed
            .setTitle('Booster Shop')
            .setDescription('Select a booster to purchase.');

          if (!isNullOrUndefined(selectedBooster)) {
            embed.setTitle(selectedBooster.name);
            embed.setDescription('Select an offer to accept.');

            for (const [index, shopOffer] of selectedBooster.shopOffers.entries()) {
              embed.addFields({
                name: `Offer #${index + 1}`,
                inline: true,
                value: join(
                  `${bold(`${shopOffer.type === BoosterShopOfferType.Duration ? 'Duration' : 'Quantity'}:`)} ${isFunction(shopOffer.value) ? 'Random' : shopOffer.type === BoosterShopOfferType.Duration ? new DurationFormatter().format(shopOffer.value, Infinity, { right: ', ' }) : `x${shopOffer.value.toLocaleString()}`}`,
                  `${bold('Price:')} ${shopOffer.unit === BoosterShopOfferUnit.Star ? '⭐' : shopOffer.unit === BoosterShopOfferUnit.Energy ? '⚡' : '🪙'}`
                )
              });
            }

            if (!isNullOrUndefined(selectedShopOffer)) {
              embed.setFields([]);
              embed.setDescription(
                join(
                  `${bold(`${selectedShopOffer.type === BoosterShopOfferType.Duration ? 'Duration' : 'Quantity'}:`)} ${isFunction(selectedShopOffer.value) ? 'Random' : selectedShopOffer.type === BoosterShopOfferType.Duration ? new DurationFormatter().format(selectedShopOffer.value, Infinity, { right: ', ' }) : `x${selectedShopOffer.value.toLocaleString()}`}`,
                  `${bold('Price:')} ${selectedShopOffer.unit === BoosterShopOfferUnit.Star ? '⭐' : selectedShopOffer.unit === BoosterShopOfferUnit.Energy ? '⚡' : '🪙'}`
                )
              );
            }
          }

          return embed;
        })
      )
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
      , {
        idHints: ['1064906213562798080']
      }
    );
  }
}