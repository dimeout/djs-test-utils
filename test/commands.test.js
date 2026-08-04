import { describe, it, expect } from "vitest";
import {
  MockInteraction,
  mockUser,
  mockMember,
  mockChannel,
  expectReplyContains,
  expectReplyMatches,
  expectSentTo,
} from "../src/index.js";
import { handleBanCommand, handlePingCommand } from "../examples/commands.js";

describe("handleBanCommand", () => {
  it("refuses to ban when the caller lacks BanMembers permission", async () => {
    const interaction = new MockInteraction({
      commandName: "ban",
      options: { target: mockUser({ username: "baduser" }) },
      member: mockMember({ permissionFlags: [] }), // no permissions
    });

    await handleBanCommand(interaction);

    expectReplyMatches(interaction, /permission/i);
    expect(interaction.replies[0].ephemeral).toBe(true);
  });

  it("bans the target user when the caller has permission", async () => {
    const target = mockUser({ username: "baduser" });
    const interaction = new MockInteraction({
      commandName: "ban",
      options: { target, reason: "spamming" },
      member: mockMember({ permissionFlags: ["BanMembers"] }),
    });

    await handleBanCommand(interaction);

    expectReplyContains(interaction, "Banned baduser");
    expectReplyContains(interaction, "spamming");
  });

  it("errors if no target is provided", async () => {
    const interaction = new MockInteraction({
      commandName: "ban",
      options: {},
      member: mockMember({ permissionFlags: ["BanMembers"] }),
    });

    await handleBanCommand(interaction);

    expectReplyMatches(interaction, /must specify/i);
  });
});

describe("handlePingCommand", () => {
  it("defers then edits the reply with Pong!", async () => {
    const interaction = new MockInteraction({ commandName: "ping" });

    await handlePingCommand(interaction);

    expect(interaction.deferred).toBe(true);
    expectReplyContains(interaction, "Pong!");
  });
});

describe("mockChannel", () => {
  it("captures messages sent via channel.send()", async () => {
    const channel = mockChannel();
    await channel.send("hello world");

    expectSentTo(channel, "hello world");
  });
});
