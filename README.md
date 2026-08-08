# djs-test-utils

Lightweight mock harness for **unit testing discord.js bots** without connecting
to Discord's gateway or REST API.

Write your bot's handlers the normal way, then run them in isolation with fake
Discord objects and assertion helpers instead of a live bot.

```js
import {
  MockInteraction,
  mockUser,
  mockMember,
  expectReplyContains,
} from "djs-test-utils";
import { handleBanCommand } from "../src/commands/ban.js";

test("bans the target user when caller has permission", async () => {
  const interaction = new MockInteraction({
    commandName: "ban",
    options: { target: mockUser({ username: "baduser" }), reason: "spamming" },
    member: mockMember({ permissionFlags: ["BanMembers"] }),
  });

  await handleBanCommand(interaction);

  expectReplyContains(interaction, "Banned baduser");
});
```

## Install

```bash
npm install --save-dev djs-test-utils
```

`djs-test-utils` is a dev-time helper and works with any test runner:
Vitest, Jest, node:test, ava, etc. The library is framework-agnostic.

> Works with `discord.js` v13, v14, and v15 via peer dependency compatibility.

This package is tested against `discord.js` versions 13, 14, and 15 in CI.

## Highlights

- Shape-compatible mock objects for `Interaction`, `Message`, `User`, `Guild`,
  `GuildMember`, `Channel`, `Role`, and permissions
- `MockInteraction` mimics slash command interactions
- `MockButtonInteraction`, `MockSelectMenuInteraction`, `MockModalSubmitInteraction`,
  `MockAutocompleteInteraction`, and context menu interaction mocks
- Autocomplete support via `interaction.respond(choices)` and response assertions
- `mockEmbed()` plus partial embed assertions for rich message replies
- `mockClient()` and `createMockBot()` build connected mock client/guild/member/channel suites
- Async cache fetches for users, guilds, members, and channels
- Error-path simulation with DiscordAPIError-shaped failures
- Thread mocks with creation, sending, and archiving
- Collector mocks for messages, reactions, and component interactions, with
  `awaitMessages` / `awaitReactions` / `awaitMessageComponent` sugar
- `resetAllMocks()` clears captured replies/sends between tests
- Assertion helpers work without a specific test framework
- Shared runner configs and CLI scaffolding included
- TypeScript-ready with shipped `index.d.ts`

## Usage

```js
import {
  MockInteraction,
  mockMember,
  mockUser,
  expectReplyContains,
} from "djs-test-utils";

const interaction = new MockInteraction({
  commandName: "ban",
  options: { target: mockUser(), reason: "spamming" },
  member: mockMember({ permissionFlags: ["BanMembers"] }),
});

await handleBanCommand(interaction);
expectReplyContains(interaction, "Banned");
```

## TypeScript support

This package ships its own declarations via `index.d.ts`, so TypeScript
projects can import from `djs-test-utils` directly.

## Included exports

| Category | Exports |
| --- | --- |
| Entity factories | `mockUser`, `mockMember`, `mockGuild`, `mockChannel`, `mockThread`, `mockRole`, `mockPermissions`, `mockMessage`, `mockClient` |
| Interactions | `MockInteraction`, `MockButtonInteraction`, `MockSelectMenuInteraction`, `MockModalSubmitInteraction`, `MockAutocompleteInteraction`, `MockUserContextMenuInteraction`, `MockMessageContextMenuInteraction` |
| Collectors | `MockMessageCollector`, `MockReactionCollector`, `MockInteractionCollector`, `MockCollection`, `awaitMessages`, `awaitReactions`, `awaitMessageComponent` |
| Assertions | `expectReplied`, `expectReplyContains`, `expectReplyMatches`, `expectSentTo`, `expectReplyEmbed`, `expectEmbedField`, `expectAutocompleteChoices`, `expectCollected` |
| Embeds and helpers | `mockEmbed`, `createMockBot`, `createDiscordAPIError`, `resetAllMocks` |

You can import the package's shared test runner configs:

```js
import vitestConfig from "djs-test-utils/vitest.config.js";
// or
const jestPreset = require("djs-test-utils/jest-preset.cjs");
```

and use the CLI to scaffold starter tests:

```bash
npx djs-test-utils init src/commands/ban.js
```

## Mock factories

| Function                 | Mock target                                         |
| ------------------------ | --------------------------------------------------- |
| `mockUser(overrides)`    | discord.js `User`                                   |
| `mockMember(overrides)`  | discord.js `GuildMember`                            |
| `mockGuild(overrides)`   | discord.js `Guild`                                  |
| `mockChannel(overrides)` | discord.js `TextChannel` (captures `.send()` calls) |
| `mockThread(overrides)`  | discord.js `ThreadChannel`                          |
| `mockClient(overrides)`  | discord.js `Client` caches and `.fetch()` helpers   |
| `mockRole(overrides)`    | discord.js `Role`                                   |
| `mockMessage(overrides)` | discord.js `Message` (for prefix-command bots)      |
| `mockPermissions(flags)` | discord.js `PermissionsBitField`                    |

