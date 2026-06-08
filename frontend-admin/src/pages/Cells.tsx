import { useState, useEffect } from 'react';
import { Home, MapPin, User, Users, Plus, Trash2, RefreshCw, Search, ExternalLink } from 'lucide-react';
import api from '../services/api';

const Cells = () => {
    const [cells, setCells] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newCell, setNewCell] = useState({
        name: '',
        address: '',
        leader: '',
        co_leader: '',
        map_url: '',
        category: 'Adultos'
    });

    const loadCells = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/cells');
            setCells(res.data);
        } catch (err) {
            console.error("Erro ao carregar células", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCells();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/cells', newCell);
            setIsModalOpen(false);
            setNewCell({ name: '', address: '', leader: '', co_leader: '', map_url: '', category: 'Adultos' });
            loadCells();
        } catch (err: any) {
            alert("Erro ao salvar no banco. Verifique se o Firebird está ligado.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Deseja realmente remover esta célula do mapeamento?")) return;
        try {
            await api.delete(`/admin/cells/${id}`);
            loadCells();
        } catch (err) {
            alert("Erro ao remover célula.");
        }
    };

    const filteredCells = cells.filter(cell =>
        cell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cell.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cell.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cell.category && cell.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getCategoryStyles = (cat: string) => {
        switch (cat) {
            case 'Jovens': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Adolescentes': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Home className="text-[#c5a059]" />
                        Mapeamento de Células
                    </h2>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[0.2em]">Expansão e Pastoreio de Grupos</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, líder ou categoria..."
                            className="input-admin pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={loadCells} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all border border-white/5">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 h-11 px-6 shadow-lg shadow-[#c5a059]/20">
                        <Plus size={20} strokeWidth={3} />
                        Nova Célula
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-500 uppercase text-xs font-bold tracking-widest text-center">Consultando Firebird...</div>
                ) : filteredCells.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 text-center">
                        <Home size={40} className="mx-auto text-slate-700 mb-4" />
                        <p>Nenhuma célula mapeada.</p>
                    </div>
                ) : (
                    filteredCells.map(cell => (
                        <div key={cell.id} className="admin-glass overflow-hidden rounded-[2rem] border border-white/5 hover:border-[#c5a059]/30 transition-all group shadow-2xl">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-2">
                                        <div className="p-4 bg-gradient-to-br from-[#c5a059] to-[#8a6d35] rounded-2xl text-black shadow-lg shadow-[#c5a059]/10">
                                            <Home size={24} />
                                        </div>
                                        {cell.map_url && (
                                            <a href={cell.map_url} target="_blank" rel="noopener noreferrer" className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl hover:bg-blue-500/20 transition-all border border-blue-500/20" title="Ver no Google Maps">
                                                <ExternalLink size={24} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button onClick={() => handleDelete(cell.id)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${getCategoryStyles(cell.category)}`}>
                                            {cell.category?.toUpperCase() || 'ADULTOS'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#c5a059] transition-colors">{cell.name}</h3>

                                <div className="flex items-start gap-3 mt-4 text-slate-400">
                                    <MapPin size={18} className="mt-1 flex-shrink-0 text-slate-600" />
                                    <p className="text-sm leading-relaxed">{cell.address}</p>
                                </div>

                                <div className="mt-8 space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                                            <User size={14} className="text-[#c5a059]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Líder</p>
                                            <p className="text-sm font-bold text-slate-200">{cell.leader}</p>
                                        </div>
                                    </div>

                                    {cell.co_leader && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                                                <Users size={14} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Co-Líder</p>
                                                <p className="text-sm font-medium text-slate-400">{cell.co_leader}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Nova Célula */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-center">
                    <div className="admin-glass w-full max-w-xl rounded-[2.5rem] overflow-hidden animate-scale-up shadow-2xl border border-white/10">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <div className="text-left">
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Nova Célula</h3>
                                <p className="text-xs text-[#c5a059] font-bold mt-1 uppercase tracking-wider">Expandindo o Reino</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-500 hover:text-white transition-colors border border-white/5">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-8 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome da Célula</label>
                                    <input
                                        type="text" required className="input-admin h-14 text-lg font-bold"
                                        placeholder="Ex: Célula Betel"
                                        value={newCell.name}
                                        onChange={e => setNewCell({ ...newCell, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Categoria de Público</label>
                                    <select
                                        className="input-admin h-12 bg-slate-900"
                                        value={newCell.category}
                                        onChange={e => setNewCell({ ...newCell, category: e.target.value })}
                                    >
                                        <option value="Adultos">Adultos</option>
                                        <option value="Jovens">Jovens</option>
                                        <option value="Adolescentes">Adolescentes</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Líder</label>
                                    <input
                                        type="text" required className="input-admin h-12"
                                        placeholder="Nome do Líder"
                                        value={newCell.leader}
                                        onChange={e => setNewCell({ ...newCell, leader: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Endereço</label>
                                    <input
                                        type="text" required className="input-admin h-12"
                                        placeholder="Rua, Número, Bairro..."
                                        value={newCell.address}
                                        onChange={e => setNewCell({ ...newCell, address: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Google Maps</label>
                                    <input
                                        type="url" className="input-admin h-12 text-blue-400 font-mono text-xs"
                                        placeholder="Link do Mapa"
                                        value={newCell.map_url}
                                        onChange={e => setNewCell({ ...newCell, map_url: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Co-Líder</label>
                                    <input
                                        type="text" className="input-admin h-12"
                                        placeholder="Nome do Co-Líder"
                                        value={newCell.co_leader}
                                        onChange={e => setNewCell({ ...newCell, co_leader: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors font-black text-[10px] uppercase tracking-[0.3em]">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-[#c5a059]/20 transition-all">
                                    {saving ? 'Gravando...' : 'Salvar Célula'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cells;
