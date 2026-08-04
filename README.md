# djs-test-utils

Lightweight mock harness for **unit testing discord.js bots** without connecting
to Discord's gateway or REST API.

Write your bot's command handlers the normal way, then test them like any
other function — no live bot token, no test server, no network calls.

```js
import { MockInteraction, mockMember, expectReplyContains } from "djs-test-utils";
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

Works with any test runner — Vitest, Jest, node:test, etc. Examples below use
Vitest, but nothing in the library depends on it.

## Why

Testing a discord.js bot normally means running the actual bot, connecting to
Discord, and manually triggering commands in a real server. That's slow, needs
network access, and doesn't fit into CI. This library gives you fake — but
API-shape-compatible — versions of the core discord.js objects
(`Interaction`, `Message`, `User`, `Guild`, `GuildMember`, `Channel`, `Role`)
so your handler code can run in complete isolation.

Your bot code doesn't know it's being tested. If a function takes an
`interaction` and calls `interaction.reply()` or
`interaction.options.getString()`, it'll work the same whether it's real or
mocked.

## What's included

### Entity factories

| Function | Mocks |
|---|---|
| `mockUser(overrides)` | discord.js `User` |
| `mockMember(overrides)` | discord.js `GuildMember` |
| `mockGuild(overrides)` | discord.js `Guild` |
| `mockChannel(overrides)` | discord.js `TextChannel` (captures `.send()` calls) |
| `mockRole(overrides)` | discord.js `Role` |
| `mockMessage(overrides)` | discord.js `Message` (for prefix-command bots) |
| `mockPermissions(flags)` | discord.js `PermissionsBitField` |

Every factory accepts an `overrides` object — anything you pass in wins over
the default, so you only specify what your test actually cares about.

```js
const admin = mockMember({ permissionFlags: ["Administrator"] });
const regularUser = mockMember(); // no special permissions
```

### `MockInteraction`

Mimics a `ChatInputCommandInteraction` (slash command):

```js
const interaction = new MockInteraction({
  commandName: "ban",
  options: { target: mockUser(), reason: "spamming" },
  member: mockMember({ permissionFlags: ["BanMembers"] }),
});
```

Supported on the instance:
- `interaction.options.getString/getInteger/getNumber/getBoolean/getUser/getMember/getChannel/getRole/getSubcommand`
- `interaction.reply(content)`
- `interaction.deferReply({ ephemeral })`
- `interaction.editReply(content)`
- `interaction.followUp(content)`
- `interaction.replies` — array of every reply/editReply payload, in order
- `interaction.followUps` — array of every followUp payload
- `interaction.lastReplyContent` — shortcut for the most recent reply's `content`

Calling `reply()` twice without `deferReply()` first throws, matching
discord.js's real behavior — so a bug where your handler double-replies gets
caught by your tests instead of surfacing in production.

### Assertion helpers

Thin wrappers that throw a plain `Error` on failure, so they work with any
test runner (`expect`, `assert`, or bare `try/catch`):

```js
import { expectReplied, expectReplyContains, expectReplyMatches, expectSentTo } from "djs-test-utils";

expectReplied(interaction);
expectReplyContains(interaction, "Banned");
expectReplyMatches(interaction, /banned/i);
expectSentTo(channel, "Welcome!");
```

You can ignore these entirely and use your test runner's own `expect()`
against `interaction.lastReplyContent` / `interaction.replies` /
`channel.sent` if you prefer.

## Testing prefix-command bots

If your bot still uses `message.content` parsing instead of slash commands,
use `mockMessage()`:

```js
import { mockMessage } from "djs-test-utils";

const message = mockMessage({ content: "!ping" });
await handleMessage(message);

expect(message.replies[0].content).toBe("Pong!");
```

## Limitations

This is a **shape-compatible mock**, not a full reimplementation of
discord.js. It covers the objects and methods most bots actually touch
(interactions, messages, users, members, guilds, channels, roles,
permissions). If your bot uses a more obscure part of the discord.js API
(threads, voice, stickers, forum channels, etc.), you may need to extend the
mocks yourself — PRs adding coverage are welcome.

Because this mocks the *shape* of discord.js rather than talking to the real
library, it's possible (though unlikely for common APIs) for a mock to drift
from what a given discord.js version actually does. Treat these tests as a
fast first line of defense, not a full replacement for occasionally testing
against a real bot in a private server.

## Development

```bash
npm install
npm test        # run once
npm run test:watch
```

See `examples/commands.js` and `test/commands.test.js` for a full worked
example (a `/ban` and `/ping` command tested end-to-end).

## License

MIT
