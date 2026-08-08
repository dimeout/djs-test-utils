export type PermissionFlag =
  | "AddReactions"
  | "Administrator"
  | "AttachFiles"
  | "BanMembers"
  | "ChangeNickname"
  | "Connect"
  | "CreateInstantInvite"
  | "CreatePrivateThreads"
  | "CreatePublicThreads"
  | "DeafenMembers"
  | "EmbedLinks"
  | "KickMembers"
  | "ManageChannels"
  | "ManageEmojisAndStickers"
  | "ManageGuild"
  | "ManageMessages"
  | "ManageNicknames"
  | "ManageRoles"
  | "ManageThreads"
  | "MentionEveryone"
  | "ModerateMembers"
  | "MoveMembers"
  | "MuteMembers"
  | "PrioritySpeaker"
  | "ReadMessageHistory"
  | "RequestToSpeak"
  | "SendMessages"
  | "SendMessagesInThreads"
  | "SendTTSMessages"
  | "Speak"
  | "Stream"
  | "UseApplicationCommands"
  | "UseEmbeddedActivities"
  | "UseExternalEmojis"
  | "UseExternalStickers"
  | "UseVAD"
  | "ViewChannel"
  | "ViewGuildInsights";

export interface MockPermissions {
  has(flag: PermissionFlag | PermissionFlag[]): boolean;
  toArray(): PermissionFlag[];
  add(flag: PermissionFlag): Set<PermissionFlag>;
  remove(flag: PermissionFlag): boolean;
}

export interface MockUser {
  id: string;
  username: string;
  discriminator: string;
  bot: boolean;
  tag: string;
  toString(): string;
}

export type MockUserOptions = Partial<MockUser>;

export interface MockRole {
  id: string;
  name: string;
  permissions: MockPermissions;
  toString(): string;
}

export interface MockRoleOptions extends Partial<MockRole> {
  permissionFlags?: PermissionFlag[];
}

export interface MockMember {
  id: string;
  user: MockUser;
  nickname: string | null;
  roles: {
    cache: Map<string, MockRole>;
    add(): void;
    remove(): void;
  };
  permissions: MockPermissions;
  kick(): Promise<void>;
  ban(): Promise<void>;
  toString(): string;
}

export type MockMemberOptions = Omit<Partial<MockMember>, "roles"> & {
  user?: MockUser;
  nickname?: string | null;
  roles?: MockRole[];
  permissions?: MockPermissions;
  permissionFlags?: PermissionFlag[];
};

export interface MockChannel {
  id: string;
  name: string;
  type: number;
  sent: Array<MockPayload>;
  send(content: MockReplyContent): Promise<MockMessage>;
  threads: {
    cache: Map<string, MockThread>;
    create(options?: MockThreadOptions): Promise<MockThread>;
    fetch(threadId: string): Promise<MockThread | null>;
  };
  simulateError(method: string, error?: MockDiscordAPIErrorInput): MockChannel;
  simulateError(error: MockDiscordAPIErrorInput): MockChannel;
}

export type MockChannelOptions = Partial<MockChannel> & {
  sent?: Array<MockPayload>;
  throwOnSend?: MockDiscordAPIErrorInput;
};

export interface MockThread {
  id: string;
  name: string;
  type: number;
  sent: Array<MockPayload>;
  send(content: MockReplyContent): Promise<MockMessage>;
  archived: boolean;
  parent: MockChannel | null;
  setArchived(archived?: boolean): Promise<MockThread>;
  simulateError(method: string, error?: MockDiscordAPIErrorInput): MockThread;
  simulateError(error: MockDiscordAPIErrorInput): MockThread;
}

export type MockThreadOptions = Partial<MockThread> & {
  sent?: Array<MockPayload>;
  throwOnSend?: MockDiscordAPIErrorInput;
};

export interface MockGuild {
  id: string;
  name: string;
  ownerId: string;
  members: {
    cache: Map<string, MockMember>;
    fetch(userId: string): Promise<MockMember | null>;
  };
  roles: {
    cache: Map<string, MockRole>;
  };
  channels: {
    cache: Map<string, MockChannel>;
    fetch(channelId: string): Promise<MockChannel | null>;
  };
}

export type MockGuildOptions = Omit<Partial<MockGuild>, "members" | "roles"> & {
  members?: Map<string, MockMember>;
  roles?: MockRole[];
  channels?: Map<string, MockChannel>;
};

