import type { InteractionCollector, MappedInteractionTypes, Message, MessageComponentTypeResolvable as ComponentType } from 'discord.js';
import type { TFunction } from '#lib/utilities/common/common.types';

/**
 * Represents the main context of an action.
 * @template T The component type.
 * @template Cached The cached status of the interaction.
 */
export interface CollectorActionContext<in out T extends ComponentType, Cached extends boolean> {
  /**
   * The action itself.
   */
  readonly action: CollectorAction<T, Cached>;
  /**
   * The interaction collector.
   */
  readonly collector: InteractionCollector<MappedInteractionTypes<Cached>[T]>;
  /**
   * The interaction recieved from the collector.
   */
  readonly interaction: MappedInteractionTypes<Cached>[T];
  /**
   * The interaction as a discord message.
   */
  readonly message: Message<Cached>;
}

/**
 * Represents the main logic of a collector action.
 * @template T The component type.
 * @template Cached The cached status of the interaction.
 */
export type CollectorActionLogic<T extends ComponentType, Cached extends boolean> = TFunction<
  [context: CollectorActionContext<T, Cached>],
  void,
  boolean,
  CollectorAction<T, Cached>
>;

/**
 * Represents a collector action. Actions
 */
export class CollectorAction<in out T extends ComponentType, Cached extends boolean> {
  /**
   * The action's constructor.
   * @param id The id (which is the component's custom id) of this action.
   * @param logic The logic for this action.
   */
  public constructor(public id: string, public logic: CollectorActionLogic<T, Cached>) {}

  /**
   * Runs the main logic of this action.
   * @param context The context of the logic.
   * @returns The logic's return type.
   */
  public run(context: CollectorActionContext<T, Cached>) {
    return this.logic.call(this, context);
  }

  /**
   * Sets the new id of this action. The id must be the custom id of the message component this action is attached to.
   * @param id The new id of this action.
   * @returns This action.
   */
  public setId(id: string) {
    this.id = id;
    return this;
  }

  /**
   * Sets the new logic to run of this action.
   * @param logic The new logic of this action.
   * @returns This action.
   */
  public setLogic(logic: CollectorActionLogic<T, Cached>) {
    this.logic = logic.bind(this);
    return this;
  }
}
