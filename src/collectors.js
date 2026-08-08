// @ts-check
import { EventEmitter } from "node:events";

/**
 * Minimal `discord.js` Collection-compatible container.
 *
 * Extends the built-in `Map` with the small set of methods most bot code
 * uses against collectors: `.first()`, `.last()`, `.map()`, `.filter()`,
 * `.find()`, `.findKey()`, `.some()`, `.every()`, `.reduce()`, `.at()`,
 * `.keyAt()`, and `.random()`. We intentionally do not reimplement every
 * `Collection` method - only the ones a unit test is likely to assert on.
 *
 * @template K, V
 * @extends {Map<K, V>}
 */
export class MockCollection extends Map {
  /** @param {number} [amount] @returns {V | Array<V> | null} */
  first(amount) {
    if (amount === undefined) {
      const first = this.values().next();
      return first.done ? null : /** @type {V} */ (first.value);
    }
    if (amount < 0) return /** @type {Array<V>} */ (this.last(-amount));
    return Array.from(this.values()).slice(0, amount);
  }

  /** @param {number} [amount] @returns {V | Array<V> | null} */
  last(amount) {
    const values = Array.from(this.values());
    if (amount === undefined) return values[values.length - 1] ?? null;
    if (amount < 0) return /** @type {Array<V>} */ (this.first(-amount));
    return values.slice(-amount);
  }

  /** @param {number} index @returns {V | null} */
  at(index) {
    const values = Array.from(this.values());
    const atIndex = index < 0 ? values.length + index : index;
    return values[atIndex] ?? null;
  }

  /** @param {number} index @returns {K | null} */
  keyAt(index) {
    const keys = Array.from(this.keys());
    const atIndex = index < 0 ? keys.length + index : index;
    return keys[atIndex] ?? null;
  }

  /** @returns {V | null} */
  random() {
    const values = Array.from(this.values());
    if (values.length === 0) return null;
    return values[Math.floor(Math.random() * values.length)];
  }

  /**
   * @template R
   * @param {(value: V, key: K, collection: this) => R} fn
   * @returns {R[]}
   */
  map(fn) {
    const out = [];
    for (const [key, value] of this) out.push(fn(value, key, this));
    return out;
  }

  /**
   * @param {(value: V, key: K, collection: this) => boolean} fn
   * @returns {MockCollection<K, V>}
   */
  filter(fn) {
    const out = new MockCollection();
    for (const [key, value] of this) {
      if (fn(value, key, this)) out.set(key, value);
    }
    return out;
  }

  /**
   * @param {(value: V, key: K, collection: this) => boolean} fn
   * @returns {V | undefined}
   */
  find(fn) {
    for (const [key, value] of this) {
      if (fn(value, key, this)) return value;
    }
    return undefined;
  }

  /**
   * @param {(value: V, key: K, collection: this) => boolean} fn
   * @returns {K | undefined}
   */
  findKey(fn) {
    for (const [key, value] of this) {
      if (fn(value, key, this)) return key;
    }
    return undefined;
  }

  /**
   * @param {(value: V, key: K, collection: this) => boolean} fn
   * @returns {boolean}
   */
  some(fn) {
    for (const [key, value] of this) {
      if (fn(value, key, this)) return true;
    }
    return false;
  }

  /**
   * @param {(value: V, key: K, collection: this) => boolean} fn
   * @returns {boolean}
   */
  every(fn) {
    for (const [key, value] of this) {
      if (!fn(value, key, this)) return false;
    }
    return true;
  }

  /**
   * @template R
   * @param {(accumulator: R, value: V, key: K, collection: this) => R} fn
   * @param {R} [initial]
   * @returns {R | undefined}
   */
  reduce(fn, initial) {
    let acc = initial;
    let started = initial !== undefined;
    for (const [key, value] of this) {
      if (!started) {
        acc = /** @type {R} */ (/** @type {unknown} */ (value));
        started = true;
      } else {
        acc = fn(/** @type {R} */ (acc), value, key, this);
      }
    }
    return acc;
  }
}

/**
 * @typedef {import("../index.js").MockChannel} MockChannel
 * @typedef {import("../index.js").MockMessage} MockMessage
 */

/**
 * @typedef {Object} BaseCollectorOptions
 * @property {(item: any, ...rest: any[]) => boolean} [filter]
 * @property {number} [max]
 * @property {number} [time]
 * @property {number} [idle]
 */

/**
 * Internal base class for message / reaction / interaction collectors.
 * Handles common lifecycle: filter, max, time, idle, dedupe, end reasons.
 */
