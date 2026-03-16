import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/50 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="text-xl font-bold tracking-tighter text-primary">monSmith</div>
                <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                    <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                    <a href="#scanner" className="hover:text-foreground transition-colors">Scanner</a>
                    <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
                </nav>
                <div className="flex items-center gap-4">
                    {user ? (
                        <Link to="/dashboard" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-[0_0_15px_rgba(0,156,0,0.3)]">
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Sign In
                            </Link>
                            <Link to="/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
