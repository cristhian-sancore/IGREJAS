import { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    DollarSign,
    Calendar,
    LogOut,
    Menu,
    Bell,
    Home,
    Settings
} from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const menuItems = [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'Membros', path: '/admin/members', icon: <Users size={20} /> },
        { title: 'Financeiro', path: '/admin/finance', icon: <DollarSign size={20} /> },
        { title: 'Eventos/Agenda', path: '/admin/events', icon: <Calendar size={20} /> },
        { title: 'Células', path: '/admin/cells', icon: <Home size={20} /> },
        { title: 'Configurações', path: '/admin/config', icon: <Settings size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-200">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#c5a059] rounded-lg"></div>
                    {isSidebarOpen && <span className="font-bold text-xl tracking-tight">ChMS Admin</span>}
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                                ? 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20'
                                : 'hover:bg-slate-800'
                                }`}
                        >
                            {item.icon}
                            {isSidebarOpen && <span className="font-medium">{item.title}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all w-full"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 hover:bg-slate-800 rounded-full">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-700 pl-6 text-sm">
                            <div className="text-right">
                                <p className="font-medium">Secretaria Igreja</p>
                                <p className="text-slate-500 text-xs text-right">Administrador</p>
                            </div>
                            <div className="w-9 h-9 bg-slate-700 rounded-full"></div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8 bg-mesh">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
