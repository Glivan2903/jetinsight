import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';


interface TranscriptViewerProps {
    transcript: string;
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
    // ... logic ...

    // In return:
    // <img src={logo} ... />

    let messages: { id: number; role: 'agent' | 'customer'; content: string }[] = [];

    try {
        // Try parsing as JSON first (for real DB data)
        const parsed = JSON.parse(transcript);
        if (Array.isArray(parsed)) {
            messages = parsed.map((msg, index) => {
                // Heuristics for different JSON structures
                // User Request: use 'body' as message and 'from' for role
                const content = msg.body || msg.message || msg.content || msg.text || JSON.stringify(msg);

                // Determine role
                // If 'from' exists, try to determine if it's agent or customer.
                // Common patterns: 'me' (agent), 'user' (agent), or checking if it matches customer phone (we don't have it here).
                // Let's assume if it is NOT having 'me' or 'agent' or 'assistant', it might be customer.
                // OR: Maybe the user's system sends 'fromME': true?
                // Let's stick to the user instruction: "frome para identificar se a mensagem foi enviada ou recebida"
                // I will assume if msg.from is present, I check typical agent values.

                let isAgent = false;
                if (msg.fromMe !== undefined) {
                    isAgent = msg.fromMe;
                } else if (msg.from) {
                    const fromStr = String(msg.from).toLowerCase();
                    isAgent = fromStr === 'me' || fromStr.includes('agent') || fromStr.includes('atendente') || fromStr.includes('admin') || fromStr === 'true'; // 'true' ?? just in case
                } else if (msg.role) {
                    const roleLower = msg.role.toLowerCase();
                    isAgent = roleLower === 'agent' || roleLower === 'assistant' || roleLower === 'system' || roleLower === 'atendente';
                }

                return {
                    id: index,
                    role: isAgent ? 'agent' : 'customer',
                    content
                };
            });
        }
    } catch (e) {
        // Fallback to text parsing (legacy/mock format)
        messages = transcript.split('\n').map((line, index) => {
            const isAtendente = line.toLowerCase().startsWith('atendente:');
            const content = line.replace(/^(Atendente|Cliente):/i, '').trim();

            return {
                id: index,
                role: isAtendente ? 'agent' : 'customer',
                content
            };
        });
    }

    // Fallback if JSON parsed but was empty or invalid structure resulted in empty array (and original wasn't empty)
    if (messages.length === 0 && transcript.length > 0 && !transcript.trim().startsWith('[')) {
        messages = transcript.split('\n').map((line, index) => {
            const isAtendente = line.toLowerCase().startsWith('atendente:');
            const content = line.replace(/^(Atendente|Cliente):/i, '').trim();

            return {
                id: index,
                role: isAtendente ? 'agent' : 'customer',
                content
            };
        });
    }

    return (
        <Card className="h-full flex flex-col border-0 shadow-none">
            <CardHeader className="border-b px-6 py-4 flex flex-row items-center gap-4 space-y-0">
                <div className="relative h-10 w-32">
                    <img src="/src/assets/logo-jetsales.png" alt="JetSales" className="object-contain h-full w-full object-left" />
                </div>
                <div className="h-6 w-px bg-border mx-2" />
                <CardTitle className="text-lg">Transcrição da Conversa</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-6 p-6 bg-slate-50/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-4",
                            msg.role === 'agent' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {/* Avatar */}
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2",
                            msg.role === 'agent' ? "border-[#00E5FF]/20 bg-white p-1" : "bg-white border-gray-100"
                        )}>
                            {msg.role === 'agent' ? (
                                <img src="/src/assets/logo-jetsales.png" alt="Agent" className="w-full h-full object-contain" />
                            ) : (
                                <User className="w-5 h-5 text-gray-400" />
                            )}
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                            "max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm",
                            msg.role === 'agent'
                                ? "bg-primary text-primary-foreground rounded-tr-none" // Brand Green
                                : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
