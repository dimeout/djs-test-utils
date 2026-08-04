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
- `MockButtonInteraction`, `MockSelectMenuInteraction`, and `MockModalSubmitInteraction` cover component/modal interactions
- Autocomplete support via `interaction.respond(choices)` and response assertions
- `mockEmbed()` plus embed assertions for rich message replies
- `createMockBot()` builds a connected mock client/guild/member/channel suite
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

## Component and modal interactions

The package also exports dedicated mocks for component and modal events:

```js
import {
  MockButtonInteraction,
  MockSelectMenuInteraction,
  MockModalSubmitInteraction,
} from "djs-test-utils";

const button = new MockButtonInteraction({ customId: "confirm" });
const select = new MockSelectMenuInteraction({ values: ["opt1", "opt2"] });
const modal = new MockModalSubmitInteraction({ fields: { reason: "yes" } });
```

These support the common discord.js predicates and payloads:

- `isButton()`
- `isStringSelectMenu()` and `values`
- `isModalSubmit()` and `fields.getTextInputValue()`

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
const replyEmbed = expectReplyEmbed(interaction);
expectEmbedTitle(replyEmbed, "Hello");
expectEmbedField(replyEmbed, "reason", "Testing");
```

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
relies on more advanced Discord features (threads, voice, stickers, forums,
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

See `examples/commands.js` and `test/commands.test.js` for a full worked example.

## License

MIT
