/**
 * Small assertion-style helpers so tests read naturally regardless of which
 * test runner/assertion library the consumer uses (Jest, Vitest, etc.).
 * These throw plain Errors on failure, which every test runner reports fine.
 */

/**
 * @typedef {import("../index.d.ts").MockInteraction} MockInteraction
 */

/**
 * @param {MockInteraction} interaction
 */
export function expectReplied(interaction) {
  if (!interaction.replied && !interaction.deferred) {
    throw new Error(
      "Expected interaction to have been replied to, but it was not.",
    );
  }
}

/**
 * @param {MockInteraction} interaction
 * @param {string} substring
 */
export function expectReplyContains(interaction, substring) {
  const content = interaction.lastReplyContent ?? "";
  if (!content.includes(substring)) {
    throw new Error(
      `Expected reply to contain "${substring}", but got: "${content}"`,
    );
  }
}

/**
 * @param {MockInteraction} interaction
 * @param {RegExp} pattern
 */
export function expectReplyMatches(interaction, pattern) {
  const content = interaction.lastReplyContent ?? "";
  if (!pattern.test(content)) {
    throw new Error(
      `Expected reply to match ${pattern}, but got: "${content}"`,
    );
  }
}

/**
 * @param {import("../index.js").MockChannel} channel
 * @param {string} substring
 */
export function expectSentTo(channel, substring) {
  const found = channel.sent.some(
    /** @param {{content?: string}} m */
    (m) => (m.content ?? "").includes(substring),
  );
  if (!found) {
    throw new Error(
      `Expected channel.send() to have been called with content containing "${substring}", ` +
        `but sent messages were: ${JSON.stringify(channel.sent)}`,
    );
  }
}
