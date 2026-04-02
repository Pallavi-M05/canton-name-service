import React, { useState } from 'react';

interface SearchResult {
  name         : string;
  resolvedParty: string;
  owner        : string;
  expiresAt    : string;
}

export default function NameSearch() {
  const [query,   setQuery]   = useState('');
  const [result,  setResult]  = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/resolve?name=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? 'Resolution failed');
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="name-search">
      <h2>Resolve a Canton Name</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="alice.canton"
          className="search-input"
          disabled={loading}
        />
        <button type="submit" className="search-btn" disabled={loading || !query.trim()}>
          {loading ? 'Resolving…' : 'Resolve'}
        </button>
      </form>

      {error && (
        <div className="search-error">
          <strong>Not found:</strong> {error}
        </div>
      )}

      {result && (
        <div className="search-result">
          <div className="result-row">
            <span className="result-label">Name</span>
            <span className="result-value">{result.name}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Resolves to</span>
            <span className="result-value mono">{result.resolvedParty}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Owner</span>
            <span className="result-value mono">{result.owner}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Expires</span>
            <span className="result-value">{new Date(result.expiresAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
