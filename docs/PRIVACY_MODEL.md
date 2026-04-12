# Canton Name Service (CNS) Privacy Model

## Core Principle: Privacy by Design

The Canton Name Service (CNS) is built on the Canton protocol, which provides a fundamentally private and confidential environment for distributed applications. Unlike name services on public blockchains (like ENS on Ethereum) where all data is public by default, CNS operates on a **need-to-know basis**.

**Key takeaway:** Information is only shared with parties who are explicitly granted permission. Name resolution is a permissioned action, not a public lookup.

---

## Stakeholders of a `NameRecord`

Each registered name (e.g., `acme.cns`) is represented by a `NameRecord` smart contract on the ledger. The visibility and control of this contract are strictly limited to its stakeholders:

1.  **Owner:** The party that owns the name.
    *   **Rights:** The owner is a **signatory** on the `NameRecord` contract. They have full control, including the ability to transfer ownership, update associated data, and grant or revoke resolution permissions.
    *   **Visibility:** The owner can see all details of their `NameRecord`.

2.  **Registry Operator:** The party that manages the top-level namespace (e.g., `.cns`).
    *   **Rights:** The operator is a **signatory** on the `NameRecord` contract. This allows them to perform administrative functions, such as enforcing namespace rules or managing initial registration. They cannot unilaterally transfer or modify a record without the owner's consent, as defined by the smart contract rules.
    *   **Visibility:** The operator can see all `NameRecord` contracts created under its authority. This is necessary for administration but does not grant them visibility into how those names are used in other private transactions.

3.  **Authorized Resolvers:** Any party that the `Owner` has explicitly granted permission to resolve the name.
    *   **Rights:** Resolvers are **observers** on a `ResolutionPermit` contract created by the Owner. They have read-only access to the name-to-party mapping. They have no control over the `NameRecord` itself.
    *   **Visibility:** A resolver can only see the specific name-to-party mapping they were permissioned to see. They cannot see other names owned by the same party, nor can they see who else has been granted resolution rights.

---

## The Private Resolution Workflow

Resolving a name in CNS is an interactive, permissioned process that ensures the owner maintains control over their data.

Let's say Alice wants to resolve the name `bob.cns` to get Bob's `Party` ID.

1.  **Request:** Alice cannot simply query a public registry. She must first request permission from Bob. This is typically done by creating a `ResolutionRequest` contract, making Bob (the prospective owner) a stakeholder.

2.  **Grant:** Bob sees Alice's `ResolutionRequest` on his view of the ledger. If he consents, he exercises a choice on his `NameRecord` contract to grant permission to Alice.

3.  **Permit Creation:** This action atomically creates a new `ResolutionPermit` contract.
    *   **Signatory:** Bob (the owner of `bob.cns`)
    *   **Observer:** Alice (the requester)
    *   **Payload:** The name `bob.cns` and Bob's corresponding `Party` ID.

4.  **Resolution:** Alice is now an observer on the `ResolutionPermit` contract. It appears on her view of the active contract set (ACS). She can now read the payload to get Bob's `Party` ID. The resolution is complete.

This workflow guarantees that:
*   Bob has explicitly consented to sharing his Party ID with Alice.
*   The interaction is private between Alice and Bob. No other party (except the involved Canton domain operators) is aware that this resolution occurred.
*   The `ResolutionPermit` can be designed to be permanent or ephemeral (e.g., it can be archived after a single use or expire after a certain time), giving the owner fine-grained control.

---

## Data Visibility Guarantees

The Canton protocol's privacy model provides the following guarantees within CNS:

| Party Role             | What They CAN See                                                                                             | What They CANNOT See                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **A Requester/Resolver** (Alice) | The specific `ResolutionPermit` for `bob.cns` after Bob grants access.                                        | The `NameRecord` for `bob.cns`, other names Bob owns, or who else has resolved `bob.cns`.                           |
| **An Owner** (Bob)     | His own `NameRecord` contract, all pending `ResolutionRequest`s for his name, and all `ResolutionPermit`s he has issued. | Alice's `NameRecord` or any other records he does not own or have permission to resolve.                          |
| **Registry Operator**  | All `NameRecord` contracts created within its namespace.                                                      | How those names are being used in private transactions (e.g., a DVP between Alice and Bob) unless they are a party to that transaction. |
| **An Unrelated Party** (Charlie) | Nothing about the `bob.cns` `NameRecord` or the resolution event between Alice and Bob.                 | All information related to `bob.cns` is invisible to Charlie by default.                                            |

---

## Comparison with Public Name Services

| Feature            | **CNS (Canton)**                                     | **ENS (Ethereum)**                                         |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| **Visibility**     | Private by default                                   | Public by default                                          |
| **Resolution**     | Permissioned, requires owner consent for each lookup | Permissionless, anyone can look up any name at any time    |
| **Linkability**    | Low. An owner's names are not publicly linked.       | High. All names owned by an address are publicly linked.   |
| **Target Use Case**| Enterprise, institutional, and privacy-conscious users | Public, censorship-resistant web and wallet identity       |

By leveraging Canton's native privacy features, CNS provides a powerful identity layer that is fit for purpose in regulated and commercial environments where confidentiality is paramount.