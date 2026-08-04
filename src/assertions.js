/**
 * Small assertion-style helpers so tests read naturally regardless of which
 * test runner/assertion library the consumer uses (Jest, Vitest, etc.).
 * These throw plain Errors on failure, which every test runner reports fine.
 */

export function expectReplied(interaction) {
  if (!interaction.replied && !interaction.deferred) {
    throw new Error("Expected interaction to have been replied to, but it was not.");
  }
}

export function expectReplyContains(interaction, substring) {
  const content = interaction.lastReplyContent ?? "";
  if (!content.includes(substring)) {
    throw new Error(
      `Expected reply to contain "${substring}", but got: "${content}"`
    );
  }
}

export function expectReplyMatches(interaction, pattern) {
  const content = interaction.lastReplyContent ?? "";
  if (!pattern.test(content)) {
    throw new Error(
      `Expected reply to match ${pattern}, but got: "${content}"`
    );
  }
}

export function expectSentTo(channel, substring) {
  const found = channel.sent.some((m) => (m.content ?? "").includes(substring));
  if (!found) {
    throw new Error(
      `Expected channel.send() to have been called with content containing "${substring}", ` +
        `but sent messages were: ${JSON.stringify(channel.sent)}`
    );
  }
}
