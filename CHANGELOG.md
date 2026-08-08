# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `MockMessageCollector`, `MockReactionCollector`, and `MockInteractionCollector`
  classes, mirroring the relevant `discord.js` collectors.
- `MockCollection<K, V>` extending `Map` with the helpers bot code expects
  (`.first()`, `.last()`, `.map()`, `.filter()`, `.find()`, `.random()`, etc.).
- `awaitMessages`, `awaitReactions`, and `awaitMessageComponent` promise-based
  sugar, wired onto `mockChannel()` / `mockMessage()`.
- `channel.createMessageCollector` and `message.createReactionCollector` entry
  points matching the real `discord.js` API.
- `expectCollected(collector, matcherOrCount)` assertion helper supporting
  exact counts, partial object matches, and predicate functions.
- `mockChannel()`, `mockMessage()`, and `mockClient()` are now backed by Node's
  `EventEmitter`, so tests can drive collectors by emitting `messageCreate`,
  `messageReactionAdd`, and `interactionCreate` events manually.
- TypeScript declarations for all new collector exports.
- `examples/collectors.js` and `examples/collector-tests.js` showing realistic
  confirmation-flow handlers driven by `awaitMessages`, `awaitMessageComponent`,
  and `createReactionCollector`.

### Changed

- README adds a "Collectors" section, updates the "Included exports" table, and
  removes "collectors" from the Limitations list (still-open gaps: voice,
  stickers, forums, sharding).

## [1.0.0] - 2026-08-08

### Added

- Component interaction mocks for buttons, select menus, modals, autocomplete,
  user context menus, and message context menus.
- Shared reply/update tracking for interaction mocks, including `update()` and
  `deferUpdate()`.
- Embed helpers with normalized embed handling and partial reply-embed matching.
- DiscordAPIError-shaped failure simulation for interaction replies/updates and
  channel/thread sends.
- `mockClient()` with async users/guilds/channels cache lookups.
- Async guild member and channel fetch helpers.
- `mockThread()` plus thread creation and archiving from `mockChannel()`.
- `resetAllMocks()` for clearing captured reply/send/update state.
- Snapshot-friendly payload normalization for replies, follow-ups, updates, and
  sends.
- TypeScript declarations for the full public API.
- Component, modal, autocomplete, and error-path examples.

### Changed

- Bumped the package to the first stable major release.
- `expectReplyEmbed(interaction, matcher)` now supports a partial object matcher.
  Passing a number still selects a reply index for compatibility.

### Breaking

- `MockInteractionOptions.commandName` is optional in the type declarations so
  non-command interaction mocks can be constructed without command names.
- Reply/send payloads are normalized to plain serializable objects. Custom class
  instances passed inside `embeds` are stored as their JSON/plain-object shape.

