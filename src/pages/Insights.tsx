import { useEffect, useState } from 'react';
import { AtendimentosService } from '@/services/atendimentos';
import type { Atendimento } from '@/types/database.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, MessageSquare, Sparkles, Loader2, Search, ArrowRight } from 'lucide-react';

// Define the structure of the AI Response
interface InsightResponse {
    insight_geral: string;
    insight_resumido_direto: string;
    ponto_forte: string;
    ponto_fraco: string;
    sugestao_melhoria: string;
}

const LOADING_STEPS = [
    { text: "Aguardando...", icon: Loader2 },
    { text: "Construindo...", icon: Brain },
    { text: "Analisando...", icon: Search },
    { text: "Finalizando...", icon: Sparkles }
];

export default function Insights() {
    const [agents, setAgents] = useState<string[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [data, setData] = useState<Atendimento[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    const [aiInsight, setAiInsight] = useState<InsightResponse | null>(null);
    const [showResults, setShowResults] = useState(false);

    // Load agents on mount
    useEffect(() => {
        const loadAgents = async () => {
            const { agents } = await AtendimentosService.getFilterOptions();
            setAgents(agents);
        };
        loadAgents();
    }, []);

    // Load data when agent changes
    useEffect(() => {
        if (!selectedAgent) return;

        const loadData = async () => {
            setLoadingData(true);
            setIsGenerating(false);
            setShowResults(false);
            setAiInsight(null);

            const recent = await AtendimentosService.getRecentAtendimentosByAgent(selectedAgent, 20);
            setData(recent);
            setLoadingData(false);
        };
        loadData();
    }, [selectedAgent]);

    // Cycle through loading steps
    useEffect(() => {
        if (!isGenerating) {
            setLoadingStepIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setLoadingStepIndex(prev => {
                if (prev < LOADING_STEPS.length - 1) return prev + 1;
                return prev; // Stay on last step until complete
            });
        }, 3000); // Change step every 3 seconds

        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleGenerateInsight = async () => {
        if (!selectedAgent || data.length === 0) return;

        try {
            setIsGenerating(true);
            setShowResults(false);
            setAiInsight(null);
            setLoadingStepIndex(0);

            const payload = {
                agent: selectedAgent,
                conversations: data.map(d => ({
                    id: d.id,
                    date: d.data,
                    client: d.cliente,
                    reason: d.motivo,
                    score: d.nota,
                    transcript: d.transcript || d.resumo_atendimento || d.descricao || ''
                }))
            };

            const response = await fetch('https://n8nconectajuse.conectajuse.shop/webhook/insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Falha ao gerar insight');

            const responseText = await response.text();

            let parsedData: any = {};
            try {
                // Handle various JSON wrapper cases from n8n
                const firstPass = JSON.parse(responseText);
                let innerContent = firstPass;
                if (Array.isArray(firstPass) && firstPass.length > 0) innerContent = firstPass[0];

                if (innerContent && typeof innerContent === 'object' && innerContent.output) {
                    if (typeof innerContent.output === 'string') {
                        try { parsedData = JSON.parse(innerContent.output); }
                        catch { parsedData = innerContent; }
                    } else {
                        parsedData = innerContent.output;
                    }
                } else {
                    parsedData = innerContent;
                }

                setAiInsight({
                    insight_geral: parsedData.insight_geral || parsedData.insight || "Análise gerada com sucesso.",
                    insight_resumido_direto: parsedData.insight_resumido_direto || "",
                    ponto_forte: parsedData.ponto_forte || "",
                    ponto_fraco: parsedData.ponto_fraco || "",
                    sugestao_melhoria: parsedData.sugestao_melhoria || ""
                });

            } catch (e) {
                console.error("JSON Parse Error:", e);
                setAiInsight({
                    insight_geral: responseText,
                    insight_resumido_direto: 'Erro ao processar formato da resposta.',
                    ponto_forte: '',
                    ponto_fraco: '',
                    sugestao_melhoria: ''
                });
            }

            setShowResults(true);

        } catch (error) {
            console.error('Error generating insight:', error);
            // Optional: Show error state
        } finally {
            setIsGenerating(false);
        }
    };

    const LoadingIcon = LOADING_STEPS[loadingStepIndex].icon;

    if (showResults && aiInsight) {
        return (
            <div className="min-h-full bg-slate-50/50 p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-slate-900 flex items-center gap-3">
                            <Brain className="w-8 h-8 text-primary" />
                            Análise de Performance
                        </h1>
                        <p className="text-muted-foreground mt-1">Atendent: <span className="font-semibold text-primary">{selectedAgent}</span></p>
                    </div>
                    <div className="flex gap-3">

                        <button
                            onClick={() => setShowResults(false)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Nova Análise
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Insight Card - Spans full width on mobile, 2 cols on large */}
                    <Card className="lg:col-span-3 border-primary/10 shadow-lg bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Visão Geral e Padroes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                                {aiInsight.insight_geral}
                            </div>

                            {aiInsight.insight_resumido_direto && (
                                <div className="mt-6 p-4 bg-white/60 rounded-xl border border-blue-100 shadow-sm">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                                        <MessageSquare className="w-4 h-4" />
                                        Em Resumo
                                    </h4>
                                    <p className="text-lg font-medium text-slate-800 italic">
                                        "{aiInsight.insight_resumido_direto}"
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Compact Cards */}
                    <Card className="border-primary/20 bg-primary/5 shadow-md transition-all hover:bg-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-primary-foreground flex items-center gap-2 text-lg">
                                <CheckCircle className="w-5 h-5" />
                                Pontos Fortes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 text-sm leading-relaxed">{aiInsight.ponto_forte}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 bg-red-50/30 shadow-md transition-all hover:bg-red-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                                <AlertTriangle className="w-5 h-5" />
                                Pontos Fracos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 text-sm leading-relaxed">{aiInsight.ponto_fraco}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-100 bg-blue-50/30 shadow-md transition-all hover:bg-blue-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-blue-700 flex items-center gap-2 text-lg">
                                <TrendingUp className="w-5 h-5" />
                                Sugestão de Melhoria
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 text-sm leading-relaxed">{aiInsight.sugestao_melhoria}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-slate-50 -z-20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

            {/* Central Content */}
            <div className="w-full max-w-2xl relative z-10">

                {isGenerating ? (
                    // Loading State
                    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-full blur-xl opacity-40 animate-pulse" />
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl relative z-10 border-4 border-slate-50">
                                <LoadingIcon className="w-10 h-10 text-primary animate-bounce" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 animate-pulse">
                                {LOADING_STEPS[loadingStepIndex].text}
                            </h2>
                            <p className="text-muted-foreground">Isso pode levar alguns segundos</p>
                        </div>

                        <div className="flex gap-2">
                            {LOADING_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-3 h-3 rounded-full transition-all duration-500 ${idx === loadingStepIndex
                                        ? "bg-primary w-8"
                                        : idx < loadingStepIndex
                                            ? "bg-primary/40"
                                            : "bg-slate-200"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Selection State (Hero)
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="space-y-4">
                            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                                <Brain className="w-12 h-12 text-primary" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                Insights Inteligentes
                            </h1>
                            <p className="text-lg text-slate-500 max-w-md mx-auto">
                                Selecione um atendente para gerar uma análise completa de performance baseada em IA.
                            </p>
                        </div>

                        <div className="max-w-sm mx-auto space-y-4">
                            <div className="relative group">
                                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                    <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all group-hover:border-primary/50">
                                        <SelectValue placeholder="Selecione um atendente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agents.map(a => (
                                            <SelectItem key={a} value={a} className="py-3 text-base">{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                onClick={handleGenerateInsight}
                                disabled={!selectedAgent || loadingData || data.length === 0}
                                className="w-full h-14 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                            >
                                {loadingData ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Gerar Análise
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <div className="h-6">
                                {selectedAgent && !loadingData && data.length > 0 && (
                                    <p className="text-sm text-primary font-medium animate-in fade-in">
                                        {data.length} conversas encontradas
                                    </p>
                                )}
                                {selectedAgent && !loadingData && data.length === 0 && (
                                    <p className="text-sm text-red-500 font-medium animate-in fade-in">
                                        Nenhuma conversa recente encontrada
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
