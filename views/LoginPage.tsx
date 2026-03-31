import React, { useState } from 'react';
import { auth, googleProvider } from '@/services/firebase';
import { signInWithPopup } from 'firebase/auth';

const LoginPage: React.FC<{ onLogin: (username: string) => void; theme: 'light' | 'dark'; toggleTheme: () => void }> = ({ onLogin, theme, toggleTheme }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username.trim());
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user && result.user.email) {
                // Usamos o e-mail ou nome (limpo) como identificador de conta para Firestore
                onLogin(result.user.email);
            }
        } catch (error) {
            console.error("Erro no login Google:", error);
            alert("Falha ao autenticar com Google. Verifique o console.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--apple-bg)] p-6 font-sans selection:bg-[var(--apple-accent)]/30 transition-colors duration-500 relative">
            <div className="absolute top-8 right-8 text-center">
                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-[var(--apple-card-bg)] border border-[var(--apple-border)] text-[var(--apple-text)] shadow-sm hover:scale-110 transition-all active:scale-95"
                    aria-label="Alternar tema"
                >
                    {theme === 'light' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4-9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 17.657l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="w-full max-w-md">
                <div className="text-center mb-12 animate-fade-in text-nowrap">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[24px] bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] text-white font-black text-5xl shadow-2xl shadow-[#0071E3]/30 mb-8 transform hover:scale-105 transition-transform duration-500">AT</div>
                    <h1 className="text-5xl font-extrabold text-[var(--apple-text)] tracking-tight mb-4">ATSiteStatus</h1>
                    <p className="text-xl font-medium text-[var(--apple-text-secondary)]">Monitoramento com precisão na nuvem.</p>
                </div>

                <div className="glass apple-card p-12 border-none animate-fade-in-slide-up">
                    <h2 className="text-2xl font-bold text-[var(--apple-text)] mb-10 text-center tracking-tight">Acesse sua conta</h2>
                    
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-16 mb-8 flex items-center justify-center gap-4 bg-white text-gray-700 rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Entrar com Google
                    </button>

                    <div className="relative mb-10 text-center">
                        <hr className="border-[var(--apple-border)]" />
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 bg-[var(--apple-card-bg)] text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest">Ou use manual</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label htmlFor="username" className="block text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-3 ml-1">Nome de Usuário</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="apple-input w-full text-base placeholder:text-[var(--apple-text-secondary)]/50"
                                placeholder="ID da Conta"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="apple-button w-full py-5 text-base font-bold shadow-2xl shadow-[#0071E3]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
                            disabled={!username.trim() || isLoading}
                        >
                            Logar Manualmente
                        </button>
                    </form>
                    
                    <div className="mt-10 pt-10 border-t border-[var(--apple-border)] text-center">
                        <p className="text-xs font-medium text-[var(--apple-text-secondary)] leading-relaxed">
                            Dados sincronizados na nuvem via Firebase. <br/> Use o mesmo identificador para acessar seus sites.
                        </p>
                    </div>
                </div>
                
                <p className="mt-12 text-center text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} ATSiteStatus. Design inspirado em Cupertino.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
