// @ts-check
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
  return {
    id,
    name: "test-channel",
    type: 0, // GUILD_TEXT
    sent,
    /** @param {string | { content: string }} content */
    send: async (content) => {
      const payload = typeof content === "string" ? { content } : content;
      sent.push(payload);
      return mockMessage({ content: payload.content, channel: undefined });
    },
    ...overrides,
  };
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
    ...otherOverrides
  } = overrides;
  const id = overrides.id ?? nextId();
  const members = /** @type {Map<string, import("../index.js").MockMember>} */ (
    overrideMembers ?? new Map()
  );
  const roles = /** @type {Array<import("../index.js").MockRole>} */ (
    overrideRoles ?? []
  );
  return {
    id,
    name: "Test Guild",
    ownerId: overrides.ownerId ?? nextId(),
    members: {
      cache: members,
      /** @param {string} userId */
      fetch: async (userId) => members.get(userId) ?? null,
    },
    roles: {
      cache: new Map(roles.map((r) => [r.id, r])),
    },
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
  return {
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
      const payload = typeof content === "string" ? { content } : content;
      replies.push(payload);
      return mockMessage({ content: payload.content, author: undefined });
    },
    react: async () => {},
    ...overrides,
  };
}
