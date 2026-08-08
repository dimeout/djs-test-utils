import { describe, expect, it } from "vitest";
import {
  MockButtonInteraction,
  expectSentTo,
  mockChannel,
  mockMessage,
  mockUser,
} from "djs-test-utils";
import {
  collectReactions,
  waitForConfirmButton,
  waitForConfirmation,
} from "./collectors.js";

describe("collector handler examples", () => {
  it("waitForConfirmation resolves with the first matching reply", async () => {
    const channel = mockChannel();
    const author = mockUser({ username: "asker" });
    const otherUser = mockUser({ username: "someone-else" });

    const promise = waitForConfirmation(channel, author);

    // Confirm the prompt was sent.
    expectSentTo(channel, "Are you sure?");

    // Emit replies: the first from another user (filtered out), the second
    // from our `author` saying "yes".
    channel.emit(
      "messageCreate",
      mockMessage({ content: "yes", author: otherUser }),
    );
    channel.emit("messageCreate", mockMessage({ content: "yes", author }));

    expect(await promise).toBe(true);
  });

  it("waitForConfirmation resolves to false when the user says no", async () => {
    const channel = mockChannel();
    const author = mockUser({ username: "asker" });
    const promise = waitForConfirmation(channel, author);

    channel.emit("messageCreate", mockMessage({ content: "no", author }));

    expect(await promise).toBe(false);
  });

  it("waitForConfirmButton resolves with the matching button interaction", async () => {
    const message = mockMessage();
    const promise = waitForConfirmButton(message);

    message.emit(
      "interactionCreate",
      new MockButtonInteraction({ customId: "cancel" }),
    );
    message.emit(
      "interactionCreate",
      new MockButtonInteraction({ customId: "confirm" }),
    );

    const interaction = await promise;
    expect(interaction.customId).toBe("confirm");
    expect(interaction.isButton()).toBe(true);
  });

  it("collectReactions tallies (reaction, user) pairs up to max", async () => {
    const message = mockMessage();
    const promise = collectReactions(message, 3);

    message.emit(
      "messageReactionAdd",
      { emoji: { name: "👍" } },
      mockUser({ id: "u1" }),
    );
    message.emit(
      "messageReactionAdd",
      { emoji: { name: "🔥" } },
      mockUser({ id: "u2" }),
    );
    message.emit(
      "messageReactionAdd",
      { emoji: { name: "👍" } },
      mockUser({ id: "u3" }),
    );

    const tally = await promise;
    expect(tally).toEqual({ "👍": 2, "🔥": 1 });
  });
});
