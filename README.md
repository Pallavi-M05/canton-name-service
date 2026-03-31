# Canton Name Service (CNS)

A decentralized name registry mapping human-readable identifiers to Canton party IDs within the Canton ecosystem. CNS leverages Canton's native privacy model, ensuring name resolution is only available to authorized parties.

## Overview

CNS provides a decentralized and secure way to map human-readable names (e.g., `alice.cns`) to Canton party identifiers. This simplifies interactions within the Canton network by allowing parties to refer to each other using familiar names instead of complex party IDs.

**Key Features:**

*   **Decentralized Registry:**  Names are registered and managed on-chain via Daml smart contracts, eliminating a central point of failure.
*   **Canton-Native Privacy:**  Resolution of names is controlled by the name owner, adhering to Canton's privacy model. Only authorized parties can resolve a name.
*   **Easy Integration:**  Provides a simple SDK and wrapper for existing applications to integrate CNS with minimal code changes.
*   **ENS Equivalent for Canton:**  Offers similar functionality to Ethereum Name Service (ENS) but tailored specifically for the Canton network.

## Architecture

The CNS system consists of the following components:

*   **Daml Contracts:** Define the name registry, ownership, and resolution logic.  These contracts are deployed to the Canton network.
*   **Resolution SDK:** A software development kit (SDK) that allows applications to resolve names to Canton party IDs.
*   **Resolver Service (Optional):**  A lightweight service that exposes a REST API for resolving names.  This can be used to integrate CNS with applications that cannot directly interact with the Canton ledger.

## Quickstart

This quickstart guide demonstrates how to register a name, authorize a party to resolve it, and then resolve the name using the SDK.

### Prerequisites

*   Daml SDK (version 3.1.0 or later)
*   Canton Sandbox or Canton Network access
*   Node.js and npm (for SDK example)

### 1. Deploy the Daml Contracts

1.  Build the Daml project: `daml build`
2.  Create a DAR file: `daml build` (creates `.dar` file in `dist/`)
3.  Deploy the DAR file to your Canton environment using the Canton CLI or other deployment tools.  Consult your Canton administrator for the specific deployment process.

### 2. Register a Name

Use the Canton Ledger API (e.g. using `curl` or a Ledger Client) to create a `NameRecord` contract.

```bash
# Example using curl (replace with your Canton Ledger API endpoint and credentials)

# Assuming you have a party called "Alice" with party ID "alice-party-id"
# And you want to register the name "alice.cns"

curl -X POST \
  http://localhost:7575/v1/create \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "CantonNameService.NameRecord",
    "payload": {
      "name": "alice.cns",
      "owner": "alice-party-id",
      "resolver": null # Optional, initially no resolver contract
    }
  }'
```

This creates a `NameRecord` contract representing the registration of `alice.cns` owned by `alice-party-id`. Note the returned Contract ID.

### 3. Authorize Resolution (Optional - For Private Names)

If you want to allow a specific party (e.g., "Bob") to resolve the name, you need to create an `Authorization` contract.

```bash
# Example using curl

curl -X POST \
  http://localhost:7575/v1/create \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "CantonNameService.Authorization",
    "payload": {
      "nameRecordCid": "<contract_id_from_step_2>",
      "authorizedParty": "bob-party-id"
    }
  }'
```

Replace `<contract_id_from_step_2>` with the Contract ID of the `NameRecord` created in step 2, and `bob-party-id` with the party ID of Bob.

### 4. Use the Resolution SDK

The SDK provides a simple way to resolve names to party IDs.

1.  **Install the SDK (example):**

    ```bash
    # Assuming you are using Javascript/Typescript

    npm install @digitalasset/canton-name-service-sdk
    ```

2.  **Example Code (Typescript):**

    ```typescript
    import { CantonNameService } from '@digitalasset/canton-name-service-sdk';

    async function resolveName(name: string, resolvingParty: string, ledgerApiUrl: string, ledgerApiToken: string): Promise<string | null> {
      const cns = new CantonNameService(ledgerApiUrl, ledgerApiToken);

      try {
        const partyId = await cns.resolve(name, resolvingParty);
        console.log(`Resolved ${name} to: ${partyId}`);
        return partyId;
      } catch (error) {
        console.error(`Error resolving ${name}:`, error);
        return null;
      }
    }

    // Example usage:
    const ledgerApiUrl = "http://localhost:7575"; // Replace with your Canton Ledger API URL
    const ledgerApiToken = "<your_token>"; // Replace with your Ledger API token
    const resolvingParty = "bob-party-id";  // Replace with the party that is resolving the name

    resolveName("alice.cns", resolvingParty, ledgerApiUrl, ledgerApiToken);
    ```

    **Explanation:**

    *   `CantonNameService`:  The main class for interacting with the CNS registry.
    *   `resolve(name, resolvingParty)`:  Resolves the given name to a Canton party ID, on behalf of the specified resolving party. This method queries the ledger for matching `NameRecord` and `Authorization` contracts (if necessary).
    *   `ledgerApiUrl`: The URL of the Canton Ledger API.
    *   `ledgerApiToken`:  An authentication token for accessing the Ledger API.
    *   `resolvingParty`: The party attempting to resolve the name.  This party must be authorized to resolve the name via an `Authorization` contract if privacy is enabled.

### 5. Integrate with Existing Applications

The CNS SDK can be easily integrated with existing applications to replace hardcoded party IDs with human-readable names.  In many cases, this can be achieved with a simple wrapper around your existing code.

**Example:**

Instead of:

```typescript
// Hardcoded party ID
const recipientPartyId = "hardcoded-party-id";
// Send transaction to recipientPartyId
```

Use CNS:

```typescript
import { CantonNameService } from '@digitalasset/canton-name-service-sdk';

const cns = new CantonNameService(ledgerApiUrl, ledgerApiToken);

async function sendTransactionToName(recipientName: string, senderPartyId: string) {
  try {
    const recipientPartyId = await cns.resolve(recipientName, senderPartyId);

    if (recipientPartyId) {
      // Send transaction to recipientPartyId
      console.log(`Sending transaction to party: ${recipientPartyId} (resolved from ${recipientName})`);
    } else {
      console.error(`Could not resolve name: ${recipientName}`);
    }
  } catch (error) {
    console.error(`Error resolving name: ${recipientName}`, error);
  }
}

// Usage
sendTransactionToName("alice.cns", "your-party-id");
```

## SDK Documentation

Further SDK documentation is available at [link to SDK documentation - TBD].

## Contract Reference

### `NameRecord`

*   `name`: `Text` - The human-readable name (e.g., `alice.cns`).
*   `owner`: `Party` - The Canton party that owns the name.
*   `resolver`: `Optional ContractId Resolver` - Optional contract ID of a Resolver contract (see below) that handles resolution logic.  If `None`, resolution is based on `Authorization` contracts.

### `Authorization`

*   `nameRecordCid`: `ContractId NameRecord` - The Contract ID of the `NameRecord` that this authorization applies to.
*   `authorizedParty`: `Party` - The party that is authorized to resolve the name.

### `Resolver` (Advanced)

An optional contract that can be used to implement custom resolution logic.  This allows for more complex name resolution schemes.

## Contributing

Contributions are welcome!  Please see the `CONTRIBUTING.md` file for details.

## License

[Specify License - e.g., Apache 2.0]