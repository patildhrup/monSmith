import { Terminal } from 'lucide-react';

const ScannerPreview = () => {
    return (
        <section id="scanner" className="py-24 px-4 bg-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Real-time Threat Intelligence</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Experience our advanced vulnerability scanner catching threats before they breach your perimeter.
                    </p>
                </div>

                <div className="rounded-xl border border-primary/30 bg-card/80 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,156,0,0.15)]">
                    {/* Terminal Header */}
                    <div className="flex items-center px-4 py-3 bg-card border-b border-border/50">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>
                        <div className="mx-auto text-xs text-muted-foreground flex items-center gap-2 font-mono">
                            <Terminal size={14} /> monsmith-cli --scan vpc-production
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-6 font-mono text-sm md:text-base text-gray-300 h-[350px] overflow-y-auto no-scrollbar">
                        <p className="text-primary mb-2">$ Initiating deep infrastructure scan...</p>
                        <p className="mb-1 text-gray-400">[00:00:01] Parsing AWS CloudTrail logs...</p>
                        <p className="mb-1 text-gray-400">[00:00:03] Analyzing IAM roles and inline policies...</p>
                        <p className="mb-2 text-yellow-400">[WARNING] Found over-privileged role: 'DevReadOnly'</p>

                        <p className="mb-1 text-gray-400 mt-4">[00:00:05] Scanning ECS clusters for CVEs...</p>
                        <p className="mb-1 text-red-500 font-semibold">[VULN DETECTED] CVE-2023-38545 inside container 'auth-service'</p>
                        <p className="mb-2 text-gray-400">  └─ Mitigation applied: Isolated container from network.</p>

                        <p className="mb-1 text-gray-400 mt-4">[00:00:08] Verifying S3 bucket configurations...</p>
                        <p className="mb-1 text-primary">[SECURE] All buckets block public access.</p>

                        <p className="mt-6 text-foreground font-semibold">Scan Complete.</p>
                        <p className="text-gray-400">Time elapsed: 8.4s | Scanned Assets: 14,204 | Threats Prevented: 2</p>
                        <p className="text-primary mt-2 animate-pulse">_</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ScannerPreview;
