import { describe, it, expect } from "vitest";
import {
  MockButtonInteraction,
  MockSelectMenuInteraction,
  MockModalSubmitInteraction,
  MockInteraction,
  mockEmbed,
  expectReplyEmbed,
  expectEmbedTitle,
  expectEmbedDescription,
  expectEmbedField,
  expectAutocompleteChoices,
} from "../src/index.js";

describe("Mock component interactions", () => {
  it("supports button interactions with customId", async () => {
    const interaction = new MockButtonInteraction({
      customId: "confirm-delete",
    });

    expect(interaction.isButton()).toBe(true);
    expect(interaction.isChatInputCommand()).toBe(false);
    expect(interaction.customId).toBe("confirm-delete");

    await interaction.reply({ content: "Button clicked" });
    expect(interaction.replies[0].content).toBe("Button clicked");
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

  it("supports modal submit interactions with text input values", async () => {
    const interaction = new MockModalSubmitInteraction({
      fields: { reason: "yes" },
    });

    expect(interaction.isModalSubmit()).toBe(true);
    expect(interaction.fields.getTextInputValue("reason")).toBe("yes");
    expect(interaction.fields.getTextInputValue("other")).toBeNull();
  });
});

describe("Autocomplete support", () => {
  it("captures responded autocomplete choices", async () => {
    const interaction = new MockInteraction({ commandName: "autocomplete" });
    const choices = [
      { name: "apple", value: "apple" },
      { name: "banana", value: "banana" },
    ];

    await interaction.respond(choices);
    expectAutocompleteChoices(interaction, choices);
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

  it("fails when embed field is missing", () => {
    const embed = mockEmbed({ fields: [{ name: "a", value: "b" }] });

    expect(() => expectEmbedField(embed, "missing")).toThrow(
      /Expected embed to contain a field named "missing"/,
    );
  });
});
