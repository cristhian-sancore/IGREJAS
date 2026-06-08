import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, RefreshCw, Tag, Edit2, Trash2, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Finance = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [newTrans, setNewTrans] = useState({
        description: '',
        amount: '',
        category: '',
        trans_type: 'OUT',
        due_date: '',
        payment_date: '',
        is_paid: 0
    });

    const [newCat, setNewCat] = useState({ name: '', cat_type: 'IN' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [transRes, catsRes] = await Promise.all([
                api.get('/admin/financial'),
                api.get('/admin/categories')
            ]);
            setTransactions(transRes.data);
            setCategories(catsRes.data);

            if (catsRes.data.length > 0 && !newTrans.category) {
                setNewTrans(prev => ({ ...prev, category: catsRes.data[0].name }));
            }
        } catch (err: any) {
            console.error('Erro ao carregar dados do Firebird.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...newTrans,
                amount: parseFloat(newTrans.amount),
                due_date: newTrans.due_date || null,
                payment_date: newTrans.payment_date || null,
            };

            if (editingId) {
                await api.put(`/admin/financial/${editingId}`, payload);
            } else {
                await api.post('/admin/financial', payload);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setNewTrans({
                description: '',
                amount: '',
                category: categories[0]?.name || '',
                trans_type: 'OUT',
                due_date: '',
                payment_date: '',
                is_paid: 0
            });
            loadData();
        } catch (err) {
            alert('Erro ao salvar transação.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (t: any) => {
        setEditingId(t.id);
        setNewTrans({
            description: t.description,
            amount: t.amount.toString(),
            category: t.category,
            trans_type: t.trans_type,
            due_date: t.due_date ? t.due_date.split('T')[0] : '',
            payment_date: t.payment_date ? t.payment_date.split('T')[0] : '',
            is_paid: t.is_paid
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
        try {
            await api.delete(`/admin/financial/${id}`);
            loadData();
        } catch (err) {
            alert('Erro ao excluir lançamento.');
        }
    };

    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/categories', newCat);
            setIsCatModalOpen(false);
            setNewCat({ name: '', cat_type: 'IN' });
            loadData();
        } catch (err) {
            alert('Erro ao salvar categoria.');
        } finally {
            setSaving(false);
        }
    };

    const totals = transactions.reduce((acc, curr) => {
        if (curr.trans_type === 'IN') acc.incomes += curr.amount;
        else acc.expenses += curr.amount;
        return acc;
    }, { incomes: 0, expenses: 0 });

    const balance = totals.incomes - totals.expenses;
    const filteredCategories = categories.filter(c => c.cat_type === newTrans.trans_type);

    const getStatusInfo = (t: any) => {
        if (t.trans_type === 'IN') return null;
        if (t.is_paid === 1) return { label: 'Pago', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <CheckCircle2 size={12} /> };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = t.due_date ? new Date(t.due_date) : null;

        if (dueDate && dueDate < today) return { label: 'Atrasado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <AlertCircle size={12} /> };
        return { label: 'Pendente', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <Clock size={12} /> };
    };

    return (
        <div className="space-y-8 animate-fade-in text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <DollarSign className="text-[#c5a059]" />
                        Gestão Financeira
                    </h2>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[0.2em]">Controle de Caixa e Contas a Pagar</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadData} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all border border-white/5">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setIsCatModalOpen(true)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all text-[#c5a059] border border-white/5" title="Gerenciar Categorias">
                        <Tag size={20} />
                    </button>
                    <button onClick={() => {
                        setEditingId(null);
                        setNewTrans({ description: '', amount: '', category: categories.filter(c => c.cat_type === 'OUT')[0]?.name || '', trans_type: 'OUT', due_date: '', payment_date: '', is_paid: 0 });
                        setIsModalOpen(true)
                    }} className="btn-primary flex items-center gap-2 h-12 px-6 shadow-lg shadow-[#c5a059]/20 font-black text-xs uppercase tracking-widestAlpha">
                        <Plus size={20} />
                        Novo Lançamento
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="admin-glass p-8 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={80} />
                    </div>
                    <div className="flex items-center justify-between mb-6 relative">
                        <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 border border-green-500/20 shadow-lg shadow-green-500/5">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Receitas</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Entradas Totais</p>
                    <h3 className="text-3xl font-black text-white mt-1">R$ {totals.incomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>

                <div className="admin-glass p-8 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-red-500">
                        <TrendingDown size={80} />
                    </div>
                    <div className="flex items-center justify-between mb-6 relative">
                        <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">Despesas</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Saídas Totais</p>
                    <h3 className="text-3xl font-black text-white mt-1">R$ {totals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>

                <div className="admin-glass p-8 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-[#c5a059]">
                        <DollarSign size={80} />
                    </div>
                    <div className="flex items-center justify-between mb-6 relative">
                        <div className="p-4 bg-[#c5a059]/10 rounded-2xl text-[#c5a059] border border-[#c5a059]/20 shadow-lg shadow-[#c5a059]/5">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest bg-[#c5a059]/10 px-3 py-1 rounded-full border border-[#c5a059]/20">Caixa</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Saldo Disponível</p>
                    <h3 className="text-3xl font-black text-white mt-1">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Tabela de Transações */}
            <div className="admin-glass rounded-[2rem] overflow-hidden mt-8 shadow-2xl border border-white/5">
                <div className="overflow-x-auto text-left">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-6">Identificação / Categ</th>
                                <th className="px-8 py-6">Fluxo / Datas</th>
                                <th className="px-8 py-6 text-center">Status Pagto</th>
                                <th className="px-8 py-6 text-right">Valor Líquido</th>
                                <th className="px-8 py-6 text-center w-32 font-bold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando com Firebird SQL...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-24 text-center text-slate-500 font-medium">Nenhum lançamento registrado no banco de dados.</td></tr>
                            ) : (
                                transactions.map((t) => {
                                    const status = getStatusInfo(t);
                                    return (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-[#c5a059] transition-colors">{t.description}</span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{t.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1 text-[11px]">
                                                    <span className="text-slate-400 flex items-center gap-2">
                                                        <Calendar size={12} className="text-slate-600" />
                                                        Lançamento: {new Date(t.trans_date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    {t.trans_type === 'OUT' && t.due_date && (
                                                        <span className="text-slate-400 flex items-center gap-2">
                                                            <Clock size={12} className="text-slate-600" />
                                                            Vencimento: {new Date(t.due_date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                    {t.is_paid === 1 && t.payment_date && (
                                                        <span className="text-green-500/80 flex items-center gap-2 font-bold">
                                                            <CheckCircle2 size={12} />
                                                            Pago em: {new Date(t.payment_date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {status ? (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border animate-fade-in ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Receita</span>
                                                )}
                                            </td>
                                            <td className={`px-8 py-6 text-right font-black text-lg ${t.trans_type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                                {t.trans_type === 'IN' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(t)} className="p-3 bg-slate-800 rounded-xl text-blue-400 hover:bg-blue-500/10 border border-white/5 transition-all" title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id)} className="p-3 bg-slate-800 rounded-xl text-red-400 hover:bg-red-500/10 border border-white/5 transition-all" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="admin-glass w-full max-w-xl rounded-[2.5rem] overflow-hidden animate-scale-up shadow-2xl border border-white/10">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                                <p className="text-xs text-[#c5a059] font-bold mt-1 uppercase tracking-wider">Controle de Fluxo de Caixa</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-500 hover:text-white transition-colors border border-white/5">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-8 text-left">
                            <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-900 rounded-2xl border border-white/5 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const defaultIn = categories.find(c => c.cat_type === 'IN')?.name || '';
                                        setNewTrans({ ...newTrans, trans_type: 'IN', category: defaultIn, is_paid: 1 });
                                    }}
                                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${newTrans.trans_type === 'IN' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Faturamento (+)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const defaultOut = categories.find(c => c.cat_type === 'OUT')?.name || '';
                                        setNewTrans({ ...newTrans, trans_type: 'OUT', category: defaultOut });
                                    }}
                                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${newTrans.trans_type === 'OUT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Gasto / Saída (-)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Descrição</label>
                                    <input
                                        type="text" required className="input-admin h-14 text-lg font-bold"
                                        placeholder="Ex: Pagamento conta de Luz"
                                        value={newTrans.description}
                                        onChange={e => setNewTrans({ ...newTrans, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Valor (R$)</label>
                                    <input
                                        type="number" step="0.01" required className="input-admin h-12 font-black text-white"
                                        placeholder="0,00"
                                        value={newTrans.amount}
                                        onChange={e => setNewTrans({ ...newTrans, amount: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Categoria</label>
                                    <select
                                        className="input-admin h-12 bg-slate-900 border-none"
                                        value={newTrans.category}
                                        onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}
                                    >
                                        {filteredCategories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {newTrans.trans_type === 'OUT' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Data de Vencimento</label>
                                            <input
                                                type="date" className="input-admin h-12"
                                                value={newTrans.due_date}
                                                onChange={e => setNewTrans({ ...newTrans, due_date: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex bg-slate-900/50 p-4 rounded-2xl border border-white/5 items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${newTrans.is_paid === 1 ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-600'}`}>
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Já está pago?</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={newTrans.is_paid === 1}
                                                onChange={e => setNewTrans({
                                                    ...newTrans,
                                                    is_paid: e.target.checked ? 1 : 0,
                                                    payment_date: e.target.checked ? new Date().toISOString().split('T')[0] : ''
                                                })}
                                                className="w-6 h-6 rounded-lg bg-slate-800 border-white/10 text-[#c5a059]"
                                            />
                                        </div>

                                        {newTrans.is_paid === 1 && (
                                            <div className="space-y-2 md:col-span-2 animate-fade-in">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Data do Pagamento</label>
                                                <input
                                                    type="date" className="input-admin h-12 border-green-500/30"
                                                    value={newTrans.payment_date}
                                                    onChange={e => setNewTrans({ ...newTrans, payment_date: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors font-black text-[10px] uppercase tracking-[0.3em]">Cancelar</button>
                                <button type="submit" disabled={saving} className={`flex-1 ${editingId ? 'bg-blue-600' : 'btn-primary'} py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl transition-all`}>
                                    {saving ? 'Gravando...' : (editingId ? 'Salvar Alterações' : 'Confirmar Lançamento')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Gerenciar Categorias */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="admin-glass w-full max-w-md rounded-[2.5rem] overflow-hidden animate-scale-up shadow-2xl border border-white/10">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Dicionário de Categorias</h3>
                            <button onClick={() => setIsCatModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-500 hover:text-white transition-colors border border-white/5">✕</button>
                        </div>

                        <div className="p-10 space-y-8">
                            <form onSubmit={handleSaveCat} className="space-y-4">
                                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Novo Nome</label>
                                        <input
                                            type="text" required className="input-admin bg-slate-900 border-transparent h-11"
                                            placeholder="Ex: Reforma da Fachada"
                                            value={newCat.name}
                                            onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-2 text-left">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo Fluxo</label>
                                            <select
                                                className="input-admin bg-slate-900 border-transparent h-11"
                                                value={newCat.cat_type}
                                                onChange={e => setNewCat({ ...newCat, cat_type: e.target.value })}
                                            >
                                                <option value="IN">Entrada (+)</option>
                                                <option value="OUT">Saída (-)</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" disabled={saving} className="h-11 px-6 bg-[#c5a059] text-black rounded-xl hover:bg-[#b08e4d] transition-all disabled:opacity-50 shadow-lg shadow-[#c5a059]/20">
                                                <Plus size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="space-y-4 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block border-b border-white/5 pb-4">Registros Salvos</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                                    {categories.length === 0 ? (
                                        <p className="text-slate-600 text-center py-8 text-sm italic">O banco está vazio...</p>
                                    ) : (
                                        categories.map(cat => (
                                            <div key={cat.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-[#c5a059]/30 transition-all group">
                                                <span className="font-bold text-sm text-slate-200 group-hover:text-[#c5a059] transition-colors">{cat.name}</span>
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-lg border ${cat.cat_type === 'IN' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    {cat.cat_type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