Every factory accepts an `overrides` object, so you can specify only the
fields your test cares about.

```js
const admin = mockMember({ permissionFlags: ["Administrator"] });
const regularUser = mockMember();
```

## MockInteraction

`MockInteraction` mimics a `ChatInputCommandInteraction` and supports:

- `interaction.options.getString()`
- `interaction.options.getInteger()`
- `interaction.options.getNumber()`
- `interaction.options.getBoolean()`
- `interaction.options.getUser()`
- `interaction.options.getMember()`
- `interaction.options.getChannel()`
- `interaction.options.getRole()`
- `interaction.options.getSubcommand()`
- `interaction.reply(content)`
- `interaction.deferReply({ ephemeral })`
- `interaction.editReply(content)`
- `interaction.followUp(content)`
- `interaction.respond(choices)` for autocomplete handlers
- `interaction.replies`
- `interaction.followUps`
- `interaction.lastReplyContent`
- `interaction.autocompleteResponses`

```js
const interaction = new MockInteraction({
  commandName: "ban",
  options: { target: mockUser(), reason: "spamming" },
  member: mockMember({ permissionFlags: ["BanMembers"] }),
});
```

Calling `reply()` twice without `deferReply()` first throws, matching
discord.js's real interaction reply behavior.

Replies, follow-ups, updates, and channel sends are stored as plain objects, so
they are friendly to `toMatchSnapshot()` and `JSON.stringify()`.

## Component and modal interactions

The package also exports dedicated mocks for component and modal events:

```js
import {
  MockButtonInteraction,
  MockSelectMenuInteraction,
  MockModalSubmitInteraction,
  MockAutocompleteInteraction,
  MockUserContextMenuInteraction,
  MockMessageContextMenuInteraction,
} from "djs-test-utils";

const button = new MockButtonInteraction({ customId: "confirm" });
const select = new MockSelectMenuInteraction({ values: ["opt1", "opt2"] });
const modal = new MockModalSubmitInteraction({ fields: { reason: "yes" } });
const autocomplete = new MockAutocompleteInteraction({
  options: { focused: "app" },
});
```

These support the common discord.js predicates and payloads:

- `isButton()`
- `update(payload)` and `deferUpdate()`
- `isStringSelectMenu()` and `values`
- `isModalSubmit()` and `fields.getTextInputValue()`
- `isAutocomplete()` and `options.getFocused()`
- `isUserContextMenuCommand()`, `targetUser`, and `targetMember`
- `isMessageContextMenuCommand()` and `targetMessage`

## Embed helpers

Use `mockEmbed()` to build reply embeds and the assertion helpers to verify content:

```js
import {
  mockEmbed,
  expectReplyEmbed,
  expectEmbedTitle,
  expectEmbedDescription,
  expectEmbedField,
} from "djs-test-utils";

const embed = mockEmbed({
  title: "Hello",
  description: "World",
  color: 0xff0000,
  fields: [{ name: "reason", value: "Testing" }],
});

await interaction.reply({ embeds: [embed] });
const replyEmbed = expectReplyEmbed(interaction, { title: "Hello" });
expectEmbedTitle(replyEmbed, "Hello");
expectEmbedField(replyEmbed, "reason", "Testing");
```

`expectReplyEmbed(interaction, matcher)` accepts a partial object matcher and
normalizes both plain embed objects and `EmbedBuilder` instances.

## Autocomplete support

When your autocomplete handler calls `interaction.respond(choices)`, the mock stores the returned choices so you can assert on them later:

```js
await interaction.respond([
  { name: "apple", value: "apple" },
  { name: "banana", value: "banana" },
]);
expectAutocompleteChoices(interaction, [
  { name: "apple", value: "apple" },
  { name: "banana", value: "banana" },
]);
```

## Error-path simulation

Configure mocks to throw DiscordAPIError-shaped errors from methods that would
normally hit Discord:

```js
const interaction = new MockInteraction({
  commandName: "ban",
  throwOnReply: { code: 50013 },
});

await assert.rejects(() => interaction.reply("Nope"), { code: 50013 });

const channel = mockChannel({ throwOnSend: { code: 10008 } });
await assert.rejects(() => channel.send("Gone"), { code: 10008 });
```

You can also set failures after creation:

```js
channel.simulateError("send", { code: 50013 });
interaction.simulateError("followUp", { code: 10062 });
```

Common Discord API codes worth testing:

| Code    | Meaning                                  |
| ------- | ---------------------------------------- |
| `50013` | Missing Permissions                      |
| `10008` | Unknown Message                          |
| `10062` | Unknown Interaction                      |
| `40060` | Interaction has already been acknowledged |

## Client caches and threads

