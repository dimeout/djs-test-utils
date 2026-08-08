import { describe, expect, it } from "vitest";
import {
  MockAutocompleteInteraction,
  MockButtonInteraction,
  MockModalSubmitInteraction,
  MockSelectMenuInteraction,
  expectAutocompleteChoices,
  expectReplyContains,
  mockChannel,
} from "djs-test-utils";
import {
  handleAnnouncement,
  handleColorSelect,
  handleConfirmButton,
  handleFruitAutocomplete,
  handleReportModal,
} from "./components.js";

describe("component handler examples", () => {
  it("tests a button handler", async () => {
    const interaction = new MockButtonInteraction({
      customId: "confirm-delete",
    });

    await handleConfirmButton(interaction);

    expect(interaction.updates[0]).toEqual({
      content: "Deleted.",
      components: [],
    });
  });

  it("tests a select menu handler", async () => {
    const interaction = new MockSelectMenuInteraction({
      values: ["red", "blue"],
    });

    await handleColorSelect(interaction);

    expectReplyContains(interaction, "red, blue");
  });

  it("tests a modal submit handler", async () => {
    const interaction = new MockModalSubmitInteraction({
      fields: { reason: "spam" },
    });

    await handleReportModal(interaction);

    expectReplyContains(interaction, "spam");
  });

  it("tests an autocomplete handler", async () => {
    const interaction = new MockAutocompleteInteraction({
      options: { focused: "b" },
    });

    await handleFruitAutocomplete(interaction);

    expectAutocompleteChoices(interaction, [
      { name: "banana", value: "banana" },
      { name: "blueberry", value: "blueberry" },
    ]);
  });

  it("tests an error path", async () => {
    const channel = mockChannel({ throwOnSend: { code: 50013 } });

    await expect(handleAnnouncement(channel)).resolves.toBe(
      "missing-permissions",
    );
  });
});

