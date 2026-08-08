// @ts-check
import { EventEmitter } from "node:events";
import {
  maybeThrowConfiguredError,
  normalizePayload,
  registerReset,
} from "./utils.js";
import {
  MockInteractionCollector,
  MockMessageCollector,
  MockReactionCollector,
  awaitMessageComponent as awaitMessageComponentImpl,
  awaitMessages as awaitMessagesImpl,
  awaitReactions as awaitReactionsImpl,
} from "./collectors.js";

let idCounter = 1000;
function nextId() {
  return String(idCounter++);
}

/**
 * Creates a mock User object matching the shape of discord.js's User class
 * closely enough for typical bot logic (permission checks, mentions, replies).
 */
/**
 * @typedef {import("../index.js").MockUserOptions} MockUserOptions
 * @typedef {import("../index.js").PermissionFlag} PermissionFlag
 * @typedef {import("../index.js").MockRoleOptions} MockRoleOptions
 * @typedef {import("../index.js").MockMemberOptions} MockMemberOptions
 * @typedef {import("../index.js").MockChannelOptions} MockChannelOptions
 * @typedef {import("../index.js").MockGuildOptions} MockGuildOptions
 * @typedef {import("../index.js").MockMessageOptions} MockMessageOptions
 */

/**
 * @template T
 * @param {Map<string, T>} cache
 * @returns {{ cache: Map<string, T>; fetch(id: string): Promise<T | null> }}
 */
function createFetchableCache(cache) {
  return {
    cache,
    /** @param {string} id */
    fetch: async (id) => cache.get(id) ?? null,
  };
}

/**
 * @param {MockUserOptions} [overrides]
 */
export function mockUser(overrides = {}) {
  const id = overrides.id ?? nextId();
  return {
    id,
    username: "testuser",
    discriminator: "0",
    bot: false,
    tag: overrides.username ? `${overrides.username}#0` : "testuser#0",
    toString: () => `<@${id}>`,
    ...overrides,
  };
}

/**
 * Creates a mock Role object.
 */
/**
 * @param {MockRoleOptions} [overrides]
 */
/**
 * @param {MockRoleOptions} [overrides]
 * @returns {import("../index.js").MockRole}
 */
export function mockRole(overrides = {}) {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: "TestRole",
    permissions: mockPermissions(overrides.permissionFlags ?? []),
    toString: () => `<@&${id}>`,
    ...overrides,
  };
}

/**
 * Creates a mock PermissionsBitField-like object.
 * Pass an array of permission flag names, e.g. ["BanMembers", "KickMembers"].
 */
/**
 * @param {PermissionFlag[]} [flags]
 */
/**
 * @param {PermissionFlag[]} [flags]
 * @returns {import("../index.js").MockPermissions}
 */
export function mockPermissions(flags = []) {
  const set = new Set(flags);
  return {
    /** @param {PermissionFlag | PermissionFlag[]} flag */
    has: (flag) => {
      if (Array.isArray(flag)) return flag.every((f) => set.has(f));
      return set.has(flag);
    },
    toArray: () => Array.from(set),
    /** @param {PermissionFlag} flag */
    add: (flag) => set.add(flag),
    /** @param {PermissionFlag} flag */
    remove: (flag) => set.delete(flag),
  };
}

/**
 * Creates a mock GuildMember object.
 */
/**
 * @param {MockMemberOptions} [overrides]
 */
/**
 * @param {MockMemberOptions} [overrides]
 * @returns {import("../index.js").MockMember}
 */
export function mockMember(overrides = {}) {
  const {
    user: userOverride,
    roles: roleOverrides = [],
    permissions,
    permissionFlags,
    ...otherOverrides
  } = overrides;
  const user = userOverride ?? mockUser();
  return {
    id: user.id,
    nickname: null,
    roles: {
      cache: new Map(roleOverrides.map((r) => [r.id, r])),
      add: () => {},
      remove: () => {},
    },
    permissions: permissions ?? mockPermissions(permissionFlags ?? []),
    kick: async () => {},
    ban: async () => {},
    toString: () => `<@${user.id}>`,
    ...otherOverrides,
    user,
  };
}

