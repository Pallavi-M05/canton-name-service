# Canton Name Service — Integration Guide

Adopt CNS in an existing Canton application in under a day.

## Step 1 — Install the resolver SDK

```bash
npm install @canton-name-service/sdk
```

## Step 2 — Initialise the ledger client

```typescript
import { Ledger } from '@daml/ledger';
import { resolveName } from '@canton-name-service/sdk/resolver';

const ledger = new Ledger({ token: process.env.JWT });
```

## Step 3 — Resolve a name

```typescript
const result = await resolveName({
  ledger,
  requester  : 'Alice::...',
  authority  : 'CNS-Authority::...',
  name       : 'bob.canton',
});

if (result) {
  console.log(`bob.canton → ${result.resolvedParty}`);
}
```

## Step 4 — Register a name

```typescript
import { registerName } from '@canton-name-service/sdk/registrar';

const reg = await registerName({
  ledger,
  authority  : 'CNS-Authority::...',
  owner      : 'Alice::...',
  name       : 'alice.canton',
  ttlSeconds : 365 * 86_400,
});

console.log(`Registered ${reg.name} until ${reg.expiresAt}`);
```

## Step 5 — Renew before expiry

```typescript
import { renewName } from '@canton-name-service/sdk/registrar';

await renewName(ledger, contractId, 365 * 86_400);
```

## Privacy

Resolution is **authorised-only**: a party can only resolve a name if the
name record contract includes them as an observer. Third-party lookups return
nothing — not even a 404 — preserving Canton's privacy model.

See [`PRIVACY_MODEL.md`](PRIVACY_MODEL.md) for the full disclosure analysis.
