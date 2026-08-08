import { describe, it, expect } from "vitest";
import {
  MockButtonInteraction,
  MockInteractionCollector,
  MockMessageCollector,
  MockReactionCollector,
  awaitMessageComponent,
  awaitMessages,
  awaitReactions,
  expectCollected,
  mockChannel,
  mockMessage,
  mockUser,
} from "../src/index.js";

/**
 * Wait one macrotask so collector async bookkeeping (queueMicrotask for
 * `max === 0`) can run before assertions.
 */
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("MockMessageCollector", () => {
  it("collects messages that pass the filter and emits `collect`", async () => {
    const channel = mockChannel();
    const collected = [];

    const collector = channel.createMessageCollector({
      filter: (message) => message.content === "ping",
    });
    collector.on("collect", (m) => collected.push(m));

    channel.emit("messageCreate", mockMessage({ content: "ping" }));
    channel.emit("messageCreate", mockMessage({ content: "pong" }));
    channel.emit("messageCreate", mockMessage({ content: "ping" }));

    expect(collected).toHaveLength(2);
    expect(collected[0].content).toBe("ping");
    expect(collected[1].content).toBe("ping");
    expect(collector.collected.size).toBe(2);
  });

  it("stops when max is reached with reason 'limit'", async () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({
      max: 2,
      filter: () => true,
    });

    const endSpy = [];
    collector.on("end", (collected, reason) => endSpy.push({ size: collected.size, reason }));

    channel.emit("messageCreate", mockMessage({ content: "a" }));
    channel.emit("messageCreate", mockMessage({ content: "b" }));
    channel.emit("messageCreate", mockMessage({ content: "c" })); // ignored - ended

    expect(collector.collected.size).toBe(2);
    expect(endSpy).toEqual([{ size: 2, reason: "limit" }]);
    expect(collector.ended).toBe(true);
  });

  it("ends after the time option elapses with reason 'time'", async () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({
      time: 10,
      filter: () => true,
    });

    const endSpy = [];
    collector.on("end", (_collected, reason) => endSpy.push(reason));

    // No matches yet; wait past `time` (real timers, no fakes).
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(endSpy).toEqual(["time"]);
    expect(collector.ended).toBe(true);
  });

  it("resets the idle timer on every collect", async () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({
      idle: 20,
      filter: () => true,
    });

    const endSpy = [];
    collector.on("end", (_collected, reason) => endSpy.push(reason));

    // Three emits separated by less than `idle` should all collect.
    await new Promise((resolve) => setTimeout(resolve, 10));
    channel.emit("messageCreate", mockMessage({ content: "a" }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    channel.emit("messageCreate", mockMessage({ content: "b" }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    channel.emit("messageCreate", mockMessage({ content: "c" }));

    expect(collector.collected.size).toBe(3);
    expect(collector.ended).toBe(false);

    // Now wait past the idle window without a new event.
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(endSpy).toEqual(["idle"]);
  });

  it("supports manual stop() with a custom reason", () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({ filter: () => true });
    const endSpy = [];
    collector.on("end", (_collected, reason) => endSpy.push(reason));

    channel.emit("messageCreate", mockMessage({ content: "x" }));
    expect(collector.collected.size).toBe(1);

    collector.stop("user");
    expect(endSpy).toEqual(["user"]);
    expect(collector.ended).toBe(true);

    // Subsequent emits should be ignored.
    channel.emit("messageCreate", mockMessage({ content: "y" }));
    expect(collector.collected.size).toBe(1);
  });

  it("does not double-collect messages with the same id", () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({ filter: () => true });

    const msg = mockMessage({ id: "1", content: "hi" });
    channel.emit("messageCreate", msg);
    channel.emit("messageCreate", msg); // dedupe by id
    expect(collector.collected.size).toBe(1);
  });
});

describe("MockReactionCollector", () => {
  it("collects (reaction, user) pairs keyed by user id", () => {
    const message = mockMessage();
    const collector = message.createReactionCollector({ filter: () => true });
    const collected = [];
    collector.on("collect", (entry) => collected.push(entry));

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

    expect(collected).toHaveLength(2);
    expect(collected[0].reaction.emoji.name).toBe("👍");
    expect(collected[0].user.id).toBe("u1");
    expect(collected[1].user.id).toBe("u2");
    expect(collector.collected.size).toBe(2);
  });

  it("ends with reason 'limit' when max is reached", () => {
    const message = mockMessage();
    const collector = message.createReactionCollector({
      max: 1,
      filter: () => true,
    });
    const endSpy = [];
    collector.on("end", (_collected, reason) => endSpy.push(reason));

    message.emit("messageReactionAdd", { emoji: { name: "👍" } }, mockUser());
    message.emit("messageReactionAdd", { emoji: { name: "🔥" } }, mockUser());

    expect(endSpy).toEqual(["limit"]);
  });
});

