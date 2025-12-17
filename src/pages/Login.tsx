import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const TYPEWRITER_PHRASES = [
    "Descubra o 'porquê' por trás de cada venda perdida.",
    "Transforme conversas em estratégias de sucesso.",
    "IA que entende seu cliente melhor que ninguém.",
    "JetInsight: Inteligência que eleva seu atendimento."
];

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Typewriter effect state
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Login Logic
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Dados inválidos, entre em contato com o administrador.');
        } finally {
            setLoading(false);
        }
    };

    // Typewriter Logic
    useEffect(() => {
        const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
        const typeSpeed = isDeleting ? 50 : 100;

        const timer = setTimeout(() => {
            if (!isDeleting && text === currentPhrase) {
                // Finished typing, wait before deleting
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && text === '') {
                // Finished deleting, move to next phrase
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
            } else {
                // Typing or deleting
                const nextText = isDeleting
                    ? currentPhrase.substring(0, text.length - 1)
                    : currentPhrase.substring(0, text.length + 1);
                setText(nextText);
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [text, isDeleting, phraseIndex]);

    return (
        <div className="h-screen w-full flex">
            {/* Left Side - Branding/Typewriter */}
            <div className="hidden md:flex w-1/2 bg-primary items-center justify-center p-12 text-primary-foreground relative overflow-hidden">
                {/* Abstract Circles Background */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-50px] left-[-50px] w-64 h-64 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 rounded-full bg-black blur-3xl"></div>
                </div>

                <div className="max-w-lg z-10 text-center md:text-left flex flex-col justify-center">
                    <div className="min-h-[160px] flex items-start text-4xl md:text-5xl font-extrabold leading-tight mb-8">
                        <span>
                            {text}
                            <span className="animate-pulse">|</span>
                        </span>
                    </div>
                    <p className="text-lg text-primary-foreground/90">
                        Potencialize sua equipe com a melhor plataforma de análise de conversas do mercado.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center space-y-2 flex flex-col items-center">
                        <img src="/jetinsight-logo.png" alt="JetInsight Logo" className="h-12 w-auto mb-2" />
                        <p className="text-muted-foreground">Analise suas conversas com IA</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seunome@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Entrar
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>Ainda não tem acesso? Contate o administrador.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
