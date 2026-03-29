import React, { createContext, useContext, useState, useEffect } from 'react';

const RepoContext = createContext();

const NOOP = () => {};
const FALLBACK = {
  repos: [], setRepos: NOOP,
  selectedRepo: null, setSelectedRepo: NOOP,
  scanResults: null, setScanResults: NOOP,
  scanJobId: null, setScanJobId: NOOP,
  connected: false, setConnected: NOOP,
  clearScan: NOOP,
};
export const useRepo = () => {
  const ctx = useContext(RepoContext);
  return ctx ?? FALLBACK;
};

const SESSION_KEY = 'monsmith_repo_state';

function loadPersistedState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export const RepoProvider = ({ children }) => {
  const persisted = loadPersistedState();

  const [repos, setRepos]             = useState(persisted?.repos || []);
  const [selectedRepo, setSelectedRepo] = useState(persisted?.selectedRepo || null);
  const [scanResults, setScanResults] = useState(persisted?.scanResults || null);
  const [scanJobId, setScanJobId]     = useState(persisted?.scanJobId || null);
  const [connected, setConnected]     = useState(persisted?.connected || false);

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        repos, selectedRepo, scanResults, scanJobId, connected
      }));
    } catch {}
  }, [repos, selectedRepo, scanResults, scanJobId, connected]);

  const clearScan = () => {
    setScanResults(null);
    setScanJobId(null);
  };

  return (
    <RepoContext.Provider value={{
      repos, setRepos,
      selectedRepo, setSelectedRepo,
      scanResults, setScanResults,
      scanJobId, setScanJobId,
      connected, setConnected,
      clearScan,
    }}>
      {children}
    </RepoContext.Provider>
  );
};
