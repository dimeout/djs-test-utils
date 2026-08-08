/**
 * Small assertion-style helpers so tests read naturally regardless of which
 * test runner/assertion library the consumer uses (Jest, Vitest, etc.).
 * These throw plain Errors on failure, which every test runner reports fine.
 */

import { normalizeEmbed } from "./utils.js";

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
 * @param {{ title?: string | null; description?: string | null; color?: number | null; fields?: Array<{ name: string; value: string; inline?: boolean }> }} [options]
 */
export function mockEmbed({
  title = null,
  description = null,
  color = null,
  fields = [],
} = {}) {
  if (!Array.isArray(fields)) {
    throw new Error("mockEmbed() expects fields to be an array.");
  }
  return { title, description, color, fields };
}

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} path
 */
function assertPartialMatch(actual, expected, path) {
  if (expected === undefined) return;
  if (expected === null || typeof expected !== "object") {
    if (actual !== expected) {
      throw new Error(
        `Expected embed ${path} to equal ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}.`,
      );
    }
    return;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      throw new Error(`Expected embed ${path} to be an array.`);
    }
    expected.forEach((item, index) =>
      assertPartialMatch(actual[index], item, `${path}[${index}]`),
    );
    return;
  }

  for (const [key, value] of Object.entries(expected)) {
    assertPartialMatch(
      actual && typeof actual === "object"
        ? /** @type {Record<string, unknown>} */ (actual)[key]
        : undefined,
      value,
      path ? `${path}.${key}` : key,
    );
  }
}

/**
 * @param {MockInteraction} interaction
 * @param {Record<string, unknown> | number} [matcher]
 */
export function expectReplyEmbed(interaction, matcher = {}) {
  const index = typeof matcher === "number" ? matcher : -1;
  const reply =
    index >= 0
      ? interaction.replies[index]
      : interaction.replies[interaction.replies.length - 1];
  if (!reply) {
    throw new Error(
      `Expected reply at index ${index}, but no reply was found.`,
    );
  }

  const embeds = reply.embeds ?? (reply.embed ? [reply.embed] : []);
  if (!Array.isArray(embeds) || embeds.length === 0) {
    throw new Error(`Expected reply at index ${index} to contain an embed.`);
  }

  const embed = normalizeEmbed(embeds[0]);
  if (typeof matcher === "object" && matcher !== null) {
    assertPartialMatch(embed, matcher, "embed");
  }
  return embed;
}

/**
 * @param {{ title?: string | null }} embed
 * @param {string} title
 */
export function expectEmbedTitle(embed, title) {
  if (embed.title !== title) {
    throw new Error(
      `Expected embed title to be "${title}", but got "${embed.title}".`,
    );
  }
}

/**
 * @param {{ description?: string | null }} embed
 * @param {string} description
 */
export function expectEmbedDescription(embed, description) {
  if (embed.description !== description) {
    throw new Error(
      `Expected embed description to be "${description}", but got "${embed.description}".`,
    );
  }
}

/**
 * @param {{ fields?: Array<{ name: string; value: string }> }} embed
 * @param {string} name
 * @param {string} [value]
 */
export function expectEmbedField(embed, name, value) {
  const normalized = /** @type {{ fields?: Array<{ name: string; value: string }> }} */ (
    normalizeEmbed(embed)
  );
  const field = (normalized.fields ?? []).find((field) => field.name === name);
  if (!field) {
    throw new Error(`Expected embed to contain a field named "${name}".`);
  }
  if (value !== undefined && field.value !== value) {
    throw new Error(
      `Expected embed field "${name}" to have value "${value}", but got "${field.value}".`,
    );
  }
}

/**
 * @param {MockInteraction} interaction
 * @param {Array<{ name: string; value: string | number }> } expectedChoices
 */
/**
 * @param {MockInteraction} interaction
 * @param {Array<{ name: string; value: string | number }>} expectedChoices
 */
export function expectAutocompleteChoices(interaction, expectedChoices) {
  const actualChoices = interaction.autocompleteResponses ?? [];
  /** @param {{ name: string; value: string | number }} choice */
  const normalize = (choice) => ({ name: choice.name, value: choice.value });
  const expected = expectedChoices.map(normalize);
  const actual = actualChoices.map(normalize);

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected autocomplete choices ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}.`,
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

/**
 * Assert that a collector's `collected` map contains a specific count of
 * items, or at least one entry matching a partial matcher.
 *
 * - `expectCollected(collector, 3)` asserts `collected.size === 3`.
 * - `expectCollected(collector, (item) => ...)` asserts at least one
 *   collected item satisfies the predicate.
 * - `expectCollected(collector, { content: "hi" })` asserts at least one
 *   collected item has a matching `content` (using the same partial-match
 *   rules as `expectReplyEmbed`).
 *
 * @typedef {import("../index.js").BaseCollectorLike} BaseCollectorLike
 * @typedef {import("../index.js").PartialMatcher} PartialMatcher
 *
 * @param {BaseCollectorLike} collector
 * @param {number | PartialMatcher | ((item: any) => boolean)} matcherOrCount
 * @returns {Array<any>} the matching collected items (or all collected
 *   items, when asserting on count only).
 */
export function expectCollected(collector, matcherOrCount) {
  const collected = Array.from(collector.collected?.values?.() ?? []);

  if (typeof matcherOrCount === "number") {
    if (collected.length !== matcherOrCount) {
      throw new Error(
        `Expected collector to gather ${matcherOrCount} item(s), but got ${collected.length}.`,
      );
    }
    return collected;
  }

  if (typeof matcherOrCount === "function") {
    const matched = collected.filter((item) => matcherOrCount(item));
    if (matched.length === 0) {
      throw new Error(
        `Expected at least one collected item to match the predicate, but none did. ` +
          `Collected: ${JSON.stringify(collected)}`,
      );
    }
    return matched;
  }

  /** @type {PartialMatcher} */
  const matcher = matcherOrCount;
  /** @param {any} item */
  const matches = (item) => {
    if (item === matcher) return true;
    if (matcher === null || typeof matcher !== "object") return false;
    for (const [key, expected] of Object.entries(matcher)) {
      const actual = item?.[key];
      if (
        expected !== null &&
        typeof expected === "object" &&
        !Array.isArray(expected)
      ) {
        if (!matchesForKey(actual, expected)) return false;
        continue;
      }
      if (actual !== expected) return false;
    }
    return true;
  };
  const matched = collected.filter(matches);
  if (matched.length === 0) {
    throw new Error(
      `Expected at least one collected item to match ${JSON.stringify(matcher)}, ` +
        `but none did. Collected: ${JSON.stringify(collected)}`,
    );
  }
  return matched;
}

/**
 * @param {unknown} actual
 * @param {object} expected
 */
function matchesForKey(actual, expected) {
  if (actual === undefined || actual === null) return false;
  if (typeof actual !== "object") return false;
  for (const [k, v] of Object.entries(expected)) {
    const child = /** @type {Record<string, unknown>} */ (actual)[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      if (!matchesForKey(child, /** @type {object} */ (v))) return false;
      continue;
    }
    if (child !== v) return false;
  }
  return true;
}