/**
 * Creates a mock Channel object. `sent` (if provided) is an array that
 * captures every message passed to `.send()`, so tests can assert on it.
 */
/**
 * @param {MockChannelOptions} [overrides]
 */
/**
 * @param {MockChannelOptions} [overrides]
 * @returns {import("../index.js").MockChannel}
 */
export function mockChannel(overrides = {}) {
  const sent = overrides.sent ?? [];
  const id = overrides.id ?? nextId();
  /** @type {Map<string, import("../index.js").MockThread>} */
  const threads = new Map();
  /** @type {Record<string, unknown>} */
  const errors = { send: overrides.throwOnSend };
  /** @type {any} */
  const channel = Object.assign(new EventEmitter(), {
    id,
    name: "test-channel",
    type: 0, // GUILD_TEXT
    sent,
    /** @param {string | { content: string }} content */
    send: async (content) => {
      maybeThrowConfiguredError(errors, "send");
      const payload = normalizePayload(content);
      sent.push(payload);
      return mockMessage({
        content: typeof payload.content === "string" ? payload.content : "",
        channel: undefined,
      });
    },
    threads: {
      cache: threads,
      /** @param {import("../index.js").MockThreadOptions} [threadOptions] */
      create: async (threadOptions = {}) => {
        const thread = mockThread({ parent: channel, ...threadOptions });
        threads.set(thread.id, thread);
        return thread;
      },
      /** @param {string} threadId */
      fetch: async (threadId) => threads.get(threadId) ?? null,
    },
    /** @param {Record<string, any>} [options] */
    createMessageCollector: (options = {}) =>
      new MockMessageCollector(channel, options),
    /** @param {Record<string, any>} [options] */
    awaitMessages: (options = {}) => awaitMessagesImpl(channel, options),
    /** @param {Record<string, any>} [options] */
    awaitMessageComponent: (options = {}) =>
      awaitMessageComponentImpl(channel, options),
    /** @param {string | import("../index.js").MockDiscordAPIErrorInput} methodOrError @param {unknown} [error] */
    simulateError: (methodOrError, error) => {
      if (typeof methodOrError === "string") {
        errors[methodOrError] = error ?? { code: 50035 };
      } else {
        errors.all = methodOrError;
      }
      return channel;
    },
    ...overrides,
  });
  registerReset(() => {
    sent.length = 0;
  });
  return channel;
}

/**
 * @param {import("../index.js").MockThreadOptions} [overrides]
 * @returns {import("../index.js").MockThread}
 */
export function mockThread(overrides = {}) {
  const sent = overrides.sent ?? [];
  const id = overrides.id ?? nextId();
  /** @type {Record<string, unknown>} */
  const errors = { send: overrides.throwOnSend };
  /** @type {import("../index.js").MockThread} */
  const thread = {
    id,
    name: overrides.name ?? "test-thread",
    type: overrides.type ?? 11,
    archived: overrides.archived ?? false,
    parent: overrides.parent ?? null,
    sent,
    /** @param {string | { content: string }} content */
    send: async (content) => {
      maybeThrowConfiguredError(errors, "send");
      const payload = normalizePayload(content);
      sent.push(payload);
      return mockMessage({
        content: typeof payload.content === "string" ? payload.content : "",
        channel: undefined,
      });
    },
    /** @param {boolean} [archived] */
    setArchived: async (archived = true) => {
      thread.archived = archived;
      return thread;
    },
    /** @param {string | import("../index.js").MockDiscordAPIErrorInput} methodOrError @param {unknown} [error] */
    simulateError: (methodOrError, error) => {
      if (typeof methodOrError === "string") {
        errors[methodOrError] = error ?? { code: 50035 };
      } else {
        errors.all = methodOrError;
      }
      return thread;
    },
    ...overrides,
  };
  registerReset(() => {
    sent.length = 0;
  });
  return thread;
}

