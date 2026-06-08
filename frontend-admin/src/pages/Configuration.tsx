import { useState, useEffect } from 'react';
import { Settings, Globe, Trash2, UserPlus, ShieldCheck, Save, Smartphone, Activity, Send, RefreshCw, Users, Bell, ExternalLink, ChevronDown } from 'lucide-react';
import api from '../services/api';

const Configuration = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'webhooks' | 'templates' | 'evolution' | 'recipients' | 'automations'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [automations, setAutomations] = useState<any[]>([]);
    const [n8nWorkflows, setN8nWorkflows] = useState<any[]>([]);
    const [evolution, setEvolution] = useState({ base_url: '', api_key: '', instance_name: '', is_enabled: 0 });
    const [n8nConfig, setN8nConfig] = useState({ base_url: '', api_key: '', is_enabled: 0 });
    const [loading, setLoading] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
    const [isIframeLoading, setIsIframeLoading] = useState(false);

    // Form states
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', access_level: 'OPERADOR' });
    const [newWebhook, setNewWebhook] = useState({ url: '', event_type: 'MEMBER_CREATED', is_active: 1 });
    const [newRecipient, setNewRecipient] = useState({ name: '', phone: '', is_active: 1 });

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/config/users');
            setUsers(res.data);
        } finally {
            setLoading(false);
        }
    };

    const loadWebhooks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/config/webhooks');
            setWebhooks(res.data);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/config/templates');
            setTemplates(res.data);
        } finally {
            setLoading(false);
        }
    };

    const loadEvolution = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/config/evolution');
            setEvolution(res.data);
        } finally {
            setLoading(false);
        }
    };

    const loadRecipients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/config/recipients');
            setRecipients(res.data);
        } finally {
            setLoading(false);
        }
    };

    const loadAutomations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/config/automations');
            setAutomations(res.data);

            // Se o N8N estiver ativo, tenta carregar os workflows
            const n8nRes = await api.get('/admin/config/n8n');
            setN8nConfig(n8nRes.data);
            if (n8nRes.data.is_enabled) {
                const wfRes = await api.get('/admin/config/n8n/workflows');
                setN8nWorkflows(wfRes.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        else if (activeTab === 'webhooks') loadWebhooks();
        else if (activeTab === 'templates') loadTemplates();
        else if (activeTab === 'evolution') loadEvolution();
        else if (activeTab === 'recipients') loadRecipients();
        else if (activeTab === 'automations') loadAutomations();
    }, [activeTab]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/config/users', newUser);
            setNewUser({ name: '', email: '', password: '', access_level: 'OPERADOR' });
            loadUsers();
            alert("Usuário criado com sucesso!");
        } catch (err: any) {
            alert("Erro ao criar usuário: " + (err.response?.data?.detail || "Erro desconhecido"));
        }
    };

    const handleCreateWebhook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/config/webhooks', newWebhook);
            setNewWebhook({ url: '', event_type: 'MEMBER_CREATED', is_active: 1 });
            loadWebhooks();
            alert("Webhook configurado!");
        } catch (err) {
            alert("Erro ao configurar webhook.");
        }
    };

    const handleCreateRecipient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/config/recipients', newRecipient);
            setNewRecipient({ name: '', phone: '', is_active: 1 });
            loadRecipients();
            alert("Destinatário administrativo adicionado!");
        } catch (err) {
            alert("Erro ao adicionar destinatário.");
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm("Remover este usuário?")) return;
        await api.delete(`/admin/config/users/${id}`);
        loadUsers();
    };

    const handleDeleteWebhook = async (id: number) => {
        if (!confirm("Remover este webhook?")) return;
        await api.delete(`/admin/config/webhooks/${id}`);
        loadWebhooks();
    };

    const handleDeleteRecipient = async (id: number) => {
        if (!confirm("Remover este destinatário?")) return;
        await api.delete(`/admin/config/recipients/${id}`);
        loadRecipients();
    };

    const handleUpdateTemplate = async (eventType: string, content: string) => {
        try {
            await api.put(`/admin/config/templates/${eventType}`, { content });
            alert("Template atualizado!");
            loadTemplates();
        } catch (err) {
            alert("Erro ao atualizar template.");
        }
    };

    const handleTestTemplate = async (eventType: string) => {
        if (!testPhone) {
            alert("Por favor, informe um número de telefone para o teste (com DDD).");
            return;
        }

        // Buscar o conteúdo atual do template no estado para enviar no teste
        const currentTemplate = templates.find(t => t.event_type === eventType);
        const content = currentTemplate ? currentTemplate.content : undefined;

        try {
            setLoading(true);
            await api.post('/admin/config/templates/test', {
                event_type: eventType,
                phone: testPhone,
                content: content
            });
            alert("Mensagem de teste disparada via Evolution API!");
        } catch (err: any) {
            alert("Erro no teste: " + (err.response?.data?.detail || "Erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvolution = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/admin/config/evolution', evolution);
            alert("Configuração Evolution API salva!");
            loadEvolution();
        } catch (err) {
            alert("Erro ao salvar configuração Evolution.");
        }
    };

    const handleToggleAutomation = async (id: string, current: number) => {
        try {
            await api.put(`/admin/config/automations/${id}?is_enabled=${current === 1 ? 0 : 1}`);
            loadAutomations();
        } catch (err) {
            alert("Erro ao atualizar automação.");
        }
    };

    const handleSaveN8N = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/admin/config/n8n', n8nConfig);
            alert("Configuração N8N salva!");
            loadAutomations();
        } catch (err: any) {
            alert("Erro ao salvar n8n: " + (err.response?.data?.detail || err.message));
        }
    };

    const getVariableInfo = (type: string) => {
        switch (type) {
            case 'BIRTHDAY': return '{name}, {phone}, {address}';
            case 'EVENT': return '{title}, {time}, {description}';
            case 'MEMBER_CREATED': return '{name}, {phone}, {address}';
            case 'FINANCIAL_TRANSACTION': return '{description}, {amount}, {type}, {category}';
            case 'EVENT_CREATED': return '{title}, {date}, {description}';
            default: return '';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
                        <Settings className="text-[#c5a059]" />
                        Configurações
                    </h2>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[0.2em]">Gestão de Integrações e Acesso</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 scrollbar-hide overflow-x-auto whitespace-nowrap">
                    {[
                        { id: 'users', label: 'Usuários' },
                        { id: 'webhooks', label: 'Webhooks' },
                        { id: 'templates', label: 'Templates' },
                        { id: 'evolution', label: 'WhatsApp' },
                        { id: 'recipients', label: 'Adm Notificações' },
                        { id: 'automations', label: 'Fluxos' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${activeTab === tab.id ? 'bg-[#c5a059] text-black shadow-[#c5a059]/10' : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {activeTab === 'users' || activeTab === 'webhooks' || activeTab === 'recipients' ? (
                    <div className="admin-glass p-8 rounded-[2rem] border border-white/5 h-fit">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            {activeTab === 'users' ? <UserPlus size={20} className="text-[#c5a059]" /> :
                                activeTab === 'webhooks' ? <Globe size={20} className="text-[#c5a059]" /> :
                                    <Bell size={20} className="text-[#c5a059]" />}
                            {activeTab === 'users' ? 'Novo Usuário Admin' :
                                activeTab === 'webhooks' ? 'Novo Webhook' :
                                    'Destinatário Adm'}
                        </h3>

                        {activeTab === 'users' ? (
                            <form onSubmit={handleCreateUser} className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
                                    <input type="text" required className="input-admin h-11" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                                    <input type="email" required className="input-admin h-11" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                                    <input type="password" required className="input-admin h-11" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível</label>
                                    <select className="input-admin h-11 bg-slate-900" value={newUser.access_level} onChange={e => setNewUser({ ...newUser, access_level: e.target.value })}>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="OPERADOR">Operador</option>
                                        <option value="VISUALIZADOR">Visualizador</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary w-full py-4 mt-4 font-black text-[10px] uppercase tracking-widest">CRIAR CONTA</button>
                            </form>
                        ) : activeTab === 'webhooks' ? (
                            <form onSubmit={handleCreateWebhook} className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL de Destino</label>
                                    <input type="url" required placeholder="https://..." className="input-admin h-11" value={newWebhook.url} onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Evento</label>
                                    <select className="input-admin h-11 bg-slate-900" value={newWebhook.event_type} onChange={e => setNewWebhook({ ...newWebhook, event_type: e.target.value })}>
                                        <option value="MEMBER_CREATED">Novo Membro</option>
                                        <option value="BIRTHDAY">Aniversário (Diário)</option>
                                        <option value="EVENT">Lembrete Evento (Diário)</option>
                                        <option value="FINANCIAL_TRANSACTION">Nova Transação</option>
                                        <option value="EVENT_CREATED">Agenda Editada</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary w-full py-4 mt-4 font-black text-[10px] uppercase tracking-widest">SALVAR WEBHOOK</button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateRecipient} className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome (Pastor/Sec)</label>
                                    <input type="text" required placeholder="Ex: Pr. Cláudio" className="input-admin h-11" value={newRecipient.name} onChange={e => setNewRecipient({ ...newRecipient, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp (com DDD)</label>
                                    <input type="text" required placeholder="55659..." className="input-admin h-11" value={newRecipient.phone} onChange={e => setNewRecipient({ ...newRecipient, phone: e.target.value })} />
                                </div>
                                <button type="submit" className="btn-primary w-full py-4 mt-4 font-black text-[10px] uppercase tracking-widest">ADICIONAR NA LISTA</button>
                                <p className="text-[9px] text-slate-500 mt-4 leading-relaxed italic text-center uppercase font-bold">
                                    Estes contatos receberão notificações de Finanças e Agenda.
                                </p>
                            </form>
                        )}
                    </div>
                ) : activeTab === 'evolution' ? (
                    <div className="admin-glass p-8 rounded-[2rem] border border-white/5 h-fit text-left">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-500/10 text-green-400 rounded-2xl">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Evolution API</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Conexão Direta</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateEvolution} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL do Servidor</label>
                                <input type="url" className="input-admin h-12" placeholder="https://..." value={evolution.base_url || ''} onChange={e => setEvolution({ ...evolution, base_url: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global API Key</label>
                                <input type="password" className="input-admin h-12" value={evolution.api_key || ''} onChange={e => setEvolution({ ...evolution, api_key: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instância</label>
                                <input type="text" className="input-admin h-12" value={evolution.instance_name || ''} onChange={e => setEvolution({ ...evolution, instance_name: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                                <input type="checkbox" className="w-5 h-5 accent-[#c5a059]" checked={evolution.is_enabled === 1} onChange={e => setEvolution({ ...evolution, is_enabled: e.target.checked ? 1 : 0 })} />
                                <div className="flex-1 text-left">
                                    <p className="text-xs font-bold text-white">Ativar WhatsApp</p>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full py-4 mt-2 font-black text-[10px] uppercase tracking-widest">SALVAR CONFIG</button>
                        </form>
                    </div>
                ) : activeTab === 'automations' ? (
                    <div className="admin-glass p-8 rounded-[2rem] border border-white/5 h-fit">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                                <Activity size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-white tracking-tight">n8n Engine</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Conectar Fluxos Externos</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveN8N} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Host do n8n (URL)</label>
                                <input type="text" className="input-admin h-12" placeholder="https://n8n.seu-servidor.com" value={n8nConfig.base_url} onChange={e => setN8nConfig({ ...n8nConfig, base_url: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">API Key (v1)</label>
                                <input type="password" className="input-admin h-12" value={n8nConfig.api_key} onChange={e => setN8nConfig({ ...n8nConfig, api_key: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                                <input type="checkbox" className="w-5 h-5 accent-[#c5a059]" checked={n8nConfig.is_enabled === 1} onChange={e => setN8nConfig({ ...n8nConfig, is_enabled: e.target.checked ? 1 : 0 })} />
                                <div className="flex-1 text-left">
                                    <p className="text-xs font-bold text-white">Integrar n8n</p>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full py-4 mt-2 font-black text-[10px] uppercase tracking-widest">CONECTAR</button>
                        </form>
                    </div>
                ) : (
                    <div className="admin-glass p-8 rounded-[2rem] border border-white/5 h-fit text-left">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Testador</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Validar Mensagens</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Escolha um template ao lado e envie um teste para o seu número:</p>
                        <input type="text" placeholder="DDD+Número" className="input-admin h-12" value={testPhone} onChange={e => setTestPhone(e.target.value)} />
                    </div>
                )}

                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="py-20 text-center text-slate-500 text-xs font-black tracking-widest animate-pulse uppercase flex flex-col items-center gap-4">
                            <RefreshCw className="animate-spin text-[#c5a059]" /> Sincronizando...
                        </div>
                    ) : activeTab === 'users' ? (
                        users.map(u => (
                            <div key={u.id} className="admin-glass p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-left">
                                    <ShieldCheck className="text-[#c5a059]" />
                                    <div>
                                        <h4 className="font-bold text-white">{u.name}</h4>
                                        <p className="text-xs text-slate-500">{u.email} <span className="ml-2 font-black text-[#c5a059]/60">{u.access_level}</span></p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))
                    ) : activeTab === 'webhooks' ? (
                        webhooks.map(w => (
                            <div key={w.id} className="admin-glass p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                                <div className="text-left group truncate max-w-sm">
                                    <h4 className="font-bold text-white truncate">{w.url}</h4>
                                    <p className="text-[9px] font-black text-[#c5a059] uppercase mt-1">{w.event_type}</p>
                                </div>
                                <button onClick={() => handleDeleteWebhook(w.id)} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))
                    ) : activeTab === 'recipients' ? (
                        recipients.map(r => (
                            <div key={r.id} className="admin-glass p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{r.name}</h4>
                                        <p className="text-xs text-slate-500 font-mono tracking-tighter">{r.phone}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteRecipient(r.id)} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))
                    ) : activeTab === 'templates' ? (
                        <div className="grid grid-cols-1 gap-6">
                            {templates.map(t => (
                                <div key={t.event_type} className="admin-glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4 text-left">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-white text-base uppercase tracking-widest">{t.event_type.split('_').join(' ')}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleTestTemplate(t.event_type)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white"><Send size={18} /></button>
                                            <button onClick={() => handleUpdateTemplate(t.event_type, t.content)} className="p-3 bg-[#c5a059]/10 text-[#c5a059] rounded-xl hover:bg-[#c5a059] hover:text-black"><Save size={18} /></button>
                                        </div>
                                    </div>
                                    <textarea className="input-admin min-h-[140px] py-4 bg-slate-950/30" value={t.content} onChange={e => setTemplates(templates.map(temp => temp.event_type === t.event_type ? { ...temp, content: e.target.value } : temp))} />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Variáveis: <span className="text-[#c5a059]">{getVariableInfo(t.event_type)}</span></p>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'automations' ? (
                        <div className="grid grid-cols-1 gap-6">
                            {/* Internas */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Activity size={14} className="text-[#c5a059]" /> Regras Internas
                                </h3>
                                {automations.map(a => (
                                    <div key={a.id} className="admin-glass p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between text-left group">
                                        <div className="flex items-start gap-5">
                                            <div className={`p-4 rounded-2xl ${a.is_enabled ? 'bg-[#c5a059]/10 text-[#c5a059]' : 'bg-slate-800 text-slate-600'}`}>
                                                <RefreshCw size={24} className={a.is_enabled ? 'animate-spin-slow' : ''} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-lg uppercase tracking-tight">{a.name}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{a.description}</p>
                                                <span className="text-[9px] font-black text-[#c5a059] bg-[#c5a059]/5 px-2 py-0.5 rounded mt-2 block w-fit uppercase">Frequência: {a.schedule}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleToggleAutomation(a.id, a.is_enabled)}
                                                className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${a.is_enabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-slate-800 text-slate-500'}`}
                                            >
                                                {a.is_enabled ? 'ATIVO' : 'DESLIGADO'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* n8n Workflows - Novo Layout com Dropdown e Iframe */}
                            {n8nConfig.is_enabled === 1 && (
                                <div className="space-y-6 pt-10 border-t border-white/5 text-left">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Globe size={14} className="text-blue-400" /> Editor de Fluxos (n8n)
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <div className="relative min-w-[300px]">
                                                <select
                                                    className="input-admin !h-12 w-full appearance-none bg-slate-900 pr-10"
                                                    value={selectedWorkflowId || ''}
                                                    onChange={(e) => {
                                                        setSelectedWorkflowId(e.target.value);
                                                        setIsIframeLoading(true);
                                                    }}
                                                >
                                                    <option value="">Selecione um fluxo para trabalhar...</option>
                                                    {n8nWorkflows.map(wf => (
                                                        <option key={wf.id} value={wf.id}>{wf.name} ({wf.active ? 'Ativo' : 'Inativo'})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                            </div>
                                            <a
                                                href={n8nConfig.base_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn-primary !py-0 h-12 px-4 flex items-center gap-2 !bg-slate-800 hover:!bg-slate-700 !text-white border border-white/5"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>

                                    {selectedWorkflowId ? (
                                        <div className="admin-glass rounded-[2rem] border border-white/5 overflow-hidden min-h-[600px] relative transition-all bg-slate-950">
                                            {isIframeLoading && (
                                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md gap-4">
                                                    <RefreshCw className="animate-spin text-[#c5a059]" size={32} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">Carregando editor n8n...</p>
                                                </div>
                                            )}
                                            <iframe
                                                src={`${n8nConfig.base_url.replace(/\/$/, '')}/workflow/${selectedWorkflowId}`}
                                                className="w-full h-[700px] border-none"
                                                onLoad={() => setIsIframeLoading(false)}
                                                title="n8n-workflow-editor"
                                            />
                                            <div className="p-4 bg-slate-900/50 border-t border-white/5 flex items-center justify-between">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Editando ID: {selectedWorkflowId}</p>
                                                <button
                                                    onClick={() => setSelectedWorkflowId(null)}
                                                    className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                                                >
                                                    Fechar Editor
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="admin-glass p-20 rounded-[3rem] border border-white/5 text-center text-slate-500 flex flex-col items-center gap-4">
                                            <div className="p-6 bg-blue-500/5 rounded-full mb-2">
                                                <Activity size={40} className="opacity-20 text-blue-400" />
                                            </div>
                                            <h4 className="text-white font-bold">Nenhum fluxo em edição</h4>
                                            <p className="text-xs max-w-xs mx-auto leading-relaxed">
                                                Selecione um dos seus <b>{n8nWorkflows.length} fluxos</b> no menu acima para abrir o editor diretamente aqui no painel.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="admin-glass p-12 rounded-[3.5rem] border border-white/5 flex flex-col items-center justify-center gap-8 min-h-[400px]">
                            <Smartphone size={60} className="text-green-400 animate-pulse" />
                            <h3 className="text-2xl font-black text-white uppercase">Status WhatsApp</h3>
                            <div className={`px-8 py-3 rounded-full font-black text-sm ${evolution.is_enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                {evolution.is_enabled ? 'SISTEMA CONECTADO E ATIVO' : 'SISTEMA DESATIVADO'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Configuration;
