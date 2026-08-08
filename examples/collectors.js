// Example handlers using discord.js collectors / `awaitMessages` /
// `awaitMessageComponent`. These are written the same way they'd be written
// in a real bot, with zero awareness that they're being tested with mocks.

const CONFIRM_TIMEOUT_MS = 30_000;

/**
 * Reply to a command asking the user for a confirmation. Resolves with the
 * collected confirm message, or `null` on timeout.
 *
 * @param {{ createMessageCollector: Function, channel: { send: Function } }} channel
 * @param {{ username: string }} author
 */
export async function waitForConfirmation(channel, author) {
  await channel.send("Are you sure? (yes/no)");

  const collected = await channel.awaitMessages({
    max: 1,
    time: CONFIRM_TIMEOUT_MS,
    filter: (message) => message.author.username === author.username,
  });

  const first = collected.first();
  if (!first) return null;
  return first.content === "yes";
}

/**
 * Wait for a confirmation button click on a confirmation message.
 *
 * @param {any} message - a `mockMessage()` (or any EventEmitter that
 *   emits `interactionCreate`).
 */
export async function waitForConfirmButton(message) {
  const interaction = await message.awaitMessageComponent({
    componentType: "BUTTON",
    filter: (i) => i.customId === "confirm",
    time: 30_000,
  });
  return interaction;
}

/**
 * Run a poll: collect up to N reactions and tally them up.
 *
 * @param {any} message - a `mockMessage()` that emits `messageReactionAdd`.
 * @param {number} expected
 */
export async function collectReactions(message, expected) {
  return new Promise((resolve, reject) => {
    const collector = message.createReactionCollector({
      max: expected,
      time: 60_000,
      filter: () => true,
    });

    /** @type {Record<string, number>} */
    const tally = {};
    collector.on("collect", ({ reaction, user }) => {
      const name = reaction?.emoji?.name ?? "?";
      tally[name] = (tally[name] ?? 0) + 1;
    });
    collector.on("end", () => resolve(tally));
    // Re-throw collector errors so callers can handle them.
    collector.on("error", reject);
  });
}
