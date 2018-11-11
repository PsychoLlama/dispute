# Changelog
`dispute` follows [this changelog style](https://keepachangelog.com/) and adheres to [semver](https://semver.org/).

## Unreleased
### Added
- Support for programmatic API generation using `.createApi()` (experimental feature).

### Changed
- Dispute will throw an error if you try to define the same flag twice in the same command.

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
