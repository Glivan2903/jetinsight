import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Atendimento } from '@/types/database.types';
import { AtendimentosService } from '@/services/atendimentos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranscriptViewer } from '@/components/atendimentos/TranscriptViewer';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function AtendimentoChat() {
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
                console.error("Atendimento not found");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Carregando mensagem...</div>;
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
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight">Transcrição do Atendimento</h1>
                        <Badge variant="outline">{atendimento.ticket || String(atendimento.id).slice(0, 8)}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/atendimentos/${atendimento.id}`)}>
                        Ver Detalhes
                    </Button>
                </div>
            </div>

            {/* Chat Viewer - Full Height */}
            <div className="flex-1 overflow-hidden rounded-lg border bg-card">
                <TranscriptViewer transcript={atendimento.transcript} />
            </div>
        </div>
    );
}
