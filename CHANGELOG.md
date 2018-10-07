# Changelog
`dispute` follows [this changelog style](https://keepachangelog.com/)

## `0.1.2`
### Fixed
- Fixes the `.command(...)` Flow type by loosening type constraints. Any command that accepted arguments or options was affected.

## `0.1.1`
### Fixed
- Compiled assets never made it to npm. Requiring the module resulted in not found errors.

## `0.1.0`
Initial release
