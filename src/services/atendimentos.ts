import { supabase } from "@/lib/supabase";
import type { Atendimento, Database } from "@/types/database.types";

// Helper to parse interval string (e.g., "00:15:30" or Postgres format) to minutes
function parseIntervalToMinutes(interval: string | null): number {
    if (!interval) return 0;
    // Basic parsing assuming format H:M:S or similar. 
    // Postgres interval output can vary. Let's try to extract minutes.
    // If it comes as "15 mins" or "00:15:00".

    // Simple regex for HH:MM:SS
    const timeParts = interval.split(':');
    if (timeParts.length === 3) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        return (hours * 60) + minutes;
    }

    return 0; // Fallback
}

// Helper to parse Lead Scoring (assuming it might be text like "80" or "Alta")
function parseLeadScoring(value: string | number | null): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
    return 0;
}

// Helper to separate Percentage parsing
function parsePercent(value: string | number | null): number {
    if (value === null || value === undefined) return 0;

    // If already number
    if (typeof value === 'number') return value;

    const str = String(value).trim().toLowerCase();

    // Check for "true" boolean-like -> 100%
    if (['true', 'sim', 's', 'yes'].includes(str)) return 100;

    // Check for keywords
    if (str.includes('alto') || str.includes('crítico') || str.includes('critical')) return 80;
    if (str.includes('médio') || str.includes('medium')) return 50;
    if (str.includes('baixo') || str.includes('low')) return 20;

    // Try parsing number
    const num = parseFloat(str.replace('%', ''));
    if (!isNaN(num)) return num;

    return 0;
}

function adaptAtendimento(row: Database['public']['Tables']['atendimento']['Row']): Atendimento {
    // Cast avaliacao_ia to any to access properties safely
    const aiData = row.avaliacao_ia as any || {};

    return {
        id: row.id,
        data: row.data || new Date().toISOString(),
        atendente: row.atendente || 'Desconhecido',
        cliente: row.telefone || row.ticket || 'Cliente Sem ID',
        ticket: row.ticket || null,
        telefone: row.telefone || null,
        motivo: row.motivo || 'Geral',
        nota: row.nota || 0,
        tempo_atendimento: parseIntervalToMinutes(row.tempo_medio_atendimento),
        lead_scoring: parseLeadScoring(row.lead_scoring || aiData.lead_scoring || aiData.score || aiData.pontuacao),
        churn_risk: parsePercent(
            row.churn ||
            aiData.churn || aiData.churn_risk ||
            aiData.risco_cancelamento || aiData.cancelamento ||
            aiData.risco_churn || aiData.risco
        ),
        upsell_potential: parsePercent(
            row.upsell ||
            aiData.upsell || aiData.upsell_potential ||
            aiData.potencial_venda || aiData.venda ||
            aiData.potencial_upsell || aiData.oportunidade_venda
        ),
        downsell_risk: parsePercent(
            row.downsell ||
            aiData.downsell || aiData.downsell_risk ||
            aiData.risco_queda || aiData.risco_downsell ||
            aiData.queda || aiData.diminuicao_contrato
        ),
        descricao: row.resumo_atendimento || row.qualificacao_resumida || aiData.resumo || aiData.summary || '',
        transcript: JSON.stringify(row.historico_conversa || {}, null, 2),
        melhorias: row.melhorias || aiData.melhorias,
        qualificacao: row.qualificacao || aiData.qualificacao,
        motivo_fechamento: row.motivo_fechamento,
        departamento: row.departamento
    };
}

