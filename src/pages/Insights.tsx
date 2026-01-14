import { useEffect, useState } from 'react';
import { AtendimentosService } from '@/services/atendimentos';
import type { Atendimento } from '@/types/database.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    MessageSquare,
    Sparkles,
    Loader2,
    Search,
    ArrowRight,
    Users,
    Building2,
    XCircle,
    ArrowLeft
} from 'lucide-react';

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

type InsightType = 'agent' | 'department' | 'reason';

export default function Insights() {
    const [insightType, setInsightType] = useState<InsightType | null>(null);
    const [filterOptions, setFilterOptions] = useState<{ agents: string[], departments: string[], reasons: string[] }>({
        agents: [],
        departments: [],
        reasons: []
    });

    const [selectedValue, setSelectedValue] = useState<string>('');
    const [data, setData] = useState<Atendimento[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    const [aiInsight, setAiInsight] = useState<InsightResponse | null>(null);
    const [showResults, setShowResults] = useState(false);

    // Load options on mount
    useEffect(() => {
        const loadOptions = async () => {
            const options = await AtendimentosService.getFilterOptions();
            setFilterOptions(options as any);
        };
        loadOptions();
    }, []);

    // Load data when value changes
    useEffect(() => {
        if (!selectedValue || !insightType) return;

        const loadData = async () => {
            setLoadingData(true);
            setIsGenerating(false);
            setShowResults(false);
            setAiInsight(null);

            const limit = (insightType === 'department' || insightType === 'reason') ? 40 : 20;

            const recent = await AtendimentosService.getRecentAtendimentosByFilter(insightType, selectedValue, limit);
            setData(recent);
            setLoadingData(false);
        };
        loadData();
    }, [selectedValue, insightType]);

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
        if (!selectedValue || data.length === 0 || !insightType) return;

        try {
            setIsGenerating(true);
            setShowResults(false);
            setAiInsight(null);
            setLoadingStepIndex(0);

            const payload = {
                agent: selectedValue, // Providing the selected value as 'agent' context for the AI
                context_type: insightType, // Additional context
                conversations: data.map(d => ({
                    id: d.id,
                    date: d.data,
                    client: d.cliente,
                    reason: d.motivo,
                    score: d.nota,
                    transcript: d.transcript || d.resumo_atendimento || d.descricao || ''
                }))
            };

            let webhookUrl = 'https://n8n.jetsalesbrasil.com/webhook/insight';
            if (insightType === 'department') webhookUrl = 'https://n8n.jetsalesbrasil.com/webhook/insight_departamento';
            if (insightType === 'reason') webhookUrl = 'https://n8n.jetsalesbrasil.com/webhook/insight_motivo_fechamento';

            const response = await fetch(webhookUrl, {
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
            <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50/50 p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-slate-900 flex items-center gap-3">
                            <Brain className="w-8 h-8 text-primary" />
                            Análise de Performance
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {insightType === 'agent' && 'Atendente: '}
                            {insightType === 'department' && 'Departamento: '}
                            {insightType === 'reason' && 'Motivo: '}
                            <span className="font-semibold text-primary">{selectedValue}</span>
                        </p>
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
            <div className="w-full max-w-4xl relative z-10">

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
                ) : !insightType ? (
                    // Step 1: Select Type
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="space-y-4">
                            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                                <Brain className="w-12 h-12 text-primary" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                Insights Inteligentes
                            </h1>
                            <p className="text-lg text-slate-500 max-w-md mx-auto">
                                Escolha como deseja gerar sua análise para obter insights precisos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <button
                                onClick={() => setInsightType('agent')}
                                className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900 text-lg">Por Atendente</h3>
                                        <p className="text-sm text-slate-500">Analise a performance individual</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setInsightType('department')}
                                className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="p-4 bg-purple-50 rounded-full text-purple-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900 text-lg">Por Departamento</h3>
                                        <p className="text-sm text-slate-500">Visão geral por setor/motivo</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setInsightType('reason')}
                                className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="p-4 bg-red-50 rounded-full text-red-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <XCircle className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900 text-lg">Por Motivo de Fechamento</h3>
                                        <p className="text-sm text-slate-500">Analise razões de perda/ganho</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    // Step 2: Select Specific Option
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-8 text-center animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setInsightType(null);
                                    setSelectedValue('');
                                    setData([]);
                                }}
                                className="absolute top-6 left-6 p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-full"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                                {insightType === 'agent' && <Users className="w-12 h-12 text-primary" />}
                                {insightType === 'department' && <Building2 className="w-12 h-12 text-primary" />}
                                {insightType === 'reason' && <XCircle className="w-12 h-12 text-primary" />}
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                {insightType === 'agent' && 'Selecionar Atendente'}
                                {insightType === 'department' && 'Selecionar Departamento'}
                                {insightType === 'reason' && 'Selecionar Motivo'}
                            </h1>
                            <p className="text-lg text-slate-500 max-w-md mx-auto">
                                Escolha o {insightType === 'agent' ? 'atendente' : insightType === 'department' ? 'departamento' : 'motivo'} para iniciar a análise.
                            </p>
                        </div>

                        <div className="max-w-sm mx-auto space-y-4">
                            <div className="relative group">
                                <Select value={selectedValue} onValueChange={setSelectedValue}>
                                    <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all group-hover:border-primary/50">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {insightType === 'agent' && filterOptions.agents.map(a => (
                                            <SelectItem key={a} value={a} className="py-3 text-base">{a}</SelectItem>
                                        ))}
                                        {insightType === 'department' && filterOptions.departments.map(a => (
                                            <SelectItem key={a} value={a} className="py-3 text-base">{a}</SelectItem>
                                        ))}
                                        {insightType === 'reason' && filterOptions.reasons.map(a => (
                                            <SelectItem key={a} value={a} className="py-3 text-base">{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                onClick={handleGenerateInsight}
                                disabled={!selectedValue || loadingData || data.length === 0}
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
                                {selectedValue && !loadingData && data.length > 0 && (
                                    <p className="text-sm text-primary font-medium animate-in fade-in">
                                        {data.length} conversas encontradas
                                    </p>
                                )}
                                {selectedValue && !loadingData && data.length === 0 && (
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
