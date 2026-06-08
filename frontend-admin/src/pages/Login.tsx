import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Church } from 'lucide-react';
import { authApi } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const data = await authApi.login(formData);
            localStorage.setItem('token', data.access_token);
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-mesh p-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c5a059] rounded-2xl mb-6 shadow-2xl shadow-[#c5a059]/20">
                        <Church size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel ChMS</h1>
                    <p className="text-slate-500 mt-2">Gestão Inteligente para a sua Igreja</p>
                </div>

                <div className="admin-glass p-8 rounded-3xl space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-center text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 ml-1">E-mail de Acesso</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-admin pl-12 h-14"
                                    placeholder="admin@igreja.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-slate-400">Senha</label>
                                <a href="#" className="text-xs text-[#c5a059] hover:underline">Esqueceu a senha?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-admin pl-12 h-14"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-2 text-lg mt-6 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Entrar no Sistema
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-600">
                        Acesso restrito a administradores autorizados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
