// @ts-check
import { MockInteraction } from "./interaction.js";
import { mockUser, mockGuild, mockChannel, mockMember } from "./entities.js";

/**
 * @typedef {import("../index.js").MockUserOptions} MockUserOptions
 * @typedef {import("../index.js").MockGuildOptions} MockGuildOptions
 * @typedef {import("../index.js").MockMemberOptions} MockMemberOptions
 * @typedef {import("../index.js").MockChannelOptions} MockChannelOptions
 * @typedef {import("../index.js").MockInteractionOptions} MockInteractionOptions
 * @typedef {import("../index.js").MockMember} MockMember
 * @typedef {import("../index.js").MockRole} MockRole
 */

/**
 * @param {{
 *   botUser?: MockUserOptions;
 *   guild?: MockGuildOptions;
 *   member?: MockMemberOptions;
 *   channel?: MockChannelOptions;
 *   defaultInteractionOptions?: Record<string, unknown>;
 *   replyErrorProbability?: number;
 * }} [options]
 */
export function createMockBot(
  /** @type {{
   *   botUser?: MockUserOptions;
   *   guild?: MockGuildOptions;
   *   member?: MockMemberOptions;
   *   channel?: MockChannelOptions;
   *   defaultInteractionOptions?: Record<string, unknown>;
   *   replyErrorProbability?: number;
   * }} */ options = {},
) {
  const {
    botUser,
    guild: guildOptions = /** @type {MockGuildOptions} */ ({}),
    member: memberOptions = /** @type {MockMemberOptions} */ ({}),
    channel: channelOptions = /** @type {MockChannelOptions} */ ({}),
    defaultInteractionOptions = {},
    replyErrorProbability,
  } = options;

  const user = mockUser(botUser);
  const members = /** @type {Map<string, MockMember>} */ (
    guildOptions.members ?? new Map()
  );
  const roles = /** @type {Array<MockRole>} */ (guildOptions.roles ?? []);
  const guild = mockGuild({
    ...guildOptions,
    members,
    roles,
  });

  const member = mockMember({
    user,
    ...memberOptions,
  });

  const channel = mockChannel(channelOptions);

  const client = {
    user,
    guilds: {
      cache: new Map([[guild.id, guild]]),
      /** @param {string} guildId */
      fetch: async (guildId) => (guildId === guild.id ? guild : null),
    },
  };

  /**
   * @param {Partial<MockInteractionOptions>} [overrides]
   */
  const createInteraction = (
    /** @type {Partial<MockInteractionOptions>} */ overrides = {},
  ) => {
    return new MockInteraction({
      user,
      member,
      guild,
      channel,
      options: { ...defaultInteractionOptions, ...overrides.options },
      ...overrides,
      simulateRateLimit:
        overrides.simulateRateLimit ?? replyErrorProbability ?? false,
    });
  };

  /**
   * @param {string} commandName
   * @param {Record<string, unknown>} interactionOptions
   */
  const createCommandInteraction = (commandName, interactionOptions = {}) =>
    createInteraction({ commandName, options: interactionOptions });

  return {
    client,
    user,
    guild,
    member,
    channel,
    createInteraction,
    createCommandInteraction,
  };
}