class BaseMockCollector extends EventEmitter {
  /**
   * @param {EventEmitter} target
   * @param {BaseCollectorOptions & Record<string, any>} options
   */
  constructor(target, options = {}) {
    super();
    this.target = target;
    /** @type {(item: any, ...rest: any[]) => boolean} */
    this.filter = options.filter ?? (() => true);
    this.max = options.max ?? Infinity;
    this.time = typeof options.time === "number" ? options.time : null;
    this.idle = typeof options.idle === "number" ? options.idle : null;
    /** @type {MockCollection<string, any>} */
    this.collected = new MockCollection();
    this.ended = false;
    this.endReason = /** @type {string | null} */ (null);

    if (this.time !== null && this.time > 0) {
      this._timeTimer = setTimeout(() => this.stop("time"), this.time);
    }
    if (this.idle !== null && this.idle > 0) {
      this._idleTimer = setTimeout(() => this.stop("idle"), this.idle);
    }

    this._listen();

    // Stop immediately if max is 0 - we never want to collect anything.
    if (this.max === 0) {
      queueMicrotask(() => this.stop("limit"));
    }
  }

  /** Override in subclasses to attach the event listener. */
  _listen() {}

  /** Override in subclasses to detach the event listener. */
  _unlisten() {}

  /**
   * Records an item. Subclasses call this after applying any collector-
   * specific filtering (e.g. componentType). The default key is `item.id`.
   * @param {any} item
   * @param {string | number} [key]
   */
  _record(item, key) {
    if (this.ended) return;
    if (!this.filter(item)) return;

    const useKey = key ?? item?.id;
    if (useKey !== undefined && this.collected.has(String(useKey))) return;
    this.collected.set(String(useKey ?? Symbol("anonymous")), item);

    this.emit("collect", item);

    if (this.idle !== null && this.idle > 0) {
      if (this._idleTimer) clearTimeout(this._idleTimer);
      this._idleTimer = setTimeout(() => this.stop("idle"), this.idle);
    }
    if (this.collected.size >= this.max) this.stop("limit");
  }

  /** @param {string} [reason] */
  stop(reason = "user") {
    if (this.ended) return;
    this.ended = true;
    this.endReason = reason;
    this._clearTimers();
    this._unlisten();
    this.emit("end", this.collected, reason);
  }

  _clearTimers() {
    if (this._timeTimer) clearTimeout(this._timeTimer);
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._timeTimer = undefined;
    this._idleTimer = undefined;
  }
}

/**
 * Mirrors discord.js's `MessageCollector`. Listen on a `mockChannel()` for
 * `messageCreate` events; each event is run through `filter` and, if it
 * passes, stored in `collected` and emitted as `'collect'`.
 *
 * @extends BaseMockCollector
 */
export class MockMessageCollector extends BaseMockCollector {
  /** @param {string} [event] */
  _listen(event = "messageCreate") {
    /** @type {(message: any) => void} */
    this._listener = (message) => this._record(message);
    this.target.on(event, this._listener);
    this._event = event;
  }

  _unlisten() {
    if (this._listener && this._event) {
      this.target.off(this._event, this._listener);
    }
    this._listener = undefined;
    /** @type {string | undefined} */
    this._event = undefined;
  }
}

/**
 * Mirrors discord.js's `ReactionCollector`. Listens on a `mockMessage()`
 * for `messageReactionAdd` events. Collected items are `{ reaction, user }`
 * tuples keyed by `userId`, matching the real discord.js shape.
 */
export class MockReactionCollector extends BaseMockCollector {
  /** @param {string} [event] */
  _listen(event = "messageReactionAdd") {
    /**
     * @param {any} reaction
     * @param {any} user
     */
    this._listener = (reaction, user) => {
      const item = { reaction, user };
      const key =
        user?.id ?? reaction?.id ?? `reaction-${Date.now()}-${Math.random()}`;
      this._record(item, key);
    };
    this.target.on(event, this._listener);
    this._event = event;
  }

  _unlisten() {
    if (this._listener && this._event) {
      this.target.off(this._event, this._listener);
    }
    this._listener = undefined;
    /** @type {string | undefined} */
    this._event = undefined;
  }
}

/**
 * Map a discord.js-style `componentType` filter to a predicate. Accepts
 * either the symbolic name (`'BUTTON'`, `'SELECT_MENU'`) or the numeric
 * component type, since bot code uses both interchangeably.
 *
 * @param {unknown} componentType
 * @param {any} interaction
 * @returns {boolean}
 */
function matchesComponentType(componentType, interaction) {
  if (componentType === undefined || componentType === null) return true;
  switch (componentType) {
    case "BUTTON":
    case 2:
    case 3:
      return Boolean(interaction?.isButton?.());
    case "SELECT_MENU":
    case "STRING_SELECT":
    case 5:
      return Boolean(interaction?.isStringSelectMenu?.());
    case "USER_SELECT":
    case 6:
      return Boolean(interaction?.isUserSelectMenu?.());
    case "ROLE_SELECT":
    case 7:
      return Boolean(interaction?.isRoleSelectMenu?.());
    case "CHANNEL_SELECT":
    case "MENTIONABLE_SELECT":
    case 8:
      return Boolean(interaction?.isChannelSelectMenu?.());
    case "TEXT_INPUT":
    case 4:
      return Boolean(interaction?.isModalSubmit?.());
    default:
      return true;
  }
}