export interface MockMessage {
  id: string;
  content: string;
  author: MockUser;
  member: MockMember;
  guild: MockGuild;
  channel: MockChannel;
  replies: Array<MockPayload>;
  mentions: {
    users: Map<string, MockUser>;
    roles: Map<string, MockRole>;
  };
  reply(content: MockReplyContent): Promise<MockMessage>;
  react(): Promise<void>;
}

export type MockMessageOptions = Partial<MockMessage> & {
  author?: MockUser;
  member?: MockMember;
  guild?: MockGuild;
  channel?: MockChannel;
  replies?: Array<MockPayload>;
  mentions?: {
    users: Map<string, MockUser>;
    roles: Map<string, MockRole>;
  };
};

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface MockEmbed {
  title?: string | null;
  description?: string | null;
  color?: number | null;
  fields?: EmbedField[];
}

export interface AutocompleteChoice {
  name: string;
  value: string | number;
}

export type MockReplyContent =
  | string
  | { content?: string; embeds?: MockEmbed[]; embed?: MockEmbed; ephemeral?: boolean }
  | { embeds: MockEmbed[] };

export interface MockPayload {
  content?: string;
  embeds?: MockEmbed[];
  embed?: MockEmbed;
  ephemeral?: boolean;
  [key: string]: unknown;
}

export type MockDiscordAPIErrorInput =
  | Error
  | {
      code?: number;
      message?: string;
      status?: number;
      url?: string;
      rawError?: unknown;
    };

export interface MockClient {
  user: MockUser;
  users: {
    cache: Map<string, MockUser>;
    fetch(userId: string): Promise<MockUser | null>;
  };
  guilds: {
    cache: Map<string, MockGuild>;
    fetch(guildId: string): Promise<MockGuild | null>;
  };
  channels: {
    cache: Map<string, MockChannel>;
    fetch(channelId: string): Promise<MockChannel | null>;
  };
}

export interface MockClientOptions extends Partial<MockClient> {
  user?: MockUser;
  users?: Map<string, MockUser>;
  guilds?: Map<string, MockGuild>;
  channels?: Map<string, MockChannel>;
}

export interface MockInteractionOptions {
  commandName?: string;
  subcommand?: string | null;
  options?: Record<string, unknown>;
  user?: MockUser;
  member?: MockMember;
  guild?: MockGuild;
  channel?: MockChannel;
  client?: MockClient;
  isButtonInteraction?: boolean;
  customId?: string | null;
  values?: string[];
  fields?: Record<string, string>;
  focused?: string | number;
  targetUser?: MockUser;
  targetMember?: MockMember;
  targetMessage?: MockMessage;
  simulateRateLimit?: boolean | number;
  throwOnReply?: MockDiscordAPIErrorInput;
  throwOnEditReply?: MockDiscordAPIErrorInput;
  throwOnFollowUp?: MockDiscordAPIErrorInput;
  throwOnUpdate?: MockDiscordAPIErrorInput;
  throwOnDeferReply?: MockDiscordAPIErrorInput;
  throwOnDeferUpdate?: MockDiscordAPIErrorInput;
  throwOnRespond?: MockDiscordAPIErrorInput;
}

export interface CreateMockBotOptions {
  botUser?: MockUserOptions;
  guild?: MockGuildOptions;
  member?: MockMemberOptions;
  channel?: MockChannelOptions;
  defaultInteractionOptions?: Record<string, unknown>;
  replyErrorProbability?: number;
}

export interface CreateMockBotResult {
  client: {
    user: MockUser;
    users: {
      cache: Map<string, MockUser>;
      fetch(userId: string): Promise<MockUser | null>;
    };
    guilds: {
      cache: Map<string, MockGuild>;
      fetch(guildId: string): Promise<MockGuild | null>;
    };
    channels: {
      cache: Map<string, MockChannel>;
      fetch(channelId: string): Promise<MockChannel | null>;
    };
  };
  user: MockUser;
  guild: MockGuild;
  member: MockMember;
  channel: MockChannel;
  createInteraction(
    overrides?: Partial<MockInteractionOptions>,
  ): MockInteraction;
  createCommandInteraction(
    commandName: string,
    options?: Record<string, unknown>,
  ): MockInteraction;
}

