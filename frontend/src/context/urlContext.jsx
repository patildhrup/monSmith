import React, { createContext, useContext, useState } from 'react';

const UrlContext = createContext();

export const useUrl = () => {
    return useContext(UrlContext);
};

export const UrlProvider = ({ children }) => {
    const [url, setUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [scanData, setScanData] = useState(null);
    const [error, setError] = useState(null);

    const resetScanState = () => {
        setUrl('');
        setIsScanning(false);
        setCurrentJobId(null);
        setScanData(null);
        setError(null);
    };

    const value = {
        url,
        setUrl,
        isScanning,
        setIsScanning,
        currentJobId,
        setCurrentJobId,
        scanData,
        setScanData,
        error,
        setError,
        resetScanState
    };

    return (
        <UrlContext.Provider value={value}>
            {children}
        </UrlContext.Provider>
    );
};
