import React, { useState, useCallback } from 'react';
import { useParty, useLedger, useStreamFetchByKey } from '@c7/react';
import { ContractId } from '@c7/dlt';
import { Cns } from '@cns/daml-codegen';

import './NameSearch.css';

interface NameSearchProps {
  /** The ContractId of the central CNS Registry contract. */
  registryCid: ContractId<Cns.Registry.Registry>;
}

/**
 * A UI component for searching, resolving, and registering human-readable names
 * on the Canton Name Service.
 */
export const NameSearch: React.FC<NameSearchProps> = ({ registryCid }) => {
  const party = useParty();
  const ledger = useLedger();

  const [nameInput, setNameInput] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the input to avoid excessive queries while the user is typing.
  React.useEffect(() => {
    const handler = setTimeout(() => {
      // Normalize the name to lowercase and trimmed for consistency.
      const normalized = nameInput.trim().toLowerCase();
      // Only update if it's a valid potential name
      if (normalized.match(/^[a-z0-9-]+$/)) {
        setDebouncedName(normalized);
        setError(null);
      } else if (normalized !== "") {
        setDebouncedName("");
        setError("Name can only contain letters, numbers, and hyphens.");
      } else {
        setDebouncedName("");
        setError(null);
      }
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [nameInput]);

  const { contract: nameRecord, loading: isLoading } = useStreamFetchByKey(
    Cns.NameRecord.NameRecord,
    // Only execute the query if we have a valid registryCid and a debounced name
    () => (registryCid && debouncedName ? [registryCid, debouncedName] : null),
    [registryCid, debouncedName]
  );

  const handleRegister = useCallback(async () => {
    if (!debouncedName) {
      setError("Cannot register an empty name.");
      return;
    }
    if (!registryCid) {
        setError("Registry contract not available.");
        return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      await ledger.exercise(
        Cns.Registry.Registry.RegisterName,
        registryCid,
        { name: debouncedName, owner: party }
      );
      // Success! The useStreamFetchByKey hook will automatically pick up the new contract.
    } catch (err) {
      console.error("Failed to register name:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during registration.";
      setError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  }, [ledger, registryCid, debouncedName, party]);

  const renderResult = () => {
    if (error && !isLoading) {
      return <p className="cns-search-error">Error: {error}</p>;
    }
    
    if (!debouncedName) {
      return <p className="cns-search-prompt">Enter a name to search for.</p>;
    }

    if (isLoading) {
      return <p className="cns-search-loading">Searching...</p>;
    }

    if (nameRecord) {
      return (
        <div className="cns-search-result cns-search-result--found">
          <h4>'{nameRecord.payload.name}.cns' is Registered</h4>
          <p>
            <span>Owner Party ID:</span>
            <code>{nameRecord.payload.owner}</code>
          </p>
        </div>
      );
    }

    return (
      <div className="cns-search-result cns-search-result--available">
        <h4>'{debouncedName}.cns' is Available!</h4>
        <p>You can register this name for your party ID:</p>
        <code>{party}</code>
        <button
          onClick={handleRegister}
          disabled={isRegistering}
          className="cns-register-button"
        >
          {isRegistering ? "Registering..." : `Register '${debouncedName}.cns'`}
        </button>
      </div>
    );
  };

  return (
    <div className="cns-search-container">
      <h2>CNS Name Resolver</h2>
      <div className="cns-input-group">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="e.g. alice-canton"
          className="cns-search-input"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <span className="cns-input-suffix">.cns</span>
      </div>
      <div className="cns-result-panel">
        {renderResult()}
      </div>
    </div>
  );
};