export class MockInteraction {
  constructor(options?: MockInteractionOptions);
  commandName: string;
  customId: string | null;
  isButton(): boolean;
  isChatInputCommand(): boolean;
  isStringSelectMenu(): boolean;
  isUserSelectMenu(): boolean;
  isRoleSelectMenu(): boolean;
  isChannelSelectMenu(): boolean;
  isModalSubmit(): boolean;
  isAutocomplete(): boolean;
  isUserContextMenuCommand(): boolean;
  isMessageContextMenuCommand(): boolean;
  user: MockUser;
  guild: MockGuild;
  channel: MockChannel;
  member: MockMember;
  client: MockClient;
  options: {
    getString(name: string): string | null;
    getInteger(name: string): number | null;
    getNumber(name: string): number | null;
    getBoolean(name: string): boolean | null;
    getUser(name: string): MockUser | null;
    getMember(name: string): MockMember | null;
    getChannel(name: string): MockChannel | null;
    getRole(name: string): MockRole | null;
    getFocused(required?: boolean): string | number | null;
    getSubcommand(): string | null;
  };
  values?: string[];
  fields?: {
    getTextInputValue(name: string): string | null;
  };
  autocompleteResponses: Array<AutocompleteChoice>;
  replies: Array<MockPayload>;
  followUps: Array<MockPayload>;
  updates: Array<MockPayload>;
  replied: boolean;
  deferred: boolean;
  ephemeralOnDefer: boolean;
  updateDeferred: boolean;
  simulateError(method: string, error?: MockDiscordAPIErrorInput): this;
  simulateError(error: MockDiscordAPIErrorInput): this;
  reply(content: MockReplyContent): Promise<MockPayload>;
  deferReply(opts?: { ephemeral?: boolean }): Promise<void>;
  editReply(content: MockReplyContent): Promise<MockPayload>;
  followUp(content: MockReplyContent): Promise<MockPayload>;
  update(content: MockReplyContent): Promise<MockPayload>;
  deferUpdate(): Promise<void>;
  respond(
    choices: Array<AutocompleteChoice>,
  ): Promise<Array<AutocompleteChoice>>;
  readonly lastReplyContent: string | null;
}

export function mockUser(overrides?: MockUserOptions): MockUser;
export function mockRole(overrides?: MockRoleOptions): MockRole;
export function mockPermissions(flags?: PermissionFlag[]): MockPermissions;
export function mockMember(overrides?: MockMemberOptions): MockMember;
export function mockChannel(overrides?: MockChannelOptions): MockChannel;
export function mockGuild(overrides?: MockGuildOptions): MockGuild;
export function mockMessage(overrides?: MockMessageOptions): MockMessage;
export function mockThread(overrides?: MockThreadOptions): MockThread;
export function mockClient(overrides?: MockClientOptions): MockClient;
export function mockEmbed(options?: Partial<MockEmbed>): MockEmbed;
export class MockButtonInteraction extends MockInteraction {}
export class MockSelectMenuInteraction extends MockInteraction {
  values: string[];
}
export class MockModalSubmitInteraction extends MockInteraction {
  fields: {
    getTextInputValue(name: string): string | null;
  };
}
export class MockAutocompleteInteraction extends MockInteraction {}
export class MockUserContextMenuInteraction extends MockInteraction {
  targetUser: MockUser;
  targetMember: MockMember;
  targetId: string;
}
export class MockMessageContextMenuInteraction extends MockInteraction {
  targetMessage: MockMessage;
  targetId: string;
}
export function createMockBot(
  options?: CreateMockBotOptions,
): CreateMockBotResult;
export function createDiscordAPIError(
  error?: MockDiscordAPIErrorInput,
  method?: string,
): Error & { code: number; status?: number; method?: string; url?: string };
export function resetAllMocks(): void;

export function expectReplied(interaction: MockInteraction): void;
export function expectReplyContains(
  interaction: MockInteraction,
  substring: string,
): void;
export function expectReplyMatches(
  interaction: MockInteraction,
  pattern: RegExp,
): void;
export function expectReplyEmbed(
  interaction: MockInteraction,
  matcher?: Partial<MockEmbed> | number,
): MockEmbed;
export function expectEmbedTitle(embed: MockEmbed, title: string): void;
export function expectEmbedDescription(
  embed: MockEmbed,
  description: string,
): void;
export function expectEmbedField(
  embed: MockEmbed,
  name: string,
  value?: string,
): void;
export function expectAutocompleteChoices(
  interaction: MockInteraction,
  expectedChoices: Array<AutocompleteChoice>,
): void;
export function expectSentTo(channel: MockChannel, substring: string): void;
