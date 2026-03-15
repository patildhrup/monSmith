import { ShieldAlert, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-background border-t border-border/40 pt-16 pb-8 px-4">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-sm">
                <div className="space-y-4 md:col-span-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
                        <ShieldAlert size={20} />
                        monSmith
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        The next-generation cloud security scanner. Defraud adversaries and protect your infrastructure effortlessly.
                    </p>
                    <div className="flex gap-4 text-muted-foreground mt-4">
                        <a href="#" className="hover:text-primary transition-colors"><Twitter size={18} /></a>
                        <a href="#" className="hover:text-primary transition-colors"><Github size={18} /></a>
                        <a href="#" className="hover:text-primary transition-colors"><Linkedin size={18} /></a>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Product</h4>
                    <ul className="space-y-3 text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Resources</h4>
                    <ul className="space-y-3 text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Company</h4>
                    <ul className="space-y-3 text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                    </ul>
                </div>
            </div>

            <div className="container mx-auto pt-8 border-t border-border/40 text-center text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
                <p>&copy; {new Date().getFullYear()} monSmith Inc. All rights reserved.</p>
                <div className="flex gap-4">
                    <span>System Status: <span className="text-primary font-medium">All Systems Operational</span></span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
