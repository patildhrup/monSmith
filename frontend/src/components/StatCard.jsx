import { useRef } from 'react';

const StatCard = ({ title, value, icon, trend, status }) => {
    const cardRef = useRef(null);

    return (
        <div 
            ref={cardRef}
            className="bg-card p-6 rounded-[28px] border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${status === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">{title}</p>
                <p className="text-3xl font-bold text-foreground tracking-tight group-hover:translate-x-1 transition-transform duration-300">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
