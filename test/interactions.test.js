import { describe, it, expect } from "vitest";
import {
  MockAutocompleteInteraction,
  MockButtonInteraction,
  MockInteraction,
  MockMessageContextMenuInteraction,
  MockModalSubmitInteraction,
  MockSelectMenuInteraction,
  MockUserContextMenuInteraction,
  expectAutocompleteChoices,
  expectEmbedDescription,
  expectEmbedField,
  expectEmbedTitle,
  expectReplyEmbed,
  mockChannel,
  mockClient,
  mockEmbed,
  mockGuild,
  mockMessage,
  mockThread,
  mockUser,
  resetAllMocks,
} from "../src/index.js";

describe("Mock component interactions", () => {
  it("supports button interactions with customId and update lifecycle", async () => {
    const interaction = new MockButtonInteraction({
      customId: "confirm-delete",
    });

    expect(interaction.isButton()).toBe(true);
    expect(interaction.isChatInputCommand()).toBe(false);
    expect(interaction.customId).toBe("confirm-delete");

    await interaction.reply({ content: "Button clicked" });
    expect(interaction.replies[0].content).toBe("Button clicked");

    await interaction.update({ content: "Button updated" });
    expect(interaction.updates[0].content).toBe("Button updated");

    await interaction.deferUpdate();
    expect(interaction.updateDeferred).toBe(true);
  });

  it("supports select menu interactions with values", async () => {
    const interaction = new MockSelectMenuInteraction({
      values: ["opt1", "opt2"],
    });

    expect(interaction.isStringSelectMenu()).toBe(true);
    expect(interaction.values).toEqual(["opt1", "opt2"]);

    await interaction.reply({ content: "Selected" });
    expect(interaction.lastReplyContent).toBe("Selected");
  });

  it("supports modal submit interactions with text input values", () => {
    const interaction = new MockModalSubmitInteraction({
      fields: { reason: "yes" },
    });

    expect(interaction.isModalSubmit()).toBe(true);
    expect(interaction.fields.getTextInputValue("reason")).toBe("yes");
    expect(interaction.fields.getTextInputValue("other")).toBeNull();
  });
});

describe("Autocomplete support", () => {
  it("captures focused values and responded autocomplete choices", async () => {
    const interaction = new MockAutocompleteInteraction({
      commandName: "autocomplete",
      options: { focused: "app" },
    });
    const choices = [
      { name: "apple", value: "apple" },
      { name: "banana", value: "banana" },
    ];

    expect(interaction.isAutocomplete()).toBe(true);
    expect(interaction.options.getFocused()).toBe("app");

    await interaction.respond(choices);
    expectAutocompleteChoices(interaction, choices);
  });
});

describe("Context menu interactions", () => {
  it("supports user context menu target data", () => {
    const target = mockUser({ id: "42", username: "target" });
    const interaction = new MockUserContextMenuInteraction({
      targetUser: target,
    });

    expect(interaction.isUserContextMenuCommand()).toBe(true);
    expect(interaction.targetUser).toBe(target);
    expect(interaction.targetId).toBe("42");
    expect(interaction.options.getUser("target")).toBe(target);
  });

  it("supports message context menu target data", () => {
    const targetMessage = mockMessage({ id: "99", content: "inspect me" });
    const interaction = new MockMessageContextMenuInteraction({
      targetMessage,
    });

    expect(interaction.isMessageContextMenuCommand()).toBe(true);
    expect(interaction.targetMessage).toBe(targetMessage);
    expect(interaction.targetId).toBe("99");
  });
});

describe("Embed helper assertions", () => {
  it("constructs and asserts on embed content", () => {
    const embed = mockEmbed({
      title: "Hello",
      description: "World",
      color: 0xff0000,
      fields: [{ name: "field1", value: "value1" }],
    });

    expect(embed.title).toBe("Hello");
    expect(embed.description).toBe("World");
    expect(embed.color).toBe(0xff0000);

    expectEmbedTitle(embed, "Hello");
    expectEmbedDescription(embed, "World");
    expectEmbedField(embed, "field1", "value1");
  });

  it("asserts partial embed matches from replies", async () => {
    const interaction = new MockInteraction({ commandName: "embed" });
    await interaction.reply({
      embeds: [
        mockEmbed({
          title: "Status",
          fields: [{ name: "state", value: "ok" }],
        }),
      ],
    });

    const embed = expectReplyEmbed(interaction, {
      title: "Status",
      fields: [{ name: "state" }],
    });

    expect(embed).toEqual({
      title: "Status",
      description: null,
      color: null,
      fields: [{ name: "state", value: "ok" }],
    });
  });

  it("fails when embed field is missing", () => {
    const embed = mockEmbed({ fields: [{ name: "a", value: "b" }] });

    expect(() => expectEmbedField(embed, "missing")).toThrow(
      /Expected embed to contain a field named "missing"/,
    );
  });
});

describe("Error simulation", () => {
  it("throws DiscordAPIError-shaped errors from replies", async () => {
    const interaction = new MockInteraction({
      commandName: "fail",
      throwOnReply: { code: 50013 },
    });

    await expect(interaction.reply("nope")).rejects.toMatchObject({
      name: "DiscordAPIError",
      code: 50013,
    });
  });

  it("throws DiscordAPIError-shaped errors from channel sends", async () => {
    const channel = mockChannel({ throwOnSend: { code: 10008 } });

    await expect(channel.send("gone")).rejects.toMatchObject({
      name: "DiscordAPIError",
      code: 10008,
    });
  });
});

describe("Cache, thread, and reset helpers", () => {
  it("supports mock client and async guild/channel caches", async () => {
    const channel = mockChannel({ id: "channel-1" });
    const member = { id: "member-1" };
    const guild = mockGuild({
      id: "guild-1",
      members: new Map([["member-1", member]]),
      channels: new Map([[channel.id, channel]]),
    });
    const client = mockClient({
      guilds: new Map([[guild.id, guild]]),
      channels: new Map([[channel.id, channel]]),
    });

    expect(await client.guilds.fetch("guild-1")).toBe(guild);
    expect(await guild.members.fetch("member-1")).toBe(member);
    expect(await guild.channels.fetch("channel-1")).toBe(channel);
  });

  it("creates and archives mock threads", async () => {
    const channel = mockChannel();
    const thread = await channel.threads.create({ name: "case-notes" });

    expect(thread.name).toBe("case-notes");
    expect(await channel.threads.fetch(thread.id)).toBe(thread);

    await thread.send("hello thread");
    expect(thread.sent).toEqual([{ content: "hello thread" }]);

    await thread.setArchived(true);
    expect(thread.archived).toBe(true);

    const standalone = mockThread();
    expect(standalone.archived).toBe(false);
  });

  it("clears captured mock state with resetAllMocks", async () => {
    const interaction = new MockInteraction({ commandName: "reset" });
    const channel = mockChannel();

    await interaction.reply("hello");
    await channel.send("world");

    resetAllMocks();

    expect(interaction.replies).toEqual([]);
    expect(channel.sent).toEqual([]);
    expect(interaction.replied).toBe(false);
  });
});

