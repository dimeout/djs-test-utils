import type {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsString,
  Role,
  TextChannel,
  Message,
  User,
  PermissionsBitField,
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

type _UserId = Extends<MockUser["id"], User["id"]>;
type _UserTag = Extends<MockUser["tag"], User["tag"]>;
type _MemberUser = Extends<MockMember["user"], GuildMember["user"]>;
type _MemberRoles = Extends<MockMember["roles"], GuildMember["roles"]>;
type _RolePermissions = Extends<MockRole["permissions"], PermissionsBitField>;
type _ChannelSend = Extends<MockChannel["send"], TextChannel["send"]>;
type _MessageReply = Extends<MockMessage["reply"], Message["reply"]>;
type _InteractionReply = Extends<
  MockInteraction["reply"],
  ChatInputCommandInteraction["reply"]
>;
type _InteractionOptions = Extends<
  MockInteraction["options"],
  ChatInputCommandInteraction["options"]
>;
type _PermissionsShape = Extends<
  MockPermissions["has"],
  PermissionsBitField["has"]
>;
type _PermissionNamesCompatible = Extends<PermissionFlag, PermissionsString>;

declare const never: never;
export const _types = never;
