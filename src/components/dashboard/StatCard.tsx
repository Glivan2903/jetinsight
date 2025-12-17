
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type LucideIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    trendText?: string;
    color?: string; // Optional color class for value
}

export function StatCard({
    title,
    value,
    subtext,
    icon: Icon,
    trend,
    trendValue,
    trendText,
    color
}: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4 text-muted-foreground")} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", color)}>{value}</div>
                {(subtext || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                        {trend && (
                            <span className={cn(
                                "flex items-center font-medium",
                                trend === 'up' && "text-primary",
                                trend === 'down' && "text-red-500",
                                trend === 'neutral' && "text-yellow-500"
                            )}>
                                {trend === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
                                {trend === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
                                {trend === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
                                {trendValue}
                            </span>
                        )}
                        <span>{subtext || trendText}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
