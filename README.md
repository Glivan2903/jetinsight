# Jet Sales - Qualifica / Insight System

Este projeto é uma plataforma analítica focada na qualificação e análise de atendimentos, permitindo extrair inteligência de conversas, entender padrões de performance e identificar pontos de melhoria no processo de vendas e suporte.

## 🧠 Módulo de Insights (Análise com IA)

O coração da inteligência do sistema reside na página de **Insights**. Esta funcionalidade utiliza Inteligência Artificial (via integração com n8n) para ler um volume de conversas e gerar relatórios qualitativos automáticos.

### Como os Insights são gerados?

O fluxo técnico da geração de insights funciona da seguinte maneira:

1.  **Seleção de Escopo**: O usuário define o tipo de análise desejada (Atendente, Departamento ou Motivo).
2.  **Extração de Dados**: O frontend busca no banco de dados os atendimentos mais recentes vinculados à escolha.
    *   Os dados incluem: data, nome do cliente, motivo do desfecho, nota de avaliação e, principalmente, o **transcript ou resumo** da conversa.
3.  **Processamento via Webhook**: O payload contendo o contexto (quem está sendo analisado) e o array de conversas é enviado para um workflow de automação no **n8n**.
4.  **Análise de LLM**: O n8n processa esses textos (provavelmente utilizando modelos como GPT) para identificar padrões.
5.  **Resultado Estruturado**: O webhook retorna um JSON padronizado com:
    *   Visão Geral
    *   Resumo Direto
    *   Pontos Fortes
    *   Pontos Fracos
    *   Sugestões de Melhoria

---

### 📊 Tipos de Insights Detalhados

O sistema oferece três "lentes" diferentes para analisar os dados:

#### 1. Por Atendente (`agent`)
Focado na performance individual do colaborador. Ideal para feedbacks one-on-one e avaliação de qualidade.

*   **Endpoint do Webhook**: `.../webhook/insight`
*   **Volume de Dados**: Analisa as últimas **20 conversas** do atendente selecionado.
*   **O que busca responder**: "Como este atendente está se comportando? Ele segue o script? É empático?"

#### 2. Por Departamento (`department`)
Focado na performance macro de um setor (ex: Comercial, Suporte, Financeiro).

*   **Endpoint do Webhook**: `.../webhook/insight_departamento`
*   **Volume de Dados**: Analisa as últimas **40 conversas** do departamento.
*   **O que busca responder**: "Quais são as dores comuns desse setor? Onde a equipe inteira está falhando ou acertando?"

#### 3. Por Motivo de Fechamento (`reason`)
Focado no "Porquê". Analisa todos os atendimentos que terminaram com um motivo específico (ex: "Venda Realizada", "Preço Alto", "Sem Retorno").

*   **Endpoint do Webhook**: `.../webhook/insight_motivo_fechamento`
*   **Volume de Dados**: Analisa as últimas **40 conversas** com este motivo.
*   **O que busca responder**: "Por que estamos perdendo vendas por preço? O que acontece nas vendas que dão certo?"

---

### 🛠️ Detalhes Técnicos da Implementação

A funcionalidade está implementada no arquivo `src/pages/Insights.tsx`.

*   **Frontend**: Desenvolvido em React.
*   **Estado e UX**: Possui indicadores visuais de progresso ("Construindo...", "Analisando...") para manter o usuário engajado durante o processamento da IA, que pode levar alguns segundos.
*   **Integração**: Utiliza `fetch` para comunicar com enpoints POST do n8n (https://n8n.jetsalesbrasil.com).
*   **Tratamento de Dados**: O sistema é robusto para lidar com diferentes formatos de resposta JSON que podem vir do n8n, garantindo que o relatório seja exibido mesmo se a estrutura variar levemente.
