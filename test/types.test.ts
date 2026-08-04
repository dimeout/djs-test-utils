import type {
  CommandInteraction,
  GuildMember,
  Role,
  TextChannel,
  Message,
  User,
} from "discord.js";
import type {
  MockInteraction,
  MockMember,
  MockPermissions,
  MockRole,
  MockChannel,
  MockMessage,
  MockUser,
  PermissionFlag,
} from "../index.js";

type Extends<A, B> = A extends B ? true : false;

type DiscordModule = typeof import("discord.js");

type ExportedInstance<Name extends string, Fallback> =
  DiscordModule extends Record<Name, infer U>
    ? U extends new (...args: any[]) => infer I
      ? I
      : U
    : Fallback;

type DiscordChatInputInteraction = ExportedInstance<
  "ChatInputCommandInteraction",
  CommandInteraction
>;

type DiscordPermissions =
  ExportedInstance<"PermissionsBitField", unknown> extends infer P
    ? P extends { has(...args: any[]): any }
      ? P
      : ExportedInstance<"Permissions", unknown>
    : ExportedInstance<"Permissions", unknown>;

type DiscordPermissionNameUnion = DiscordModule extends {
  PermissionsString: infer U;
}
  ? U
  : DiscordModule extends { PermissionString: infer U }
    ? U
    : string;

type _UserId = Extends<MockUser["id"], User["id"]>;
type _UserTag = Extends<MockUser["tag"], User["tag"]>;
type _MemberUser = Extends<MockMember["user"], GuildMember["user"]>;
type _MemberRoles = Extends<MockMember["roles"], GuildMember["roles"]>;
type _RolePermissions = Extends<MockRole["permissions"], DiscordPermissions>;
type _ChannelSend = Extends<MockChannel["send"], TextChannel["send"]>;
type _MessageReply = Extends<MockMessage["reply"], Message["reply"]>;
type _InteractionReply = Extends<
  MockInteraction["reply"],
  DiscordChatInputInteraction extends { reply: infer R } ? R : never
>;
type _InteractionOptions = Extends<
  MockInteraction["options"],
  DiscordChatInputInteraction extends { options: infer O } ? O : never
>;
type _PermissionsShape = Extends<
  MockPermissions["has"],
  DiscordPermissions extends { has: infer H } ? H : never
>;
type _PermissionNamesCompatible = Extends<
  PermissionFlag,
  DiscordPermissionNameUnion
>;

const never = undefined as never;
export const _types = never;
