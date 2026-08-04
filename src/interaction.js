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
  constructor({
    commandName,
    subcommand = null,
    options = {},
    user,
    member,
    guild,
    channel,
    isButtonInteraction = false,
    customId = null,
  } = {}) {
    this.commandName = commandName;
    this.customId = customId;
    this.isButton = () => isButtonInteraction;
    this.isChatInputCommand = () => !isButtonInteraction;

    this.user = user ?? mockUser();
    this.guild = guild ?? mockGuild();
    this.channel = channel ?? mockChannel();
    this.member = member ?? mockMember({ user: this.user });

    this._options = options;
    this._subcommand = subcommand;

    // Captured outputs, exposed for assertions
    this.replies = [];
    this.followUps = [];
    this.replied = false;
    this.deferred = false;
    this.ephemeralOnDefer = false;

    this.options = {
      getString: (name) => this._options[name] ?? null,
      getInteger: (name) => this._options[name] ?? null,
      getNumber: (name) => this._options[name] ?? null,
      getBoolean: (name) => this._options[name] ?? null,
      getUser: (name) => this._options[name] ?? null,
      getMember: (name) => this._options[name] ?? null,
      getChannel: (name) => this._options[name] ?? null,
      getRole: (name) => this._options[name] ?? null,
      getSubcommand: () => this._subcommand,
    };
  }

  async reply(content) {
    if (this.replied || this.deferred) {
      throw new Error(
        "MockInteraction: reply() called after the interaction was already replied to or deferred " +
          "(this mirrors discord.js's real InteractionAlreadyReplied error)."
      );
    }
    const payload = typeof content === "string" ? { content } : content;
    this.replied = true;
    this.replies.push(payload);
    return payload;
  }

  async deferReply(opts = {}) {
    this.deferred = true;
    this.ephemeralOnDefer = !!opts.ephemeral;
  }

  async editReply(content) {
    const payload = typeof content === "string" ? { content } : content;
    // editReply works whether you deferred or already replied
    this.replies.push({ ...payload, _edited: true });
    this.replied = true;
    return payload;
  }

  async followUp(content) {
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
