import { Shield, Fingerprint, Activity, Lock, Database, Search } from 'lucide-react';

const featuresData = [
    {
        icon: <Search className="text-primary" size={24} />,
        title: "Continuous Discovery",
        description: "Automatically identify and catalog all cloud assets, instances, and endpoints in real-time."
    },
    {
        icon: <Activity className="text-primary" size={24} />,
        title: "Threat Detection",
        description: "Behavioral analytics and signature-based scanning to detect anomalies instantly."
    },
    {
        icon: <Lock className="text-primary" size={24} />,
        title: "Posture Management",
        description: "Ensure configurations comply with CIS, SOC2, and HIPAA regulations automatically."
    },
    {
        icon: <Fingerprint className="text-primary" size={24} />,
        title: "Identity & Access",
        description: "Monitor privileges and detect compromised credentials before a breach occurs."
    },
    {
        icon: <Shield className="text-primary" size={24} />,
        title: "Vulnerability Scanning",
        description: "Deep scans across containers, VMs, and serverless functions for known CVEs."
    },
    {
        icon: <Database className="text-primary" size={24} />,
        title: "Data Security",
        description: "Locate and protect sensitive data (PII, PCI) across your entire infrastructure."
    }
];

const Features = () => {
    return (
        <section id="features" className="py-24 px-4 bg-background">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Complete Security Visibility</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Everything you need to secure your cloud environments, packaged in one unified platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuresData.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
