// @ts-check
import {
  mockUser,
  mockGuild,
  mockChannel,
  mockMember,
  mockMessage,
} from "./entities.js";
import {
  maybeThrowConfiguredError,
  normalizePayload,
  registerReset,
} from "./utils.js";

class MockRepliableInteraction {
  /**
   * @param {Partial<import("../index.js").MockInteractionOptions> & { interactionType?: string }} [options]
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
      client,
      customId = null,
      simulateRateLimit = false,
      interactionType = "chatInput",
      throwOnReply,
      throwOnEditReply,
      throwOnFollowUp,
      throwOnUpdate,
      throwOnDeferReply,
      throwOnDeferUpdate,
      throwOnRespond,
    } = options;

    this.commandName = commandName;
    this.customId = customId;
    this.user = user ?? mockUser();
    this.guild = guild ?? mockGuild();
    this.channel = channel ?? mockChannel();
    this.member = member ?? mockMember({ user: this.user });
    this.client =
      client ??
      /** @type {import("../index.js").MockClient} */ ({
        user: mockUser({ username: "bot", bot: true }),
        users: { cache: new Map([[this.user.id, this.user]]) },
        guilds: { cache: new Map([[this.guild.id, this.guild]]) },
        channels: { cache: new Map([[this.channel.id, this.channel]]) },
      });
    this._interactionType = interactionType;
    this._options = interactionOptions;
    this._subcommand = subcommand;
    this._rateLimitProbability =
      typeof simulateRateLimit === "number"
        ? simulateRateLimit
        : simulateRateLimit
          ? 0.1
          : 0;
    /** @type {Record<string, unknown>} */
    this._errors = {
      reply: throwOnReply,
      editReply: throwOnEditReply,
      followUp: throwOnFollowUp,
      update: throwOnUpdate,
      deferReply: throwOnDeferReply,
      deferUpdate: throwOnDeferUpdate,
      respond: throwOnRespond,
    };

    /** @type {Array<Record<string, unknown>>} */
    this.replies = [];
    /** @type {Array<Record<string, unknown>>} */
    this.followUps = [];
    /** @type {Array<Record<string, unknown>>} */
    this.updates = [];
    /** @type {Array<{ name: string; value: string | number }>} */
    this.autocompleteResponses = [];
    this.replied = false;
    this.deferred = false;
    this.ephemeralOnDefer = false;
    this.updateDeferred = false;

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
      /** @param {boolean} [required] */
      getFocused: (required = false) => {
        const focused =
          this._options.focused ?? this._options.focusedValue ?? null;
        if (focused === null && required) {
          throw new Error("MockAutocompleteInteraction: no focused option.");
        }
        return focused;
      },
      getSubcommand: () => this._subcommand,
    };

    registerReset(() => {
      this.replies.length = 0;
      this.followUps.length = 0;
      this.updates.length = 0;
      this.autocompleteResponses.length = 0;
      this.replied = false;
      this.deferred = false;
      this.ephemeralOnDefer = false;
      this.updateDeferred = false;
    });
  }

  /** @param {string | Record<string, unknown>} errorOrMethod @param {unknown} [error] */
  simulateError(errorOrMethod, error) {
    if (typeof errorOrMethod === "string") {
      this._errors[errorOrMethod] = error ?? { code: 50035 };
    } else {
      this._errors.all = errorOrMethod;
    }
    return this;
  }

  isButton() {
    return this._interactionType === "button";
  }

  isChatInputCommand() {
    return this._interactionType === "chatInput";
  }

  isStringSelectMenu() {
    return this._interactionType === "selectMenu";
  }

  isUserSelectMenu() {
    return this._interactionType === "selectMenu";
  }

  isRoleSelectMenu() {
    return this._interactionType === "selectMenu";
  }

  isChannelSelectMenu() {
    return this._interactionType === "selectMenu";
  }

  isModalSubmit() {
    return this._interactionType === "modalSubmit";
  }

  isAutocomplete() {
    return this._interactionType === "autocomplete";
  }

  isUserContextMenuCommand() {
    return this._interactionType === "userContextMenu";
  }

  isMessageContextMenuCommand() {
    return this._interactionType === "messageContextMenu";
  }

  /** @param {string} method */
  _maybeFail(method) {
    maybeThrowConfiguredError(this._errors, method);
    if (
      this._rateLimitProbability > 0 &&
      Math.random() < this._rateLimitProbability
    ) {
      throw new Error("MockInteraction: simulated rate limit or API failure.");
    }
  }

  /** @param {string | Record<string, unknown>} content */
  async reply(content) {
    this._maybeFail("reply");
    if (this.replied || this.deferred) {
      throw new Error(
        "MockInteraction: reply() called after the interaction was already replied to or deferred " +
          "(this mirrors discord.js's real InteractionAlreadyReplied error).",
      );
    }
    const payload = normalizePayload(content);
    this.replied = true;
    this.replies.push(payload);
    return payload;
  }

  /** @param {{ ephemeral?: boolean }} [opts] */
  async deferReply(opts = {}) {
    this._maybeFail("deferReply");
    this.deferred = true;
    this.ephemeralOnDefer = !!opts.ephemeral;
  }

  /** @param {string | Record<string, unknown>} content */
  async editReply(content) {
    this._maybeFail("editReply");
    const payload = normalizePayload(content);
    this.replies.push(payload);
    this.replied = true;
    return payload;
  }

  /** @param {string | Record<string, unknown>} content */
  async followUp(content) {
    this._maybeFail("followUp");
    const payload = normalizePayload(content);
    this.followUps.push(payload);
    return payload;
  }

  /** @param {string | Record<string, unknown>} content */
  async update(content) {
    this._maybeFail("update");
    const payload = normalizePayload(content);
    this.updates.push(payload);
    this.replied = true;
    return payload;
  }

  async deferUpdate() {
    this._maybeFail("deferUpdate");
    this.deferred = true;
    this.updateDeferred = true;
  }

  /** @param {Array<{ name: string; value: string | number }>} choices */
  async respond(choices) {
    this._maybeFail("respond");
    if (!Array.isArray(choices)) {
      throw new Error("MockInteraction.respond() expects an array of choices.");
    }
    this.autocompleteResponses.push(...choices.map((choice) => ({ ...choice })));
    return choices;
  }

  get lastReplyContent() {
    const last = this.replies[this.replies.length - 1];
    return last?.content ?? null;
  }
}

