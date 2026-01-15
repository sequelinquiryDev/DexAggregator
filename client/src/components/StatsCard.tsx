import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon, trend, trendUp, className }: StatsCardProps) {
  return (
    <div className={cn("p-6 rounded-xl bg-card border border-border/50 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all duration-300", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10">
          {icon}
        </div>
        {trend && (
          <div className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center", 
            trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {trendUp ? "+" : ""}{trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-2xl font-bold tracking-tight text-foreground font-mono">{value}</p>
      </div>
    </div>
  );
}
