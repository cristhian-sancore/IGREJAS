import Link from 'next/link';
import { getPublicEvents, getPublicNews } from '@/lib/api';

export default async function Home() {
  const events = await getPublicEvents();
  const news = await getPublicNews();

  return (
    <main className="min-h-screen bg-mesh">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gradient">Portal da Igreja</h1>
          <div className="space-x-8 hidden md:flex">
            <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
            <Link href="#agenda" className="hover:text-[#c5a059] transition-colors">Agenda</Link>
            <Link href="#mural" className="hover:text-[#c5a059] transition-colors">Informativos</Link>
            <Link href="/login" className="px-4 py-2 border border-[#c5a059] rounded-full text-[#c5a059] hover:bg-[#c5a059] hover:text-white transition-all text-sm">Acesso Restrito</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center pt-20">
        <div className="text-center px-4 animate-fade-in">
          <h2 className="text-5xl md:text-7xl font-bold mb-6">Conectando Fé e <br /><span className="text-gradient">Comunidade</span></h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Seja bem-vindo ao nosso portal. Aqui você encontra nossa agenda de cultos,
            transmissões ao vivo e as últimas notícias da nossa igreja.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 bg-[#c5a059] text-white rounded-full font-semibold hover:bg-[#b38f4d] transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Assistir Culto Online
            </button>
            <Link href="#agenda" className="px-8 py-4 glass text-white rounded-full font-semibold hover:bg-white/10 transition-all">
              Ver Programação
            </Link>
          </div>
        </div>
      </section>

      {/* Agenda Section */}
      <section id="agenda" className="py-24 px-6 max-w-7xl mx-auto">
        <h3 className="text-3xl font-bold mb-12 flex items-center gap-3">
          <svg className="text-[#c5a059]" xmlns="http://www.w3.org/2000/center" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Agenda da Semana
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? (
            events.map((event: any) => (
              <div key={event.id} className="glass p-6 rounded-2xl hover:border-[#c5a059]/50 transition-all group">
                <div className="text-xs font-semibold text-[#c5a059] mb-2 uppercase tracking-wider">{event.date}</div>
                <h4 className="text-xl font-bold mb-3 group-hover:text-[#c5a059] transition-colors">{event.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhum evento agendado no momento.</p>
          )}
        </div>
      </section>

      {/* Mural Section */}
      <section id="mural" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold mb-12 flex items-center gap-3">
            <svg className="text-[#c5a059]" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Mural de Informativos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {news.length > 0 ? (
              news.map((item: any) => (
                <div key={item.id} className="border-l-4 border-[#c5a059] bg-white/[0.03] p-8 rounded-r-2xl">
                  <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                  <p className="text-gray-400 leading-relaxed italic">{item.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhum informativo pendente.</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; 2024 Portal da Igreja - Sistema de Gestão ChMS</p>
        <div className="mt-4 space-x-4">
          <Link href="/admin" className="hover:text-white">Admin</Link>
          <span>•</span>
          <Link href="#" className="hover:text-white">Dízimos e Ofertas</Link>
          <span>•</span>
          <Link href="#" className="hover:text-white">Contato</Link>
        </div>
      </footer>
    </main>
  );
}
