# Changelog — Canton Name Service

## [0.3.0] — 2026-04-03

### Added
- `NameRecord.daml` — key-based lookup + renewal + `UpdatePartyId` choice
- `Resolution.daml` — privacy-preserving two-step resolution flow
- `Transfer.daml` — atomic ownership transfer with lock-up
- `Subdomain.daml` — hierarchical `sub.name.canton` delegation
- `CNSTest.daml` — full lifecycle tests (register, resolve, transfer)
- TypeScript resolver + registrar SDK (`sdk/src/`)
- React `NameSearch` UI component
- CI pipeline (build, test, SDK typecheck)
- Integration guide and privacy model documentation

## [0.2.0] — 2026-03-24

### Added
- `Registry.daml` — root CNS authority registry
- `daml.yaml` project manifest, `.gitignore`

## [0.1.0] — 2026-03-18

### Added
- Initial project scaffolding and README
