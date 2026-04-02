import { Ledger } from '@daml/ledger';
import { NameRecordContract } from '../generated/CNS/NameRecord';

export interface RegisterNameOptions {
  ledger       : Ledger;
  authority    : string;
  owner        : string;
  name         : string;
  ttlSeconds  ?: number;
}

export interface RegistrationResult {
  contractId : string;
  name       : string;
  owner      : string;
  expiresAt  : string;
}

export async function registerName(opts: RegisterNameOptions): Promise<RegistrationResult> {
  const { ledger, authority, owner, name, ttlSeconds = 365 * 86_400 } = opts;

  const now       = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1_000).toISOString();

  const result = await ledger.create(NameRecordContract, {
    record: {
      name,
      partyId      : owner,
      owner,
      registrar    : authority,
      ttlSeconds,
      registeredAt : now.toISOString(),
      expiresAt,
    },
    authority,
  });

  return {
    contractId : result.contractId,
    name,
    owner,
    expiresAt,
  };
}

export async function renewName(
  ledger      : Ledger,
  contractId  : string,
  renewSeconds: number
): Promise<string> {
  const result = await ledger.exercise(
    NameRecordContract.RenewName,
    contractId,
    { renewalSeconds: renewSeconds }
  );
  return result.exerciseResult as string;
}