describe("MockInteractionCollector", () => {
  it("collects interactions matching the componentType filter", () => {
    const channel = mockChannel();
    const collector = new MockInteractionCollector(channel, {
      componentType: "BUTTON",
      filter: (interaction) => interaction.customId === "confirm",
    });

    const collected = [];
    collector.on("collect", (i) => collected.push(i));

    channel.emit(
      "interactionCreate",
      new MockButtonInteraction({ customId: "confirm" }),
    );
    channel.emit(
      "interactionCreate",
      new MockButtonInteraction({ customId: "cancel" }),
    );

    expect(collected).toHaveLength(1);
    expect(collected[0].customId).toBe("confirm");
  });
});

describe("awaitMessages / awaitReactions / awaitMessageComponent sugar", () => {
  it("awaitMessages resolves with the collected map when max is reached", async () => {
    const channel = mockChannel();
    const promise = awaitMessages(channel, {
      max: 2,
      filter: () => true,
    });

    channel.emit("messageCreate", mockMessage({ content: "a" }));
    channel.emit("messageCreate", mockMessage({ content: "b" }));

    const collected = await promise;
    expect(collected.size).toBe(2);
  });

  it("awaitMessages rejects when time elapses before max is reached", async () => {
    const channel = mockChannel();
    const promise = awaitMessages(channel, {
      time: 10,
      max: 5,
      filter: () => true,
    });

    let caught = null;
    promise.catch((err) => {
      caught = err;
    });
    await new Promise((resolve) => setTimeout(resolve, 25));
    // The promise should now be settled (rejected); flush one tick to let
    // the rejection handler run.
    await tick();
    expect(caught).not.toBeNull();
    expect(caught.reason).toBe("time");
    expect(caught.collected.size).toBe(0);
  });

  it("awaitReactions resolves with collected (reaction, user) pairs", async () => {
    const message = mockMessage();
    const promise = awaitReactions(message, {
      max: 1,
      filter: () => true,
    });

    message.emit(
      "messageReactionAdd",
      { emoji: { name: "👍" } },
      mockUser({ id: "u1" }),
    );

    const collected = await promise;
    expect(collected.size).toBe(1);
    const [entry] = Array.from(collected.values());
    expect(entry.user.id).toBe("u1");
  });

  it("awaitMessageComponent resolves with a single interaction matching componentType", async () => {
    const channel = mockChannel();
    const promise = awaitMessageComponent(channel, {
      componentType: "BUTTON",
      filter: (interaction) => interaction.customId === "confirm",
      time: 200,
    });

    channel.emit(
      "interactionCreate",
      new MockButtonInteraction({ customId: "cancel" }),
    );
    channel.emit(
      "interactionCreate",
      new MockButtonInteraction({ customId: "confirm" }),
    );

    const interaction = await promise;
    expect(interaction.customId).toBe("confirm");
  });

  it("awaitMessageComponent rejects on timeout with the collector's collected map", async () => {
    const channel = mockChannel();
    const promise = awaitMessageComponent(channel, { time: 10 });
    let caught = null;
    promise.catch((err) => {
      caught = err;
    });
    await new Promise((resolve) => setTimeout(resolve, 25));
    await tick();
    expect(caught).not.toBeNull();
    expect(caught.reason).toBe("time");
    expect(caught.collected.size).toBe(0);
  });
});

describe("expectCollected assertion helper", () => {
  it("asserts an exact collected count when given a number", () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({
      max: 3,
      filter: () => true,
    });
    channel.emit("messageCreate", mockMessage({ content: "a" }));
    channel.emit("messageCreate", mockMessage({ content: "b" }));
    channel.emit("messageCreate", mockMessage({ content: "c" }));

    expect(() => expectCollected(collector, 3)).not.toThrow();
    expect(() => expectCollected(collector, 2)).toThrow(/3/);
  });

  it("asserts a partial-match object against collected items", () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({
      max: 3,
      filter: () => true,
    });
    channel.emit("messageCreate", mockMessage({ content: "alpha" }));
    channel.emit("messageCreate", mockMessage({ content: "beta" }));
    channel.emit("messageCreate", mockMessage({ content: "gamma" }));

    const matched = expectCollected(collector, { content: "beta" });
    expect(matched).toHaveLength(1);
    expect(matched[0].content).toBe("beta");
  });

  it("supports a predicate matcher", () => {
    const channel = mockChannel();
    const collector = channel.createMessageCollector({
      max: 2,
      filter: () => true,
    });
    channel.emit("messageCreate", mockMessage({ content: "x" }));
    channel.emit("messageCreate", mockMessage({ content: "y" }));

    const matched = expectCollected(
      collector,
      (item) => item.content === "x",
    );
    expect(matched).toHaveLength(1);
  });
});
