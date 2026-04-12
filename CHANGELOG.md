# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Daml Script tests for registration, resolution, and transfer workflows.
- GitHub Actions CI workflow to build and test the Daml models on every push.

### Changed
- Refactored `CNS.Resolution` to use a non-consuming choice for more efficient lookups where a long-lived permission grant is not required.

## [0.1.0] - 2024-05-21

### Added
- **Core Daml Models**:
    - `CNS.NameRecord`: The primary smart contract representing a registered name. It stores the name, its owner, the associated Party ID it resolves to, and an optional list of controllers.
    - `Register` choice on a `Registry` contract (to be implemented) to create new name records, ensuring name uniqueness at the registry level.
- **Ownership Transfer**:
    - `CNS.Transfer`: A secure, two-phase proposal/accept pattern for transferring ownership of a `NameRecord`. The `Transfer_Request` contract ensures atomicity and consent from both parties.
- **Privacy-Preserving Resolution**:
    - `CNS.Resolution`: Defines the `ResolutionRequest` and `ResolutionResponse` workflow. This allows name owners to grant specific parties temporary, auditable permission to resolve a name to its underlying Party ID, without revealing the name's existence to anyone else on the network.
- **Documentation**:
    - `docs/PRIVACY_MODEL.md`: A detailed document explaining how CNS leverages Canton's underlying privacy model. It contrasts the CNS approach with public, transparent name registries like ENS on Ethereum.
- **Frontend Integration**:
    - `frontend/src/NameSearch.tsx`: An initial React component demonstrating how a dApp can integrate with CNS to resolve names for its users.
- **Project Scaffolding**:
    - Initial `daml.yaml` for the Daml model package.
    - Basic DPM project structure.