export const AtendimentosService = {
    getAtendimentos: async ({
        page = 1,
        pageSize = 20,
        filters = {}
    }: {
        page?: number,
        pageSize?: number,
        filters?: {
            search?: string,
            agent?: string,
            reason?: string
        }
    } = {}): Promise<{ data: Atendimento[], count: number }> => {
        let query = supabase
            .from('atendimento')
            .select('*', { count: 'exact' })
            .order('data', { ascending: false });

        // Apply filters
        if (filters?.search) {
            // Strict search on Ticket column only, as requested.
            // Using ilike for case-insensitive match, but partials allowed.
            query = query.ilike('ticket', `%${filters.search}%`);
        }

        if (filters?.agent && filters.agent !== 'all') {
            query = query.eq('atendente', filters.agent);
        }

        if (filters?.reason && filters.reason !== 'all') {
            query = query.eq('motivo_fechamento', filters.reason);
        }

        // Apply date filters if they were passed (re-integrating if needed, but current UI doesn't use date filter on list)
        // If we need date filter later, we add it back.

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching atendimentos:', error);
            throw error;
        }

        return {
            data: (data || []).map(adaptAtendimento),
            count: count || 0
        };
    },

    getFilterOptions: async () => {
        const BATCH_SIZE = 1000;
        let allAgents = new Set<string>();
        let allReasons = new Set<string>();
        let allDepartamentos = new Set<string>();
        let hasMore = true;
        let page = 0;

        while (hasMore) {
            const from = page * BATCH_SIZE;
            const to = (page + 1) * BATCH_SIZE - 1;

            const { data, error } = await supabase
                .from('atendimento')
                .select('atendente, motivo_fechamento, departamento')
                .range(from, to);

            if (error) {
                console.error('Error fetching filter options', error);
                return { agents: [], reasons: [] };
            }

            if (data && data.length > 0) {
                // Explicitly cast or handle the data to avoid "never" type inference errors
                (data as any[]).forEach(d => {
                    if (d.atendente) allAgents.add(d.atendente);
                    if (d.motivo_fechamento) allReasons.add(d.motivo_fechamento);
                    if (d.departamento) allDepartamentos.add(d.departamento);
                });

                if (data.length < BATCH_SIZE) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }

        return {
            agents: Array.from(allAgents).sort(),
            reasons: Array.from(allReasons).sort(),
            departments: Array.from(allDepartamentos).sort()
        };
    },

    getDashboardStats: async (startDate?: Date, endDate?: Date): Promise<Atendimento[]> => {
        const BATCH_SIZE = 1000;
        let allData: any[] = [];
        let hasMore = true;
        let page = 0;

        while (hasMore) {
            const from = page * BATCH_SIZE;
            const to = (page + 1) * BATCH_SIZE - 1;

            let query = supabase
                .from('atendimento')
                .select(`
                    id,
                    data,
                    atendente,
                    telefone,
                    ticket,
                    motivo,
                    nota,
                    tempo_medio_atendimento,
                    lead_scoring,
                    churn,
                    upsell,
                    downsell,
                    qualificacao_resumida,
                    resumo_atendimento,
                    qualificacao,
                    melhorias,
                    motivo_fechamento,
                    avaliacao_ia
                `)
                .order('data', { ascending: false })
                .range(from, to);

            if (startDate) {
                query = query.gte('data', startDate.toISOString());
            }

            if (endDate) {
                query = query.lte('data', endDate.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching dashboard stats:', error);
                throw error;
            }

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < BATCH_SIZE) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }

        return allData.map(adaptAtendimento);
    },

    getAtendimentoById: async (id: number | string): Promise<Atendimento | undefined> => {
        const { data, error } = await supabase
            .from('atendimento')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching atendimento:', error);
            return undefined;
        }

        if (!data) return undefined;

        return adaptAtendimento(data);
    },

    getRecentAtendimentosByAgent: async (agent: string, limit: number = 20): Promise<Atendimento[]> => {
        const { data, error } = await supabase
            .from('atendimento')
            .select('*')
            .eq('atendente', agent)
            .order('data', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent atendimentos by agent:', error);
            return [];
        }

        return (data || []).map(adaptAtendimento);
    },

    getRecentAtendimentosByFilter: async (type: 'agent' | 'department' | 'reason', value: string, limit: number = 20): Promise<Atendimento[]> => {
        let query = supabase
            .from('atendimento')
            .select('*')
            .order('data', { ascending: false })
            .limit(limit);

        if (type === 'agent') {
            query = query.eq('atendente', value);
        } else if (type === 'department') {
            query = query.eq('departamento', value);
        } else if (type === 'reason') {
            query = query.eq('motivo_fechamento', value);
        }

        const { data, error } = await query;

        if (error) {
            console.error(`Error fetching recent atendimentos by ${type}:`, error);
            return [];
        }

        return (data || []).map(adaptAtendimento);
    }
};
