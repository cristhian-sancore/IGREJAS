import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import api from '../services/api';

const Events = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isIdOpen, setIsIdOpen] = useState(false); // Modal de criação/edição
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        event_date: '',
        is_public: 1,
        image_url: '',
        image_base64: ''
    });

    const loadEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/events');
            setEvents(res.data);
        } catch (err) {
            console.error("Erro ao carregar eventos", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingEventId) {
                await api.put(`/admin/events/${editingEventId}`, {
                    ...newEvent,
                    event_date: new Date(newEvent.event_date).toISOString()
                });
            } else {
                await api.post('/admin/events', {
                    ...newEvent,
                    event_date: new Date(newEvent.event_date).toISOString()
                });
            }
            setIsIdOpen(false);
            setEditingEventId(null);
            setNewEvent({ title: '', description: '', event_date: '', is_public: 1, image_url: '', image_base64: '' });
            loadEvents();
        } catch (err) {
            alert("Erro ao salvar evento");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (event: any) => {
        // Formatar data para o input datetime-local (YYYY-MM-DDTHH:mm)
        const date = new Date(event.event_date);
        const formattedDate = date.toISOString().slice(0, 16);

        setNewEvent({
            title: event.title,
            description: event.description || '',
            event_date: formattedDate,
            is_public: event.is_public,
            image_url: event.image_url || '',
            image_base64: event.image_base64 || ''
        });
        setEditingEventId(event.id);
        setIsIdOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Deletar este evento?")) return;
        try {
            await api.delete(`/admin/events/${id}`);
            loadEvents();
        } catch (err) {
            alert("Erro ao deletar");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold italic tracking-tight">Agenda / Eventos</h2>
                    <p className="text-slate-500 mt-1">Gerencie os cultos e atividades da sua igreja</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadEvents} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setIsIdOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Novo Evento
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-500">Buscando agenda no Firebird...</div>
                ) : events.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 italic">Nenhum evento programado.</div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="admin-glass rounded-[2rem] border border-white/5 overflow-hidden group hover:border-[#c5a059]/30 transition-all flex flex-col shadow-2xl">
                            {(event.image_url || event.image_base64) && (
                                <div className="h-48 w-full overflow-hidden relative">
                                    <img src={event.image_base64 ? `data:image/jpeg;base64,${event.image_base64}` : event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                                </div>
                            )}
                            <div className="p-8 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${(event.image_url || event.image_base64) ? 'bg-white/10 backdrop-blur-md' : 'bg-[#c5a059]/10'} text-[#c5a059]`}>
                                        <CalendarIcon size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(event)} className="p-2 text-slate-600 hover:text-[#c5a059] transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                <p className="text-slate-400 text-sm line-clamp-2 mb-6">{event.description || 'Sem descrição.'}</p>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <Clock size={16} className="text-[#c5a059]" />
                                        <span>{new Date(event.event_date).toLocaleDateString('pt-BR')} às {new Date(event.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <MapPin size={16} className="text-[#c5a059]" />
                                        <span>Templo Principal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Novo Evento */}
            {isIdOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="admin-glass w-full max-w-lg rounded-3xl overflow-hidden animate-scale-up shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-bold tracking-widest uppercase text-xs opacity-60">
                                {editingEventId ? 'Editar Evento' : 'Novo Evento da Agenda'}
                            </h3>
                            <button onClick={() => { setIsIdOpen(false); setEditingEventId(null); }} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Título do Evento</label>
                                    <input
                                        type="text" required className="input-admin"
                                        placeholder="Ex: Culto de Jovens, Santa Ceia..."
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Data e Hora</label>
                                    <input
                                        type="datetime-local" required className="input-admin"
                                        value={newEvent.event_date}
                                        onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Descrição / Detalhes</label>
                                    <textarea
                                        rows={3} className="input-admin resize-none"
                                        placeholder="Opcional: detalhes sobre o evento..."
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Banner do Evento (Upload)</label>
                                    <div className="flex flex-col gap-4">
                                        <input
                                            type="file" accept="image/*"
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#c5a059]/10 file:text-[#c5a059] hover:file:bg-[#c5a059]/20 transition-all"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64String = reader.result as string;
                                                        // Remover o prefixo "data:image/...;base64," para o backend
                                                        const cleanBase64 = base64String.split(',')[1];
                                                        setNewEvent({ ...newEvent, image_base64: cleanBase64 });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        {newEvent.image_base64 && (
                                            <div className="h-32 w-full rounded-2xl overflow-hidden border border-white/5">
                                                <img src={`data:image/jpeg;base64,${newEvent.image_base64}`} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic ml-1">Esta imagem será enviada no WhatsApp.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => { setIsIdOpen(false); setEditingEventId(null); }} className="flex-1 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors font-bold text-xs uppercase tracking-widest">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[#c5a059]/20">
                                    {saving ? 'Salvando...' : editingEventId ? 'Atualizar Evento' : 'Confirmar Evento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
