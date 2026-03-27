import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Terminal, Copy, Download, Search, AlertCircle, Loader2, ChevronRight, Hash } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const Logs = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobId = queryParams.get('job_id');

    const [scanDetails, setScanDetails] = useState(null);
    const [loading, setLoading] = useState(!!jobId);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);


    return (
        <DashboardLayout>

        </DashboardLayout>
    );
};

export default Logs;
