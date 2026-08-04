let idCounter = 1000;
function nextId() {
  return String(idCounter++);
}

/**
 * Creates a mock User object matching the shape of discord.js's User class
 * closely enough for typical bot logic (permission checks, mentions, replies).
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
export function mockPermissions(flags = []) {
  const set = new Set(flags);
  return {
    has: (flag) => {
      if (Array.isArray(flag)) return flag.every((f) => set.has(f));
      return set.has(flag);
    },
    toArray: () => Array.from(set),
    add: (flag) => set.add(flag),
    remove: (flag) => set.delete(flag),
  };
}

/**
 * Creates a mock GuildMember object.
 */
export function mockMember(overrides = {}) {
  const user = overrides.user ?? mockUser();
  const roles = overrides.roles ?? [];
  return {
    id: user.id,
    user,
    nickname: null,
    roles: {
      cache: new Map(roles.map((r) => [r.id, r])),
      add: () => {},
      remove: () => {},
    },
    permissions: overrides.permissions ?? mockPermissions(overrides.permissionFlags ?? []),
    kick: async () => {},
    ban: async () => {},
    toString: () => `<@${user.id}>`,
    ...overrides,
    user,
  };
}

/**
 * Creates a mock Channel object. `sent` (if provided) is an array that
 * captures every message passed to `.send()`, so tests can assert on it.
 */
export function mockChannel(overrides = {}) {
  const sent = overrides.sent ?? [];
  const id = overrides.id ?? nextId();
  return {
    id,
    name: "test-channel",
    type: 0, // GUILD_TEXT
    sent,
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
export function mockGuild(overrides = {}) {
  const id = overrides.id ?? nextId();
  const members = overrides.members ?? new Map();
  return {
    id,
    name: "Test Guild",
    ownerId: overrides.ownerId ?? nextId(),
    members: {
      cache: members,
      fetch: async (userId) => members.get(userId) ?? null,
    },
    roles: {
      cache: new Map((overrides.roles ?? []).map((r) => [r.id, r])),
    },
    ...overrides,
  };
}

/**
 * Creates a mock Message object, matching enough of discord.js's Message
 * class for prefix-command bots (content, author, reply, channel.send).
 */
export function mockMessage(overrides = {}) {
  const author = overrides.author ?? mockUser();
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
    reply: async (content) => {
      const payload = typeof content === "string" ? { content } : content;
      replies.push(payload);
      return mockMessage({ content: payload.content, author: undefined });
    },
    react: async () => {},
    ...overrides,
  };
}
