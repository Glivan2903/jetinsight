import { useEffect, useState } from 'react';
import type { Atendimento } from '@/types/database.types';
import { AtendimentosService } from '@/services/atendimentos';
import { AtendimentoCard } from '@/components/atendimentos/AtendimentoCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function Atendimentos() {
    const [data, setData] = useState<Atendimento[]>([]);


    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('all');
    const [selectedReason, setSelectedReason] = useState('all');
    // The previous Select for selectedReason and selectedScore, along with extra divs, were removed here.
    // The correct structure for filters should be within the main JSX return block.

    // The rest of the component's JSX structure should follow here.
    // Assuming the filters are part of a larger header/filter section.
    // The instruction implies removing the selectedScore select and fixing div closures.
    // The provided "Code Edit" in the instruction shows the intended structure for the filters.

    // Placeholder for filterOptions and pagination states/handlers, as they are not in the provided snippet
    // but are implied by the JSX.
    const [filterOptions, setFilterOptions] = useState<{ agents: string[], reasons: string[] }>({ agents: [], reasons: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const handleSearch = () => {
        if (currentPage !== 1) setCurrentPage(1);
        else loadData();
    };

    const loadFilterOptions = async () => {
        const options = await AtendimentosService.getFilterOptions();
        setFilterOptions(options);
    };

    const loadData = async () => {
        try {
            const { data, count } = await AtendimentosService.getAtendimentos({
                page: currentPage,
                pageSize: ITEMS_PER_PAGE,
                filters: {
                    search: searchTerm,
                    agent: selectedAgent,
                    reason: selectedReason
                }
            });

            setData(data);
            setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        loadData();
    }, [currentPage, selectedAgent, selectedReason]);


    return (
        <div className="flex flex-col h-full p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">Atendimentos</h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por Ticket..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button onClick={handleSearch}>
                            Pesquisar
                        </Button>
                    </div>

                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Atendente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Atendentes</SelectItem>
                            {filterOptions.agents.map(agent => (
                                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedReason} onValueChange={setSelectedReason}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Motivo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Motivos</SelectItem>
                            {filterOptions.reasons.map(reason => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Scrollable Content */}
            < div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2" >
                {/* Grid */}
                {
                    data.length > 0 ? (
                        <div className="flex flex-col bg-card border rounded-md overflow-hidden divide-y">
                            {data.map((item) => (
                                <AtendimentoCard key={item.id} atendimento={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum atendimento encontrado com os filtros selecionados.
                        </div>
                    )
                }

                {/* Pagination */}
                {
                    totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                                Página {currentPage} de {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
