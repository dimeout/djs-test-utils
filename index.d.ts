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
  sent: Array<{ content?: string }>;
  send(content: string | { content: string }): Promise<MockMessage>;
}

export type MockChannelOptions = Partial<MockChannel> & {
  sent?: Array<{ content?: string }>;
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
}

export type MockGuildOptions = Omit<Partial<MockGuild>, "members" | "roles"> & {
  members?: Map<string, MockMember>;
  roles?: MockRole[];
};

export interface MockMessage {
  id: string;
  content: string;
  author: MockUser;
  member: MockMember;
  guild: MockGuild;
  channel: MockChannel;
  replies: Array<{ content?: string }>;
  mentions: {
    users: Map<string, MockUser>;
    roles: Map<string, MockRole>;
  };
  reply(content: string | { content: string }): Promise<MockMessage>;
  react(): Promise<void>;
}

export type MockMessageOptions = Partial<MockMessage> & {
  author?: MockUser;
  member?: MockMember;
  guild?: MockGuild;
  channel?: MockChannel;
  replies?: Array<{ content?: string }>;
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

export interface MockInteractionOptions {
  commandName: string;
  subcommand?: string | null;
  options?: Record<string, unknown>;
  user?: MockUser;
  member?: MockMember;
  guild?: MockGuild;
  channel?: MockChannel;
  isButtonInteraction?: boolean;
  customId?: string | null;
  values?: string[];
  fields?: Record<string, string>;
  simulateRateLimit?: boolean | number;
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
    guilds: {
      cache: Map<string, MockGuild>;
      fetch(guildId: string): Promise<MockGuild | null>;
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
  isModalSubmit(): boolean;
  user: MockUser;
  guild: MockGuild;
  channel: MockChannel;
  member: MockMember;
  options: {
    getString(name: string): string | null;
    getInteger(name: string): number | null;
    getNumber(name: string): number | null;
    getBoolean(name: string): boolean | null;
    getUser(name: string): MockUser | null;
    getMember(name: string): MockMember | null;
    getChannel(name: string): MockChannel | null;
    getRole(name: string): MockRole | null;
    getSubcommand(): string | null;
  };
  values?: string[];
  fields?: {
    getTextInputValue(name: string): string | null;
  };
  autocompleteResponses: Array<AutocompleteChoice>;
  replies: Array<{ content?: string; embeds?: MockEmbed[]; embed?: MockEmbed }>;
  followUps: Array<{ content?: string }>;
  replied: boolean;
  deferred: boolean;
  ephemeralOnDefer: boolean;
  reply(
    content: string | { content: string } | { embeds: MockEmbed[] },
  ): Promise<{ content?: string; embeds?: MockEmbed[] }>;
  deferReply(opts?: { ephemeral?: boolean }): Promise<void>;
  editReply(
    content: string | { content: string } | { embeds: MockEmbed[] },
  ): Promise<{ content?: string; embeds?: MockEmbed[] }>;
  followUp(
    content: string | { content: string },
  ): Promise<{ content?: string }>;
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
export function mockEmbed(options?: Partial<MockEmbed>): MockEmbed;
export interface MockButtonInteraction extends MockInteraction {}
export interface MockSelectMenuInteraction extends MockInteraction {
  values: string[];
}
export interface MockModalSubmitInteraction extends MockInteraction {
  fields: {
    getTextInputValue(name: string): string | null;
  };
}
export function createMockBot(
  options?: CreateMockBotOptions,
): CreateMockBotResult;

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
  index?: number,
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
