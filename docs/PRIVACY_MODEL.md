# CNS Privacy Model

## What is revealed — and to whom

| Event                       | Visible to                     | Hidden from        |
|-----------------------------|--------------------------------|--------------------|
| Name registration           | Owner + CNS Authority          | Everyone else      |
| Resolution request          | Requester + CNS Authority      | Target party, world|
| Resolution result           | Requester + resolved party     | Unrelated parties  |
| Transfer proposal           | Current owner + new owner + CA | World              |
| Subdomain delegation        | Parent owner + delegate + CA   | World              |

## Canton visibility model

CNS uses Canton's native **observer** pattern. A `NameRecordContract` names
the resolved party as an observer, granting them read access to their own record
but no write access. Third parties who are not signatories or observers cannot
see the contract exists.

## Resolution privacy

`ResolutionRequest` is visible only to the requester and the CNS authority.
The authority matches the request against its private name registry and returns
a `ResolutionResult` visible only to the requester and the resolved party.
A passive observer on the network sees only that *some* contract was archived
and a new one created — not what name was looked up or who resolved it.

## Authority trust model

The CNS authority is a trusted coordinator, not a data custodian. It cannot:
- Resolve a name to the wrong party (checked on-chain by the resolver SDK)
- Forge registrations without the owner's counter-signature
- Archive a name record without owner or authority consensus

The authority *can* refuse to resolve a request (denial of service). Multi-authority
redundancy is planned for Milestone 2.
