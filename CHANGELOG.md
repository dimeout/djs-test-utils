# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

