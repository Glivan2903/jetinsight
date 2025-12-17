import type { Atendimento } from "@/types/database.types";

const ATENDENTES = ["Ana Silva", "Bruno Santos", "Carlos Oliveira", "Diana Souza", "Eduardo Pereira", "Fernanda Costa", "Gabriel Almeida"];
const MOTIVOS = ["Suporte Técnico", "Vendas", "Dúvidas Gerais", "Reclamação", "Financeiro", "Cancelamento"];
const CLIENTES_BASE = ["Empresa ABC", "Tech Solutions", "Global Net", "Inova Systems", "Alpha Corp", "Beta Ltd", "Delta Group", "Omega Inc"];

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

const TRANSCRIPTS_TEMPLATES = [
    "Atendente: Olá, como posso ajudar?\nCliente: Estou com problema no login.\nAtendente: Vou verificar.\nCliente: Obrigado.\nAtendente: Resolvido, tente agora.\nCliente: Deu certo!",
    "Atendente: Boa tarde, em que posso ser útil?\nCliente: Gostaria de saber sobre os planos.\nAtendente: Temos planos a partir de R$99.\nCliente: Interessante, me mande por email.\nAtendente: Enviado.",
    "Atendente: Suporte técnico, bom dia.\nCliente: Minha internet está lenta.\nAtendente: Reinicie o modem por favor.\nCliente: Já fiz isso.\nAtendente: Vou abrir um chamado técnico.",
];

export const generateMockData = (count: number = 60): Atendimento[] => {
    const data: Atendimento[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < count; i++) {
        const leadScore = parseFloat((Math.random() * 10).toFixed(1));
        const nota = randomInt(1, 5);
        const motivo = randomItem(MOTIVOS);
        const churnRisk = nota <= 2 || (motivo === "Cancelamento" && Math.random() > 0.3);
        const upsellPotential = leadScore > 7 && nota >= 4;

        data.push({
            id: crypto.randomUUID(),
            data: randomDate(thirtyDaysAgo, now),
            atendente: randomItem(ATENDENTES),
            cliente: `${randomItem(CLIENTES_BASE)} ${randomInt(1, 100)}`,
            motivo: motivo,
            nota: nota,
            tempo_atendimento: randomInt(5, 120),
            lead_scoring: Math.floor(Math.random() * 100),
            churn_risk: churnRisk ? Math.floor(Math.random() * 50) + 50 : 0,
            upsell_potential: upsellPotential ? Math.floor(Math.random() * 50) + 50 : 0,
            downsell_risk: !churnRisk && !upsellPotential && Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 20 : 0,
            descricao: `Atendimento referente a ${motivo.toLowerCase()}. Cliente entrou em contato para resolver pendências.`,
            transcript: randomItem(TRANSCRIPTS_TEMPLATES),

            qualificacao: leadScore > 8 ? "Quente" : leadScore > 4 ? "Morno" : "Frio",
            melhorias: nota < 5 ? "Melhorar tempo de resposta" : null,
            telefone: `(11) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
            ticket: `TKT-${randomInt(10000, 99999)}`
        });
    }

    // Sort by date desc
    return data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

export const MOCK_DATA = generateMockData();
