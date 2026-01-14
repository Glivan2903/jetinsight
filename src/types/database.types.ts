export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            atendimento: {
                Row: {
                    id: number
                    qualificacao: string | null
                    nota: number | null
                    motivo: string | null
                    melhorias: string | null
                    telefone: string | null
                    ticket: string | null
                    data: string | null
                    resumo_atendimento: string | null
                    atendente: string | null
                    tempo_medio_atendimento: string | null // interval
                    lead_scoring: number | null
                    churn: number | null
                    upsell: number | null
                    downsell: number | null
                    avaliacao_ia: Json | null
                    historico_conversa: Json | null
                    motivo_fechamento: string | null
                    qualificacao_resumida: string | null
                    departamento: string | null
                }
                Insert: {
                    id?: number
                    qualificacao?: string | null
                    nota?: number | null
                    motivo?: string | null
                    melhorias?: string | null
                    telefone?: string | null
                    ticket?: string | null
                    data?: string | null
                    resumo_atendimento?: string | null
                    atendente?: string | null
                    tempo_medio_atendimento?: string | null
                    lead_scoring?: string | null
                    churn?: string | null
                    upsell?: string | null
                    downsell?: string | null
                    avaliacao_ia?: Json | null
                    historico_conversa?: Json | null
                    motivo_fechamento?: string | null
                    qualificacao_resumida?: string | null
                    departamento?: string | null
                }
                Update: {
                    id?: number
                    qualificacao?: string | null
                    nota?: number | null
                    motivo?: string | null
                    melhorias?: string | null
                    telefone?: string | null
                    ticket?: string | null
                    data?: string | null
                    resumo_atendimento?: string | null
                    atendente?: string | null
                    tempo_medio_atendimento?: string | null
                    lead_scoring?: number | null
                    churn?: number | null
                    upsell?: number | null
                    downsell?: number | null
                    avaliacao_ia?: Json | null
                    historico_conversa?: Json | null
                    motivo_fechamento?: string | null
                    qualificacao_resumida?: string | null
                    departamento?: string | null
                }
            }
        }
    }
}

export interface Atendimento {
    id: number | string;
    data: string;
    atendente: string;
    cliente: string; // usually derived from telefone or ticket
    ticket: string | null;
    telefone: string | null;
    motivo: string;
    nota: number;
    tempo_atendimento: number; // minutes
    lead_scoring: number;
    churn_risk: number; // Percent 0-100
    upsell_potential: number; // Percent 0-100
    downsell_risk: number; // Percent 0-100
    descricao: string;
    transcript: string;
    melhorias?: string | null;
    qualificacao?: string | null;
    motivo_fechamento?: string | null;
    resumo_atendimento?: string | null;
    departamento?: string | null;
}
