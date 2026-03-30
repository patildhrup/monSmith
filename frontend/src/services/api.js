export const API_BASE = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1";

export const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    };
};

export const api = {
    // Scanner
    scanUrl: async (payload) => {
        return await fetch(`${API_BASE}/scanner/scan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },
    getHistory: async () => {
        return await fetch(`${API_BASE}/scanner/history`, {
            headers: getHeaders()
        });
    },
    getDetails: async (jobId) => {
        return await fetch(`${API_BASE}/scanner/details/${jobId}`, {
            headers: getHeaders()
        });
    },
    getAnalytics: async () => {
        return await fetch(`${API_BASE}/scanner/analytics`, {
            headers: getHeaders()
        });
    },
    getEndpoints: async () => {
        return await fetch(`${API_BASE}/scanner/endpoints`, {
            headers: getHeaders()
        });
    },
    
    // GitHub
    disconnectGithub: async () => {
        return await fetch(`${API_BASE}/github/disconnect`, {
            method: 'POST',
            headers: getHeaders()
        });
    },
    getRepos: async () => {
        return await fetch(`${API_BASE}/github/repos`, {
            headers: getHeaders()
        });
    },
    scanRepo: async (payload) => {
        return await fetch(`${API_BASE}/scanner/scan-repo`, {
             method: 'POST',
             headers: getHeaders(),
             body: JSON.stringify(payload)
        });
    },

    // Graph
    getGraphData: async (jobId) => {
        return await fetch(`${API_BASE}/scanner/graph-data/${jobId}`, {
            headers: getHeaders()
        });
    },
    getGraphAnalysis: async (jobId, question = null) => {
        const url = question 
            ? `${API_BASE}/scanner/graph-analysis/${jobId}?question=${encodeURIComponent(question)}`
            : `${API_BASE}/scanner/graph-analysis/${jobId}`;
        return await fetch(url, {
            headers: getHeaders()
        });
    }
};
