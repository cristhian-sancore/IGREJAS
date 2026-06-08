import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, RefreshCw, MapPin, Calendar, Smartphone, UserCheck, Ghost, Bell } from 'lucide-react';
import { membersApi } from '../services/api';

const Members = () => {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [newMember, setNewMember] = useState({
        name: '',
        phone: '',
        address: '',
        birth_date: '',
        is_baptized: 0,
        is_visitor: 0,
        is_active: 1,
        accepts_notifications: 1
    });

    const loadMembers = async () => {
        setLoading(true);
        try {
            const data = await membersApi.list();
            setMembers(data);
            setError('');
        } catch (err: any) {
            setError('Erro ao conectar com o banco Firebird 2.5');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    const handleEdit = (member: any) => {
        setEditingId(member.id);
        setNewMember({
            name: member.name,
            phone: member.phone || '',
            address: member.address || '',
            birth_date: member.birth_date || '',
            is_baptized: member.is_baptized,
            is_visitor: member.is_visitor,
            is_active: member.is_active,
            accepts_notifications: member.accepts_notifications
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await membersApi.update(editingId, newMember);
            } else {
                await membersApi.create(newMember);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setNewMember({
                name: '',
                phone: '',
                address: '',
                birth_date: '',
                is_baptized: 0,
                is_visitor: 0,
                is_active: 1,
                accepts_notifications: 1
            });
            loadMembers();
        } catch (err) {
            alert('Erro ao salvar membro no Firebird.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Deseja realmente excluir este membro?')) {
            try {
                await membersApi.delete(id);
                loadMembers();
            } catch (err) {
                alert('Erro ao excluir membro.');
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestão de Membros</h2>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-widestAlpha">Secretaria e Rol de Membros</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadMembers} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all border border-white/5">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewMember({ name: '', phone: '', address: '', birth_date: '', is_baptized: 0, is_visitor: 0, is_active: 1, accepts_notifications: 1 });
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-[#c5a059]/10"
                    >
                        <UserPlus size={20} />
                        Cadastrar Membro
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3">
                    <span className="text-xl">⚠️</span> {error}
                </div>
            )}

            <div className="admin-glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-6">Membro / Identificação</th>
                                <th className="px-8 py-6">Endereço / Contato</th>
                                <th className="px-8 py-6 text-center">Batizado</th>
                                <th className="px-8 py-6 text-center">Categoria</th>
                                <th className="px-8 py-6 text-center">Notificações</th>
                                <th className="px-8 py-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-bold uppercase text-[10px]">Sincronizando com Firebird SQL...</td></tr>
                            ) : members.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 italic">Nenhum registro encontrado no banco local.</td></tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#c5a059] to-[#8a6d35] rounded-2xl flex items-center justify-center font-black text-black shadow-lg">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-white block">{member.name}</span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} />
                                                        Nasc: {member.birth_date ? new Date(member.birth_date).toLocaleDateString('pt-BR') : 'Não inf.'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <span className="text-sm text-slate-300 block max-w-xs truncate">{member.address || 'Sem endereço'}</span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Smartphone size={10} /> {member.phone || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${member.is_baptized === 1
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                                                {member.is_baptized === 1 ? 'Sim' : 'Não'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${member.is_visitor === 1
                                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                {member.is_visitor === 1 ? 'Visitante' : 'Membro'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`p-2 rounded-lg inline-flex ${member.accepts_notifications === 1 ? 'bg-[#c5a059]/10 text-[#c5a059]' : 'bg-slate-800 text-slate-600'}`}>
                                                <Bell size={14} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(member)} className="p-2 hover:bg-[#c5a059]/10 rounded-xl transition-colors text-slate-400 hover:text-[#c5a059]">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-slate-400 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Cadastro/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="admin-glass w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-scale-up shadow-2xl border border-white/10">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">{editingId ? 'Editar Membro' : 'Ficha de Cadastro'}</h3>
                                <p className="text-xs text-[#c5a059] font-bold mt-1 uppercase tracking-wider">{editingId ? 'Atualizando Registro Existente' : 'Novo Registro no Banco de Dados'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-500 hover:text-white transition-colors border border-white/5">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-left block">Nome Completo</label>
                                    <input type="text" required className="input-admin h-14 text-lg font-bold" placeholder="Digite o nome do membro" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-left block">Data de Nascimento</label>
                                    <input type="date" className="input-admin h-12" value={newMember.birth_date} onChange={e => setNewMember({ ...newMember, birth_date: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-left block">Celular / WhatsApp</label>
                                    <input type="text" className="input-admin h-12" placeholder="(00) 00000-0000" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-left block">Endereço Residencial</label>
                                    <input type="text" className="input-admin h-12" placeholder="Rua, Número, Bairro, Cidade..." value={newMember.address} onChange={e => setNewMember({ ...newMember, address: e.target.value })} />
                                </div>

                                <div className="flex bg-slate-900/50 p-4 rounded-2xl border border-white/5 items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><UserCheck size={18} /></div>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">É Batizado?</span>
                                    </div>
                                    <input type="checkbox" checked={newMember.is_baptized === 1} onChange={e => setNewMember({ ...newMember, is_baptized: e.target.checked ? 1 : 0 })} className="w-6 h-6 rounded-lg bg-slate-800 border-white/10 text-[#c5a059]" />
                                </div>

                                <div className="flex bg-slate-900/50 p-4 rounded-2xl border border-white/5 items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg"><Ghost size={18} /></div>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">É Visitante?</span>
                                    </div>
                                    <input type="checkbox" checked={newMember.is_visitor === 1} onChange={e => setNewMember({ ...newMember, is_visitor: e.target.checked ? 1 : 0 })} className="w-6 h-6 rounded-lg bg-slate-800 border-white/10 text-[#c5a059]" />
                                </div>

                                <div className="flex bg-slate-900/50 p-4 rounded-2xl border border-white/5 items-center justify-between md:col-span-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#c5a059]/10 text-[#c5a059] rounded-lg"><Bell size={18} /></div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Receber Notificações Automáticas?</span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Avisos de eventos, aniversários e financeiro via WhatsApp</span>
                                        </div>
                                    </div>
                                    <input type="checkbox" checked={newMember.accepts_notifications === 1} onChange={e => setNewMember({ ...newMember, accepts_notifications: e.target.checked ? 1 : 0 })} className="w-6 h-6 rounded-lg bg-slate-800 border-white/10 text-[#c5a059]" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors font-black text-[10px] uppercase tracking-[0.3em]">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-[#c5a059]/20 transition-all">
                                    {saving ? 'Gravando...' : editingId ? 'Salvar Edição' : 'Cadastrar Membro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;
