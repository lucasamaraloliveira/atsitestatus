import React, { useState } from 'react';
import { auth, googleProvider, db } from '@/services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Moon, Sun } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LoginPage: React.FC<{ 
    onLogin: (username: string, password?: string) => Promise<boolean>; 
    onRegister: (username: string, password: string, name: string) => Promise<boolean>;
    theme: 'light' | 'dark'; 
    toggleTheme: () => void 
}> = ({ onLogin, onRegister, theme, toggleTheme }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;
        
        setIsLoading(true);
        let success = false;
        
        if (isRegister) {
            if (!name.trim()) {
                alert("Por favor, informe seu nome.");
                setIsLoading(false);
                return;
            }
            success = await onRegister(username.trim(), password, name.trim());
        } else {
            success = await onLogin(username.trim(), password);
        }
        
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user && result.user.email) {
                // Login via Google não exige password no nosso sistema
                await onLogin(result.user.email);
            }
        } catch (error) {
            console.error("Erro no login Google:", error);
            alert("Falha ao autenticar com Google. Verifique o console.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--apple-bg)] p-6 font-sans selection:bg-[var(--apple-accent)]/30 transition-colors duration-500 relative overflow-hidden">
            {/* Background elements for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--apple-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--apple-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="absolute top-8 right-8">
                <button 
                    onClick={toggleTheme}
                    className="p-3.5 rounded-full glass border border-[var(--apple-border)] text-[var(--apple-text)] shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group"
                    aria-label="Alternar tema"
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        {theme === 'light' ? (
                            <Moon size={20} className="text-[var(--apple-text)] animate-fade-in group-hover:-rotate-12 transition-transform" />
                        ) : (
                            <Sun size={20} className="text-[var(--apple-text)] animate-fade-in group-hover:rotate-45 transition-transform" />
                        )}
                    </div>
                </button>
            </div>
            
            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] text-white font-black text-4xl shadow-2xl shadow-[#0071E3]/30 mb-6 transform hover:scale-105 transition-transform duration-500">AT</div>
                    <h1 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight mb-2 lowercase">atsitestatus</h1>
                    <p className="text-sm font-medium text-[var(--apple-text-secondary)]">Monitoramento com precisão na nuvem.</p>
                </div>

                <div className="glass apple-card p-10 border-none animate-fade-in-slide-up bg-white/40 dark:bg-black/20">
                    <h2 className="text-2xl font-bold text-[var(--apple-text)] mb-8 text-center tracking-tight">
                        {isRegister ? 'Crie sua conta' : 'Acesse sua conta'}
                    </h2>
                    
                    {!isRegister && (
                        <>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full h-12 mb-6 flex items-center justify-center gap-4 bg-white dark:bg-white/90 text-gray-700 rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-sm">Google</span>
                            </button>

                            <div className="relative mb-8 text-center">
                                <hr className="border-[var(--apple-border)]" />
                                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 glass text-[8px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest backdrop-blur-none bg-transparent">Ou administrativo</span>
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <div>
                                <label htmlFor="name" className="block text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="apple-input w-full text-sm bg-[var(--apple-input-bg)]/50 focus:bg-[var(--apple-input-bg)]"
                                    placeholder="Como quer ser chamado?"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2 ml-1">Usuário / Email</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="apple-input w-full text-sm bg-[var(--apple-input-bg)]/50 focus:bg-[var(--apple-input-bg)]"
                                placeholder="ex: lucas@gmail.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="pass" className="block text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2 ml-1">Senha de Acesso</label>
                            <input
                                id="pass"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="apple-input w-full text-sm bg-[var(--apple-input-bg)]/50 focus:bg-[var(--apple-input-bg)]"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="apple-button w-full h-12 text-sm font-bold shadow-xl shadow-[#0071E3]/20 disabled:opacity-50 mt-2 transition-all"
                            disabled={!username.trim() || !password.trim() || isLoading}
                        >
                            {isLoading ? 'Aguarde...' : (isRegister ? 'Criar Minha Conta' : 'Entrar no Sistema')}
                        </button>
                    </form>
                    
                    <div className="mt-8 text-center animate-fade-in">
                        <button 
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs font-bold text-[var(--apple-accent)] hover:underline"
                        >
                            {isRegister ? 'Já possui conta? Faça login' : 'Não tem conta? Registre-se agora'}
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[var(--apple-border)] text-center">
                        <p className="text-[10px] font-medium text-[var(--apple-text-secondary)] leading-relaxed">
                            Dados protegidos por criptografia em nuvem. <br/> Acesso multi-dispostivo sincronizado.
                        </p>
                    </div>
                </div>
                
                <p className="mt-10 text-center text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest opacity-60">
                    &copy; {new Date().getFullYear()} ATSiteStatus. Cupertino Design.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
