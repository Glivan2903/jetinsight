import { useEffect, useState, useMemo } from 'react';
import {
    Calendar,
    Download,
    FilterX,
    MessageSquare,
    Star,
    Clock,
    Target,
    AlertTriangle,
    TrendingUp,
    ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AtendimentosService } from '@/services/atendimentos';
import type { Atendimento } from '@/types/database.types';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCharts } from '@/components/dashboard/Charts';

import { format, subDays, isAfter, isSameDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
    const [data, setData] = useState<Atendimento[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [selectedReason, setSelectedReason] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []); // Only load once on mount since we fetch a large dataset

    const loadData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            // Always fetch a large window (e.g. 1 year) or all data to ensure local filtering works smoothly
            // and "All" stats are based on a significant dataset.
            const start = subDays(now, 365);

            const result = await AtendimentosService.getDashboardStats(start, now);
            setData(result);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        const now = new Date();
        let filtered = [...data];

        // Filter by Period
        if (selectedPeriod === '7d') {
            const cutoff = subDays(now, 7);
            filtered = filtered.filter(item => isAfter(new Date(item.data), cutoff));
        } else if (selectedPeriod === '30d') {
            const cutoff = subDays(now, 30);
            filtered = filtered.filter(item => isAfter(new Date(item.data), cutoff));
        } else if (selectedPeriod === '90d') {
            const cutoff = subDays(now, 90);
            filtered = filtered.filter(item => isAfter(new Date(item.data), cutoff));
        } else if (selectedPeriod === 'today') {
            filtered = filtered.filter(item => isSameDay(new Date(item.data), now));
        }

        // Filter by Agent
        if (selectedAgent !== 'all') {
            filtered = filtered.filter(item => item.atendente === selectedAgent);
        }

        // Filter by Reason
        if (selectedReason !== 'all') {
            filtered = filtered.filter(item => item.motivo === selectedReason);
        }

        return filtered;
    }, [data, selectedAgent, selectedPeriod, selectedReason]);

    const stats = useMemo(() => {
        const total = filteredData.length;
        const today = filteredData.filter(item => isSameDay(new Date(item.data), new Date())).length;

        // General Stats
        const avgScore = total > 0 ? (filteredData.reduce((acc, curr) => acc + curr.nota, 0) / total).toFixed(1) : '0.0';
        const avgTime = total > 0 ? Math.round(filteredData.reduce((acc, curr) => acc + curr.tempo_atendimento, 0) / total) : 0;
        const avgLeadScore = total > 0 ? (filteredData.reduce((acc, curr) => acc + curr.lead_scoring, 0) / total).toFixed(1) : '0.0';

        // Risk Metrics - Filter out 0s (N/A) to avoid diluting the average with unanalysed data
        const churnItems = filteredData.filter(i => i.churn_risk > 0);
        const churnRate = churnItems.length > 0 ? Math.round(churnItems.reduce((acc, curr) => acc + curr.churn_risk, 0) / churnItems.length) : 0;

        const upsellItems = filteredData.filter(i => i.upsell_potential > 0);
        const upsellRate = upsellItems.length > 0 ? Math.round(upsellItems.reduce((acc, curr) => acc + curr.upsell_potential, 0) / upsellItems.length) : 0;

        const downsellItems = filteredData.filter(i => i.downsell_risk > 0);
        const downsellRate = downsellItems.length > 0 ? Math.round(downsellItems.reduce((acc, curr) => acc + curr.downsell_risk, 0) / downsellItems.length) : 0;

        return { total, today, avgScore, avgTime, avgLeadScore, churnRate, upsellRate, downsellRate };
    }, [filteredData]);

    const uniqueAgents = useMemo(() => Array.from(new Set(data.map(d => d.atendente))).sort(), [data]);
    const uniqueReasons = useMemo(() => Array.from(new Set(data.map(d => d.motivo))), [data]);

    const recentAtendimentos = filteredData.slice(0, 5);

    const exportData = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + ["ID,Data,Atendente,Cliente,Motivo,Nota,Tempo,Score"].join(",") + "\n"
            + filteredData.map(row => `${row.id},${row.data},${row.atendente},${row.cliente},${row.motivo},${row.nota},${row.tempo_atendimento},${row.lead_scoring}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "atendimentos.csv");
        document.body.appendChild(link);
        link.click();
    };

    const chartData = useMemo(() => {
        // Score Evolution (group by day)
        const evolutionMap = new Map<string, { sum: number, count: number }>();
        filteredData.slice().reverse().forEach(item => {
            const dateKey = format(new Date(item.data), 'dd/MM');
            const current = evolutionMap.get(dateKey) || { sum: 0, count: 0 };
            evolutionMap.set(dateKey, { sum: current.sum + item.nota, count: current.count + 1 });
        });

        const evolution = Array.from(evolutionMap.entries()).map(([date, val]) => ({
            date,
            score: Number((val.sum / val.count).toFixed(1)),
            total: val.count
        }));

        // Score Distribution
        const distribution = [1, 2, 3, 4, 5].map(score => ({
            score,
            count: filteredData.filter(item => item.nota === score).length
        }));

        return { evolution, distribution };
    }, [filteredData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[300px]" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-[180px]" />
                        <Skeleton className="h-10 w-[180px]" />
                        <Skeleton className="h-10 w-[180px]" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-[120px] w-full" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-[350px] w-full" />
                    <Skeleton className="h-[350px] w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto space-y-4 p-4 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                    Visão geral dos atendimentos e métricas principais.
                </p>
            </div>

            {/* Filters Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Atendente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Atendentes</SelectItem>
                            {uniqueAgents.map(agent => (
                                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo o período</SelectItem>
                            <SelectItem value="90d">Últimos 90 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="today">Hoje</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedReason} onValueChange={setSelectedReason}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Motivo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Motivos</SelectItem>
                            {uniqueReasons.map(reason => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={() => {
                        setSelectedAgent('all');
                        setSelectedPeriod('30d');
                        setSelectedReason('all');
                    }}>
                        <FilterX className="h-4 w-4" />
                    </Button>

                    <Button onClick={exportData}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total de Atendimentos"
                    value={stats.total}
                    icon={MessageSquare}
                    subtext="No período selecionado"
                />
                <StatCard
                    title="Atendimentos Hoje"
                    value={stats.today}
                    icon={Calendar}
                    subtext="Até o momento"
                />
                <StatCard
                    title="Nota Média"
                    value={stats.avgScore}
                    icon={Star}
                    color="text-yellow-500"
                    subtext="Baseado em avaliações"
                />
                <StatCard
                    title="Tempo Médio"
                    value={`${stats.avgTime} min`}
                    icon={Clock}
                    subtext="Por atendimento"
                />
                <StatCard
                    title="Lead Scoring Médio"
                    value={stats.avgLeadScore}
                    icon={Target}
                    subtext="Qualidade dos leads"
                />
                <StatCard
                    title="Taxa de Churn"
                    value={`${stats.churnRate}%`}
                    icon={AlertTriangle}
                    trend={stats.churnRate > 30 ? 'down' : 'neutral'}
                    trendText="Risco de cancelamento"
                    color={stats.churnRate > 30 ? "text-red-500" : ""}
                />
                <StatCard
                    title="Potencial Upsell"
                    value={`${stats.upsellRate}%`}
                    icon={TrendingUp}
                    trend="up"
                    trendText="Oportunidade"
                    color="text-primary"
                />
                <StatCard
                    title="Risco Downsell"
                    value={`${stats.downsellRate}%`}
                    icon={ArrowDown}
                    trend={stats.downsellRate > 20 ? 'down' : 'neutral'}
                    trendText="Risco de queda"
                    color={stats.downsellRate > 20 ? "text-orange-500" : ""}
                />
            </div>

            {/* Charts Section */}
            <DashboardCharts
                evolutionData={chartData.evolution}
                distributionData={chartData.distribution}
            />

            {/* Recent Services Table */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Últimos Atendimentos</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Atendimentos no Período</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.evolution}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill="#00C46B"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="col-span-3 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Atendimentos Recentes</CardTitle>
                            <CardDescription className="text-xs">
                                Últimos 5 atendimentos registrados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentAtendimentos.map((atendimento) => (
                                    <div
                                        key={atendimento.id}
                                        className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded-md transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {atendimento.cliente}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {atendimento.motivo}
                                            </p>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${atendimento.nota >= 4 ? 'bg-primary/20 text-primary-foreground/90' :
                                            atendimento.nota >= 3 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            Nota: {atendimento.nota}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
