import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
    Plus,
    Globe,
    Smartphone,
    Webhook,
    Github,
    X,
    FolderPlus
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

const NewProject = () => {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState("web");
    const formRef = useRef(null);

    useEffect(() => {
        if (open && formRef.current) {
            gsap.fromTo(
                formRef.current,
                { y: 80, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
            );
        }
    }, [open]);

    return (
        <DashboardLayout>
            <div className="relative min-h-screen px-6 py-10 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Create New Project
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Setup a new project to monitor, scan, and analyze security risks.
                    </p>
                </div>

                {/* Empty State */}
                {!open && (
                    <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/10 rounded-[32px] bg-card/30">
                        <FolderPlus size={48} className="opacity-40 mb-4" />
                        <h2 className="text-xl font-bold">No Projects Yet</h2>
                        <p className="text-muted-foreground">
                            Click the + button to create your first project
                        </p>
                        <p className="text-muted-foreground font-bold">Comming Soon...</p>
                    </div>
                )}

                {/* Floating Button */}
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-10 right-10 z-50 w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl hover:scale-110 transition-all"
                >
                    <Plus size={28} />
                </button>

                {/* Modal */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div
                                ref={formRef}
                                className="bg-card/90 border border-white/10 backdrop-blur-xl p-8 rounded-[32px] w-full max-w-2xl shadow-2xl"
                            >

                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">
                                        New Project
                                    </h2>
                                    <button onClick={() => setOpen(false)}>
                                        <X />
                                    </button>
                                </div>

                                {/* Form */}
                                <form className="space-y-6">

                                    {/* Project Name */}
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Project Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="My Secure App"
                                            className="w-full mt-2 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-primary outline-none"
                                        />
                                    </div>


                                    {/* Platform Type */}
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Project Type
                                        </label>

                                        <div className="grid grid-cols-4 gap-4 mt-3">

                                            {[
                                                { id: "web", icon: <Globe size={20} />, label: "Web" },
                                                { id: "mobile", icon: <Smartphone size={20} />, label: "Mobile" },
                                                { id: "api", icon: <Webhook size={20} />, label: "API" },
                                                { id: "repo", icon: <Github size={20} />, label: "Repo" }
                                            ].map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setType(item.id)}
                                                    className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center gap-2 transition-all
                            ${type === item.id
                                                            ? "border-primary bg-primary/10 scale-105"
                                                            : "border-white/10 hover:border-primary"
                                                        }`}
                                                >
                                                    {item.icon}
                                                    <span className="text-sm">{item.label}</span>
                                                </div>
                                            ))}

                                        </div>
                                    </div>

                                    {/* Target / URL */}
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Project Target
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="https://example.com or repo link"
                                            className="w-full mt-2 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-primary outline-none"
                                        />
                                    </div>




                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-xl bg-primary flex items-center justify-center gap-2 font-bold hover:scale-[1.02] transition"
                                    >
                                        <FolderPlus size={18} />
                                        Create Project
                                    </button>

                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default NewProject;