import { Database, Cloud, Globe, Box, Layout, Cpu } from 'lucide-react';

const Integrations = () => {
    const integrationsList = [
        { name: "AWS", icon: <Cloud /> },
        { name: "GCP", icon: <Globe /> },
        { name: "Azure", icon: <Box /> },
        { name: "Kubernetes", icon: <Layout /> },
        { name: "Docker", icon: <Cpu /> },
        { name: "MongoDB", icon: <Database /> },
    ];

    return (
        <section id="integrations" className="py-24 px-4 bg-background">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Seamless Integrations</h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-12">
                    Plug your infrastructure seamlessly into monSmith. Continuous security posture management across modern stacks.
                </p>

                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
                    {integrationsList.map((item, index) => (
                        <div key={index} className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 hover:text-primary transition-all duration-300">
                            <div className="text-primary w-12 h-12 flex items-center justify-center bg-primary/5 rounded-xl border border-primary/20">
                                {item.icon}
                            </div>
                            <span className="text-sm font-medium tracking-wide">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Integrations;