export class MockInteraction extends MockRepliableInteraction {
  constructor(options = {}) {
    super({ ...options, interactionType: "chatInput" });
  }
}

export class MockButtonInteraction extends MockRepliableInteraction {
  constructor(options = {}) {
    super({ ...options, interactionType: "button" });
  }
}

export class MockSelectMenuInteraction extends MockRepliableInteraction {
  /**
   * @param {Partial<import("../index.js").MockInteractionOptions>} [options]
   */
  constructor(options = {}) {
    super({ ...options, interactionType: "selectMenu" });
    this.values = options.values ?? [];
  }
}

export class MockModalSubmitInteraction extends MockRepliableInteraction {
  /**
   * @param {Partial<import("../index.js").MockInteractionOptions>} [options]
   */
  constructor(options = {}) {
    super({ ...options, interactionType: "modalSubmit" });
    const fieldValues = options.fields ?? {};
    this.fields = {
      /** @param {string} name */
      getTextInputValue: (name) => fieldValues[name] ?? null,
    };
  }
}

export class MockAutocompleteInteraction extends MockRepliableInteraction {
  constructor(options = {}) {
    super({ ...options, interactionType: "autocomplete" });
  }
}

export class MockUserContextMenuInteraction extends MockRepliableInteraction {
  /**
   * @param {Partial<import("../index.js").MockInteractionOptions>} [options]
   */
  constructor(options = {}) {
    const targetUser = options.targetUser ?? mockUser();
    super({
      ...options,
      interactionType: "userContextMenu",
      options: { target: targetUser, ...options.options },
    });
    this.targetUser = targetUser;
    this.targetId = targetUser.id;
    this.targetMember =
      options.targetMember ?? mockMember({ user: this.targetUser });
  }
}

export class MockMessageContextMenuInteraction extends MockRepliableInteraction {
  /**
   * @param {Partial<import("../index.js").MockInteractionOptions>} [options]
   */
  constructor(options = {}) {
    const targetMessage = options.targetMessage ?? mockMessage();
    super({
      ...options,
      interactionType: "messageContextMenu",
      options: { target: targetMessage, ...options.options },
    });
    this.targetMessage = targetMessage;
    this.targetId = targetMessage.id;
  }
}
