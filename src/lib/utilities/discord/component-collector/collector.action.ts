import type { Awaitable, CollectorFilter, InteractionCollector, MappedInteractionTypes, MessageComponentTypeResolvable as ComponentType, MessageComponentTypeResolvable, User } from 'discord.js';
import type { TFunction } from '#lib/utilities/common/common.types';
import { isNullOrUndefined } from '@sapphire/utilities';
import { disableMessageComponents, isMessageInstance } from '../discord.common.js';

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
   * Stops the attached interaction collector from running.
   * @param reason The reason why you want to stop the collector from running. Defaults to the interaction's custom id.
   */
  stop(reason?: string): void;
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
 * The collector's filter.
 * @template T The component's type.
 * @template Cached The cache status.
 */
export type CollectorFilterAction<T extends MessageComponentTypeResolvable, Cached extends boolean> = CollectorFilter<[MappedInteractionTypes<Cached>[T]]>;

/**
 * The function to call when the collector ends.
 * @template T The component's type.
 * @template Cached The cache status.
 */
export type CollectorEndAction<T extends MessageComponentTypeResolvable, Cached extends boolean> = (
  /**
   * The context for this predicate.
   */
  context: Omit<CollectorActionContext<T, Cached>, 'action' | 'interaction' | 'stop'> & Readonly<{
    /**
     * The last collected interaction, if there were any.
     */
    interaction: MappedInteractionTypes<Cached>[T] | null;
    /**
     * The reason why the collector stopped.
     */
    reason: string;
    /**
     * A function to check if the attached InteractionCollector stopped itself or not.
     */
    wasInternallyStopped(): boolean
  }>
) => Awaitable<void>;

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
    return Reflect.apply(this.logic, this, [context]);
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

  /**
   * Creates a defauly filter action for a collector.
   * @param user The user who owns this collector.
   * @returns A {@link Function}.
   */
  public static getDefaultFilterAction<T extends ComponentType, Cached extends boolean>(user?: User): CollectorFilterAction<T, Cached> {
    return async (component) => {
      const contextual = !isNullOrUndefined(user) ? component.user.id === user.id : true;
      await component.deferUpdate();
      return contextual;
    };
  }

  /**
   * Creates a default end action for a collector.
   * @template T The component type.
   * @template Cached The cache status.
   * @returns A {@link Function}.
   */
  public static getDefaultEndAction<T extends ComponentType, Cached extends boolean>(): CollectorEndAction<T, Cached> {
    return async (context) => {
      if (
        isNullOrUndefined(context.interaction) || 
        isNullOrUndefined(context.interaction.message) || 
        !isMessageInstance(context.interaction.message)
      ) return;

      await context.interaction.message.edit({ 
        components: disableMessageComponents(context.interaction.message.components) 
      });
    };
  }
}
