import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Atendimento } from '@/types/database.types';
import { AtendimentosService } from '@/services/atendimentos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
    ArrowLeft,
    User,
    Target,
    TrendingUp,
    ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AtendimentoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (id: string) => {
        try {
            setLoading(true);
            const data = await AtendimentosService.getAtendimentoById(id);
            if (data) {
                setAtendimento(data);
            } else {
                // Handle not found
                console.error("Atendimento not found");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Carregando detalhes...</div>;
    }

    if (!atendimento) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p>Atendimento não encontrado.</p>
                <Button onClick={() => navigate(-1)}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto space-y-6 animate-in fade-in duration-500 pb-10 pr-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate('/atendimentos')}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">Voltar</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden sm:block" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detalhes do Atendimento</h1>
                        <p className="text-sm text-muted-foreground">Visualização completa do atendimento {atendimento.id}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/atendimentos/${atendimento.id}/chat`)}>
                        <ArrowDown className="w-4 h-4 mr-2" />
                        Exportar PDF
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/atendimentos/${atendimento.id}/chat`)}>
                        Ver Conversa
                    </Button>
                </div>
            </div>

            {/* Informações Gerais Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" /> Informações Gerais
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">ID do Atendimento</p>
                            <p className="font-semibold">#{atendimento.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Número do Ticket</p>
                            <p className="font-semibold">{atendimento.ticket || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nota</p>
                            <Badge variant={atendimento.nota >= 4 ? "success" : atendimento.nota >= 3 ? "secondary" : "destructive"}>
                                {atendimento.nota} - {atendimento.nota >= 5 ? 'Excelente' : atendimento.nota >= 4 ? 'Muito Bom' : atendimento.nota >= 3 ? 'Bom' : 'Ruim'}
                            </Badge>
                        </div>

                        <div className="col-span-1 md:col-span-3 border-t my-2" />

                        <div>
                            <p className="text-sm text-muted-foreground">Motivo do Contato</p>
                            <p className="font-medium">{atendimento.motivo}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Motivo do Fechamento</p>
                            {/* Assuming we don't have exact 'motivo_fechamento' mapped yet, using qualified/summary logic */}
                            <p className="font-medium">Acompanhamento</p>
                        </div>
                        <div className="hidden md:block"></div>

                        <div className="col-span-1 md:col-span-3 border-t my-2" />

                        <div>
                            <p className="text-sm text-muted-foreground">Telefone</p>
                            <p className="flex items-center gap-2">
                                <span className="font-medium">{atendimento.telefone || atendimento.cliente}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Data e Hora de Fechamento</p>
                            <p className="font-medium">{format(new Date(atendimento.data), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm")}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Atendente Responsável</p>
                            <p className="font-medium">{atendimento.atendente}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tempo de Atendimento</p>
                            <p className="font-medium">{atendimento.tempo_atendimento} min</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Análise Qualitativa */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4" /> Análise Qualitativa
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm font-medium mb-1">Resumo do Atendimento</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {atendimento.descricao || "Sem resumo disponível."}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-1">Qualificação Completa</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {/* Mocking text since we might not have a separate 'Full Qualification' field, re-using descricao or qualif */}
                            {atendimento.qualificacao || atendimento.descricao}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Sugestões de Melhoria */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Sugestões de Melhoria
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <p className="text-sm font-medium mb-1">Pontos a Melhorar</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {atendimento.melhorias || "Nenhuma sugestão de melhoria registrada."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
