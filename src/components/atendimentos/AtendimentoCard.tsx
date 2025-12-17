
import type { Atendimento } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, User, Eye, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AtendimentoCardProps {
    atendimento: Atendimento;
}

export function AtendimentoCard({ atendimento }: AtendimentoCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className="cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0 shadow-none rounded-none"
            onClick={() => navigate(`/atendimentos/${atendimento.id}`)}
        >
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-primary">
                            {atendimento.ticket || `#${String(atendimento.id)}`}
                        </span>
                        <Badge variant={atendimento.churn_risk > 50 ? "destructive" : "secondary"} className="h-5 text-[10px] px-1.5">
                            {atendimento.churn_risk > 0 ? `${atendimento.churn_risk}% Risco` : 'Normal'}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {atendimento.cliente}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {atendimento.data ? format(new Date(atendimento.data), 'dd/MM HH:mm') : '-'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium">{atendimento.motivo_fechamento || atendimento.motivo}</div>
                        <div className="text-xs text-muted-foreground">{atendimento.atendente}</div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < atendimento.nota ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{atendimento.tempo_atendimento} min</span>
                    </div>

                    <div className="flex items-center gap-1 border-l pl-4">
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/atendimentos/${atendimento.id}`);
                                }}
                                title="Ver Detalhes"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/atendimentos/${atendimento.id}/chat`);
                                }}
                                title="Ver Conversa"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
