// @ts-check
import { mockUser, mockGuild, mockChannel, mockMember } from "./entities.js";

/**
 * Mocks a discord.js ChatInputCommandInteraction (slash command) closely
 * enough that bot handler code can call the usual methods/getters without
 * knowing it isn't talking to real Discord.
 *
 * Usage:
 *   const interaction = new MockInteraction({
 *     commandName: "ban",
 *     options: { target: someMockUser, reason: "spamming" },
 *     user: mockUser({ id: "123" }),
 *   });
 *   await handleBanCommand(interaction);
 *   expect(interaction.replies[0].content).toMatch(/banned/i);
 */
export class MockInteraction {
  /**
   * @param {Partial<import("../index.js").MockInteractionOptions>} [options]
   */
  constructor(options = {}) {
    const {
      commandName,
      subcommand = null,
      options: interactionOptions = {},
      user,
      member,
      guild,
      channel,
      isButtonInteraction = false,
      customId = null,
      simulateRateLimit = false,
    } = options;
    this.commandName = commandName;
    this.customId = customId;
    this.isButton = () => isButtonInteraction;
    this.isChatInputCommand = () => !isButtonInteraction;

    this.user = user ?? mockUser();
    this.guild = guild ?? mockGuild();
    this.channel = channel ?? mockChannel();
    this.member = member ?? mockMember({ user: this.user });

    /** @type {Record<string, unknown>} */
    this._options = interactionOptions;
    this._subcommand = subcommand;
    this._rateLimitProbability =
      typeof simulateRateLimit === "number"
        ? simulateRateLimit
        : simulateRateLimit
          ? 0.1
          : 0;

    // Captured outputs, exposed for assertions
    /** @type {Array<{ content?: string }>} */
    this.replies = [];
    /** @type {Array<{ content?: string }>} */
    this.followUps = [];
    this.replied = false;
    this.deferred = false;
    this.ephemeralOnDefer = false;

    /** @type {import("../index.js").MockInteractionOptions["options"]} */
    this.options = {
      /** @param {string} name */
      getString: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getInteger: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getNumber: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getBoolean: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getUser: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getMember: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getChannel: (name) => this._options[name] ?? null,
      /** @param {string} name */
      getRole: (name) => this._options[name] ?? null,
      getSubcommand: () => this._subcommand,
    };
  }

  _maybeFailRateLimit() {
    if (
      this._rateLimitProbability > 0 &&
      Math.random() < this._rateLimitProbability
    ) {
      throw new Error("MockInteraction: simulated rate limit or API failure.");
    }
  }

  /** @param {string | { content: string }} content */
  async reply(content) {
    this._maybeFailRateLimit();
    if (this.replied || this.deferred) {
      throw new Error(
        "MockInteraction: reply() called after the interaction was already replied to or deferred " +
          "(this mirrors discord.js's real InteractionAlreadyReplied error).",
      );
    }
    const payload = typeof content === "string" ? { content } : content;
    this.replied = true;
    this.replies.push(payload);
    return payload;
  }

  /**
   * @param {{ ephemeral?: boolean }} [opts]
   */
  async deferReply(opts = {}) {
    this._maybeFailRateLimit();
    this.deferred = true;
    this.ephemeralOnDefer = !!opts.ephemeral;
  }

  /** @param {string | { content: string }} content */
  async editReply(content) {
    this._maybeFailRateLimit();
    const payload = typeof content === "string" ? { content } : content;
    // editReply works whether you deferred or already replied
    this.replies.push(payload);
    this.replied = true;
    return payload;
  }

  /** @param {string | { content: string }} content */
  async followUp(content) {
    this._maybeFailRateLimit();
    const payload = typeof content === "string" ? { content } : content;
    this.followUps.push(payload);
    return payload;
  }

  /** Convenience: the content string of the most recent reply/editReply. */
  get lastReplyContent() {
    const last = this.replies[this.replies.length - 1];
    return last?.content ?? null;
  }
}