```js
const channel = mockChannel({ id: "announcements" });
const guild = mockGuild({
  channels: new Map([[channel.id, channel]]),
});
const client = mockClient({
  guilds: new Map([[guild.id, guild]]),
  channels: new Map([[channel.id, channel]]),
});

await client.guilds.fetch(guild.id);
await guild.channels.fetch(channel.id);

const thread = await channel.threads.create({ name: "case-notes" });
await thread.send("Added details.");
await thread.setArchived(true);
```

## Collectors

`mockChannel`, `mockMessage`, and `mockClient` are backed by Node's
`EventEmitter`, so you can drive collectors from your tests by manually
emitting fake events — no real Discord gateway required.

The package ships shape-compatible mocks for `MessageCollector`,
`ReactionCollector`, and `InteractionCollector`, plus the
`awaitMessages` / `awaitReactions` / `awaitMessageComponent` convenience
methods that real bot code typically uses.

```js
import {
  mockChannel,
  mockMessage,
  mockUser,
  expectCollected,
} from "djs-test-utils";

const channel = mockChannel();
const collector = channel.createMessageCollector({
  filter: (message) => message.content === "ping",
  max: 3,
  time: 30_000,
});

channel.emit("messageCreate", mockMessage({ content: "ping" }));
channel.emit("messageCreate", mockMessage({ content: "pong" })); // filtered
channel.emit("messageCreate", mockMessage({ content: "ping" }));

expectCollected(collector, 2);                       // exact count
expectCollected(collector, { content: "ping" });     // partial match
expectCollected(collector, (m) => m.content === "ping"); // predicate
```

Each collector supports:

- `filter(item, ...)` — predicate run before recording
- `max` — stop after N collected items (reason `"limit"`)
- `time` — stop after N ms (reason `"time"`)
- `idle` — stop after N ms with no new items (reason `"idle"`, resets on
  every collect)
- `collector.collected` — a `MockCollection` (Map + `.first()`, `.last()`,
  `.map()`, `.filter()`, `.find()`, `.random()`, etc.)
- `collector.stop(reason)` — manual early stop
- `'collect'` and `'end'` events

Use the promise-based sugar for the common case:

```js
const collected = await channel.awaitMessages({
  max: 1,
  filter: (m) => m.content === "yes",
  time: 30_000,
});
if (collected.first()?.content === "yes") {
  // confirmed
}
```

`awaitMessageComponent` resolves with a single interaction (matching
discord.js's `max: 1` default) and supports the same `componentType`
filter as the real collector:

```js
const interaction = await message.awaitMessageComponent({
  componentType: "BUTTON",
  filter: (i) => i.customId === "confirm",
  time: 30_000,
});
```

> Collectors are time-based. With **Vitest**, use
> `vi.useFakeTimers()` + `vi.advanceTimersByTime()` to control the clock
> deterministically. With real timers, just `await` the promise.

`expectCollected(collector, matcher)` accepts a number (exact count), a
partial object (matched against each collected item), or a predicate
function.

## createMockBot()

`createMockBot()` scaffolds a small test harness with connected mock objects:

```js
import { createMockBot, mockUser } from "djs-test-utils";

const bot = createMockBot({
  replyErrorProbability: 0.05,
  defaultInteractionOptions: { reason: "testing" },
});

const interaction = bot.createCommandInteraction("ban", {
  target: mockUser({ username: "baduser" }),
});
```

It returns:

- `client`
- `user`
- `guild`
- `member`
- `channel`
- `createInteraction`
- `createCommandInteraction`

Interactions created by `createMockBot()` include `interaction.client`, so code
that reaches through client caches can be tested without extra wiring.

## Assertion helpers

Use built-in helpers or your own assertions against the mock outputs:

```js
import {
  expectReplied,
  expectReplyContains,
  expectReplyMatches,
  expectSentTo,
} from "djs-test-utils";

expectReplied(interaction);
expectReplyContains(interaction, "Banned");
expectReplyMatches(interaction, /banned/i);
expectSentTo(channel, "Welcome!");
```

These helpers throw plain `Error`s, so they work with any test framework.

Use `resetAllMocks()` in runner hooks if you reuse mocks between tests:

```js
afterEach(() => resetAllMocks());
```

## Testing prefix-command bots

For bots that parse `message.content` instead of slash commands, use
`mockMessage()`:

```js
import { mockMessage } from "djs-test-utils";

const message = mockMessage({ content: "!ping" });
await handleMessage(message);
expect(message.replies[0].content).toBe("Pong!");
```

## Limitations

This is a **shape-compatible mock**, not a full discord.js reimplementation.
It covers the objects and methods most bot handlers actually use. If your bot
relies on more advanced Discord features (voice, stickers, forums, sharding,
etc.), you may need to extend the mocks yourself.

Treat these mocks as a fast, first-line test harness rather than a complete
replacement for occasional integration tests against a real bot.

## Development

```bash
npm install
npm test
npm run test:watch
npm run typecheck
npm run test:ci
```

See `examples/commands.js`, `examples/components.js`, `examples/collectors.js`,
and `test/` for worked
examples.

## License

MIT
