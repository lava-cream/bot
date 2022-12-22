import { Builder } from "#lib/utilities/builders/index.js";
import type { Message, MessageCollectorOptionsParams, MessageComponentTypeResolvable, User } from "discord.js";
import type { Collector } from "./collector";
import { CollectorAction, CollectorActionLogic, CollectorEndAction, CollectorFilterAction } from "./collector.action.js";

/**
 * Options to create a {@link Collector}.
 * @template T The component type.
 * @template Cached If the interaction came from a cached message.
 * @since 6.0.0
 */
export interface ICollectorOptions<T extends MessageComponentTypeResolvable, Cached extends boolean> extends MessageCollectorOptionsParams<T, Cached> {
  actions?: Record<string, CollectorActionLogic<T, Cached>>;
  componentType?: T;
  end?: CollectorEndAction<T, Cached>;
  filter?: CollectorFilterAction<T, Cached>;
  message?: Message<Cached>;
  user?: User;
}

/**
 * Options to create a {@link Collector}.
 * @template T The component type.
 * @template Cached If the interaction came from a cached message.
 * @since 6.0.0
 */
export default class CollectorOptions<T extends MessageComponentTypeResolvable, Cached extends boolean> extends Builder implements ICollectorOptions<T, Cached> {
  public actions?: ICollectorOptions<T, Cached>['actions'];
  public componentType?: ICollectorOptions<T, Cached>['componentType'];
  public dispose?: ICollectorOptions<T, Cached>['dispose'];
  public end?: ICollectorOptions<T, Cached>['end'];
  public filter?: ICollectorOptions<T, Cached>['filter'];
  public idle?: ICollectorOptions<T, Cached>['idle'];
  public max?: ICollectorOptions<T, Cached>['max'];
  public maxComponents?: ICollectorOptions<T, Cached>['maxComponents'];
  public maxUsers?: ICollectorOptions<T, Cached>['maxUsers'];
  public message?: Message<Cached>;
  public time?: ICollectorOptions<T, Cached>['time'];
  public user?: ICollectorOptions<T, Cached>['user'];

  public constructor(public collector: Collector<T, Cached>, public options?: ICollectorOptions<T, Cached>) {
    super();
    this.actions = options?.actions;
    this.componentType = options?.componentType;
    this.dispose = options?.dispose;
    this.end = options?.end ?? CollectorAction.getDefaultEndAction();
    this.filter = options?.filter ?? CollectorAction.getDefaultFilterAction(options?.user);
    this.idle = options?.idle;
    this.max = options?.max;
    this.maxComponents = options?.maxComponents;
    this.maxUsers = options?.maxUsers;
    this.message = options?.message;
    this.time = options?.time;
    this.user = options?.user;

    // Verbose call to ensure the actions from this builder matches those from the main collector.
    this.setActions(options?.actions);
  }  

  /**
   * Sets the actions to possibly run.
   * @param actions The actions.
   * @returns This builder.
   */
  public setActions(actions: ICollectorOptions<T, Cached>['actions']): this {
    if (actions) {
      this.collector.actions.set(
        Object.entries(actions).map(action => this.collector.actions.construct(...action))
      );
    }

    this.actions = actions;
    return this;
  }

  /**
   * Sets the component type to collect. 
   * @param componentType The component type.
   * @returns This builder.
   */
  public setComponentType(componentType: ICollectorOptions<T, Cached>['componentType']): this {
    this.componentType = componentType;
    return this;
  }

  /**
   * Sets the mode of allowing disposal of interactions.
   * @param dispose The value.
   * @returns This builder.
   */
  public setDispose(dispose: ICollectorOptions<T, Cached>['dispose']): this {
    this.dispose = dispose;
    return this;
  }

  /**
   * Sets the end function of the collector.
   * @param end The end function.
   * @returns This builder.
   */
  public setEnd(end: ICollectorOptions<T, Cached>['end']): this {
    this.end = end;
    return this;
  }

  /**
   * Sets the filter of the attached interaction collector.
   * @param filter The filter function.
   * @returns This builder.
   */
  public setFilter(filter: ICollectorOptions<T, Cached>['filter']): this {
    this.filter = filter;
    return this;
  }

  /**
   * Sets the idle timeout of the attached interaction collector.
   * @param idle The time in ms format.
   * @returns This builder.
   */
  public setIdle(idle: ICollectorOptions<T, Cached>['idle']): this {
    this.idle = idle;
    return this;
  }

  /**
   * Sets the maximum amount of interactions this interaction collector should only receive.
   * @param max The value.
   * @returns This builder.
   */
  public setMax(max: ICollectorOptions<T, Cached>['max']): this {
    this.max = max;
    return this;
  }

  /**
   * Sets the maximum amount of message components the attached interaction collector should only handle.
   * @param maxComponents The value.
   * @returns This builder.
   */
  public setMaxComponents(maxComponents: ICollectorOptions<T, Cached>['maxComponents']): this {
    this.maxComponents = maxComponents;
    return this;
  }

  /**
   * Sets the maximum users allowed to interact with this collector.
   * @param maxUsers The value.
   * @returns This builder.
   */
  public setMaxUsers(maxUsers: ICollectorOptions<T, Cached>['maxUsers']): this {
    this.maxUsers = maxUsers;
    return this;
  }

  /**
   * Sets the message to create the interaction collector from of the collector.
   * @param message The message.
   * @returns This builder.
   */
  public setMessage(message: Exclude<ICollectorOptions<T, Cached>['message'], undefined>): this {
    this.message = message;
    return this;
  }

  /**
   * Sets the duration of how long the collector should run.
   * @param time The time in ms format.
   * @returns This builder.
   */
  public setTime(time: ICollectorOptions<T, Cached>['time']): this {
    this.time = time;
    return this;
  }

  /**
   * Sets the user who owns the collector.
   * @param user The user.
   * @returns This builder.
   */
  public setUser(user: ICollectorOptions<T, Cached>['user']): this {
    this.user = user;
    return this;
  }
}