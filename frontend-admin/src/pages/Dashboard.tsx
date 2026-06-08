import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Wallet, Clock, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState([
        { label: 'Total Membros', value: '...', icon: <Users />, color: 'bg-blue-500' },
        { label: 'Entradas', value: '...', icon: <TrendingUp />, color: 'bg-green-500' },
        { label: 'Saídas', value: '...', icon: <TrendingDown />, color: 'bg-red-500' },
        { label: 'Saldo Caixa', value: '...', icon: <Wallet />, color: 'bg-[#c5a059]' },
    ]);
    const [recentMembers, setRecentMembers] = useState<any[]>([]);
    const [pendingBills, setPendingBills] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, financeRes] = await Promise.all([
                    api.get('/admin/members'),
                    api.get('/admin/financial')
                ]);

                const members = membersRes.data;
                const transactions = financeRes.data;

                const incomes = transactions.filter((t: any) => t.trans_type === 'IN').reduce((a: any, b: any) => a + b.amount, 0);
                const expenses = transactions.filter((t: any) => t.trans_type === 'OUT').reduce((a: any, b: any) => a + b.amount, 0);

                setStats([
                    { label: 'Total Membros', value: members.length.toString(), icon: <Users />, color: 'bg-blue-500' },
                    { label: 'Entradas (Total)', value: `R$ ${incomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <TrendingUp />, color: 'bg-green-500' },
                    { label: 'Saídas (Total)', value: `R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <TrendingDown />, color: 'bg-red-500' },
                    { label: 'Saldo em Caixa', value: `R$ ${(incomes - expenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Wallet />, color: 'bg-[#c5a059]' },
                ]);

                setRecentMembers(members.slice(0, 5));

                // Filtrar contas a pagar (pendentes)
                const pending = transactions
                    .filter((t: any) => t.trans_type === 'OUT' && t.is_paid === 0)
                    .sort((a: any, b: any) => {
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    });

                setPendingBills(pending.slice(0, 5));

            } catch (err) {
                console.error("Erro ao carregar dashboard", err);
            }
        };
        fetchData();
    }, []);

    const getStatusInfo = (t: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = t.due_date ? new Date(t.due_date) : null;

        if (dueDate && dueDate < today) return { label: 'Atrasado', color: 'text-red-500' };
        return { label: 'A vencer', color: 'text-orange-400' };
    };

    return (
        <div className="space-y-8 animate-fade-in text-left">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Painel Executivo</h2>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[0.2em] ml-1">Secretaria e Tesouraria Consolidada</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="admin-glass p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.color} opacity-5 rounded-full group-hover:scale-110 transition-transform`}></div>
                        <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center mb-6 bg-opacity-10 text-white shadow-lg`}>
                            {stat.icon}
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                        <h3 className="text-2xl font-black text-white mt-1 break-all">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contas a Vencer (Novo) */}
                <div className="admin-glass rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Clock className="text-orange-400" size={24} />
                            Contas a Vencer
                        </h3>
                        <span className="text-[10px] font-black bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20">Urgente</span>
                    </div>
                    <div className="space-y-4">
                        {pendingBills.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle2 className="mx-auto text-green-500 opacity-20 mb-4" size={48} />
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tudo em dia!</p>
                            </div>
                        ) : (
                            pendingBills.map((bill, i) => {
                                const status = getStatusInfo(bill);
                                return (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-slate-200 group-hover:text-[#c5a059] transition-colors truncate flex-1">{bill.description}</p>
                                            <span className="font-black text-sm text-white ml-3">R$ {bill.amount.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                                <Calendar size={12} />
                                                Venc: {bill.due_date ? new Date(bill.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${status.color}`}>
                                                <AlertCircle size={10} />
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Membros Recentes */}
                <div className="lg:col-span-2 admin-glass rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                        <Users className="text-blue-400" size={24} />
                        Novos Integrantes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentMembers.length === 0 ? (
                            <p className="text-slate-500 text-center py-4 col-span-2">Nenhum membro cadastrado.</p>
                        ) : (
                            recentMembers.map((member, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#c5a059] to-[#8a6d35] rounded-xl flex items-center justify-center font-black text-black shadow-lg">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white truncate">{member.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{member.address || 'Sem endereço'}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase border border-blue-500/20">
                                        Ativo
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
