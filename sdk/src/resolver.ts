import { Ledger } from '@daml/ledger';
import { ResolutionRequest, ResolutionResult } from '../generated/CNS/Resolution';

export interface ResolveOptions {
  ledger     : Ledger;
  requester  : string;
  authority  : string;
  name       : string;
  timeoutMs ?: number;
}

export interface ResolveResult {
  name          : string;
  resolvedParty : string;
}

export async function resolveName(opts: ResolveOptions): Promise<ResolveResult | null> {
  const { ledger, requester, authority, name, timeoutMs = 10_000 } = opts;

  const reqId = await ledger.create(ResolutionRequest, {
    requester,
    name,
    authority,
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const results = await ledger.query(ResolutionResult, { requester, name });
    if (results.length > 0) {
      const r = results[0].payload;
      return { name: r.name, resolvedParty: r.resolvedParty };
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return null;
}
