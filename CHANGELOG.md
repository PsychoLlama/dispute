# Changelog
`dispute` follows [this changelog style](https://keepachangelog.com/en/1.0.0/) and adheres to [semver](https://semver.org/).

## `0.5.1`
### Changed
- Dropped engine version requirement to node `>=8`. The transitive dependency
  `execa` forced an update, but the dependent libraries are only used in
  development.

## `0.5.0`
### Removed
- Dropped support for non-LTS node versions (v7 and older). Upgrade to Node
  `v8.12.0` or later.

### Removed
- Flow types no longer ship with this library.

### Added
- Now ships with TypeScript definitions.

## `0.4.0`
### Added
- Support for programmatic API generation using `.createApi()` (experimental feature).

### Changed
- Dispute will throw an error if you try to define the same flag twice in the same command.

### Removed
- Dropped support for `=` in shorthand flags (e.g. `-qvp=8080` instead of `-qvp 8080`). This only affects short flags.

## `0.3.0`
### Added
- Support for command & option descriptions.
- Proper documentation (in readme).

### Changed
- Refined help output looks closer to something docker would generate (I really like their help format).
- `createCli(...)` now throws if an empty command object is given (i.e. missing both `command` and `subCommand` values).

## `0.2.0`
### Added
- New `ExitCode(...)` class takes the role of `FatalError(...)` without requiring a log message.
- New help page generator inspired by commander's help output. Runs through global flag `--help`.
- New `--version` global flag prints the package's version.

### Changed
- Now `cli.execute(...)` rejects when commands fail instead of just returning the errors.

### Removed
- Old `FatalError` class. Use `ExitCode` instead.

## `0.1.2`
### Fixed
- Fixes the `.command(...)` Flow type by loosening type constraints. Any command that accepted arguments or options was affected.

## `0.1.1`
### Fixed
- Compiled assets never made it to npm. Requiring the module resulted in not found errors.

## `0.1.0`
Initial release