/**
 * Mirrors discord.js's `InteractionCollector`. Listen on a `mockChannel()`
 * or `mockMessage()` for `interactionCreate` events. Supports the same
 * `componentType` filtering as the real collector.
 */
export class MockInteractionCollector extends BaseMockCollector {
  /**
   * @param {EventEmitter} target
   * @param {BaseCollectorOptions & { componentType?: string | number }} [options]
   */
  constructor(target, options = {}) {
    super(target, options);
    /** @type {string | number | undefined} */
    this.componentType = options.componentType;
  }

  /** @param {string} [event] */
  _listen(event = "interactionCreate") {
    /** @type {(interaction: any) => void} */
    this._listener = (interaction) => {
      if (!matchesComponentType(this.componentType, interaction)) return;
      const key =
        interaction?.id ?? `interaction-${Date.now()}-${Math.random()}`;
      this._record(interaction, key);
    };
    this.target.on(event, this._listener);
    this._event = event;
  }

  _unlisten() {
    if (this._listener && this._event) {
      this.target.off(this._event, this._listener);
    }
    this._listener = undefined;
    /** @type {string | undefined} */
    this._event = undefined;
  }
}

/**
 * Resolve with the collector's `collected` Map when `max` is reached or the
 * collector ends successfully; reject (matching discord.js semantics) when
 * the reason is in the user-provided `errors` list.
 *
 * @param {BaseMockCollector} collector
 * @param {string[]} [errors]
 * @returns {Promise<MockCollection<string, any>>}
 */
function awaitEnd(collector, errors = ["time"]) {
  return new Promise((resolve, reject) => {
    /** @param {MockCollection<string, any>} collected */
    /** @param {string} reason */
    collector.on("end", (collected, reason) => {
      const reasonStr = String(reason);
      if (errors.includes(reasonStr)) {
        /** @type {Error & { collected: any; reason: string }} */
        const err = /** @type {Error & { collected: any; reason: string }} */ (
          new Error(
            `Collector ended with reason "${reasonStr}" before any items were collected.`,
          )
        );
        err.collected = collected;
        err.reason = reasonStr;
        reject(err);
      } else {
        resolve(collected);
      }
    });
  });
}

/**
 * Promise wrapper around `MockMessageCollector`. Mirrors
 * `channel.awaitMessages({ ... })` from discord.js: resolves with the
 * `collected` collection when `max` is reached; rejects with the
 * collection attached when `time`/`idle` triggers (unless overridden via
 * the `errors` option, which defaults to `['time']` to match discord.js).
 *
 * @param {EventEmitter} target
 * @param {BaseCollectorOptions & { errors?: string[] }} [options]
 */
export function awaitMessages(target, options = {}) {
  const collector = new MockMessageCollector(target, options);
  return awaitEnd(collector, options.errors ?? ["time"]);
}

/**
 * Promise wrapper around `MockReactionCollector`.
 *
 * @param {EventEmitter} target
 * @param {BaseCollectorOptions & { errors?: string[] }} [options]
 */
export function awaitReactions(target, options = {}) {
  const collector = new MockReactionCollector(target, options);
  return awaitEnd(collector, options.errors ?? ["time"]);
}

/**
 * Promise wrapper around `MockInteractionCollector`. Resolves with the
 * single matching interaction (matching discord.js's `awaitMessageComponent`
 * shape - which returns one interaction, not a collection). Defaults
 * `max` to 1.
 *
 * @param {EventEmitter} target
 * @param {BaseCollectorOptions & { errors?: string[]; componentType?: string | number }} [options]
 */
export function awaitMessageComponent(target, options = {}) {
  const collectorOptions = { max: 1, ...options };
  const collector = new MockInteractionCollector(target, collectorOptions);
  return new Promise((resolve, reject) => {
    collector.on("end", (collected, reason) => {
      const reasonStr = String(reason);
      const errors = options.errors ?? ["time"];
      if (errors.includes(reasonStr)) {
        /** @type {Error & { collected: any; reason: string }} */
        const err = /** @type {Error & { collected: any; reason: string }} */ (
          new Error(
            `Component collector ended with reason "${reasonStr}" before any component interaction was received.`,
          )
        );
        err.collected = collected;
        err.reason = reasonStr;
        reject(err);
      } else {
        resolve(collected.first());
      }
    });
  });
}