/**
 * Creates a mock Guild object.
 */
/**
 * @param {MockGuildOptions} [overrides]
 */
/**
 * @param {MockGuildOptions} [overrides]
 * @returns {import("../index.js").MockGuild}
 */
export function mockGuild(overrides = {}) {
  const {
    members: overrideMembers,
    roles: overrideRoles,
    channels: overrideChannels,
    ...otherOverrides
  } = overrides;
  const id = overrides.id ?? nextId();
  const members = /** @type {Map<string, import("../index.js").MockMember>} */ (
    overrideMembers ?? new Map()
  );
  const roles = /** @type {Array<import("../index.js").MockRole>} */ (
    overrideRoles ?? []
  );
  const channels = /** @type {Map<string, import("../index.js").MockChannel>} */ (
    overrideChannels ?? new Map()
  );
  return {
    id,
    name: "Test Guild",
    ownerId: overrides.ownerId ?? nextId(),
    members: createFetchableCache(members),
    roles: {
      cache: new Map(roles.map((r) => [r.id, r])),
    },
    channels: createFetchableCache(channels),
    ...otherOverrides,
  };
}

/**
 * Creates a mock Message object, matching enough of discord.js's Message
 * class for prefix-command bots (content, author, reply, channel.send).
 */
/**
 * @param {MockMessageOptions} [overrides]
 */
/**
 * @param {MockMessageOptions} [overrides]
 * @returns {import("../index.js").MockMessage}
 */
export function mockMessage(overrides = {}) {
  const author = overrides.author ?? mockUser();
  /** @type {import("../index.js").MockChannel} */
  const channel = overrides.channel ?? mockChannel();
  const replies = overrides.replies ?? [];
  /** @type {any} */
  const message = Object.assign(new EventEmitter(), {
    id: overrides.id ?? nextId(),
    content: overrides.content ?? "",
    author,
    member: overrides.member ?? mockMember({ user: author }),
    guild: overrides.guild ?? mockGuild(),
    channel,
    replies,
    mentions: overrides.mentions ?? { users: new Map(), roles: new Map() },
    /** @param {string | { content: string }} content */
    reply: async (content) => {
      const payload = normalizePayload(content);
      replies.push(payload);
      return mockMessage({
        content: typeof payload.content === "string" ? payload.content : "",
        author: undefined,
      });
    },
    react: async () => {},
    /** @param {Record<string, any>} [options] */
    createReactionCollector: (options = {}) =>
      new MockReactionCollector(message, options),
    /** @param {Record<string, any>} [options] */
    awaitReactions: (options = {}) => awaitReactionsImpl(message, options),
    /** @param {Record<string, any>} [options] */
    awaitMessageComponent: (options = {}) =>
      awaitMessageComponentImpl(message, options),
    ...overrides,
  });
  registerReset(() => {
    replies.length = 0;
  });
  return message;
}

/**
 * @param {import("../index.js").MockClientOptions} [overrides]
 * @returns {import("../index.js").MockClient}
 */
export function mockClient(overrides = {}) {
  const {
    user: userOverride,
    users: usersOverride,
    guilds: guildsOverride,
    channels: channelsOverride,
    ...otherOverrides
  } = overrides;
  const user = userOverride ?? mockUser({ username: "bot", bot: true });
  const users = usersOverride ?? new Map([[user.id, user]]);
  const guilds = guildsOverride ?? new Map();
  const channels = channelsOverride ?? new Map();
  /** @type {any} */
  const client = Object.assign(new EventEmitter(), {
    user,
    users: createFetchableCache(users),
    guilds: createFetchableCache(guilds),
    channels: createFetchableCache(channels),
    ...otherOverrides,
  });
  return client;
}
