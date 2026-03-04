"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InquisiaLogo } from "@/components/Logos";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState({ total_projects: 0, recent: [] });
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/public/stats")
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/projects?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-between items-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 px-4 py-2 rounded-2xl shadow-sm pointer-events-auto flex items-center gap-2">
          <InquisiaLogo variant="blue" className="w-6 h-6" />
          <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">
            Inquisia<span className="text-blue-600">.</span>
          </span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <Link href="/login" className="bg-white/80 backdrop-blur-xl border border-gray-100 px-8 py-3 rounded-2xl shadow-sm text-sm font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all">
            Login
          </Link>
          <Link href="/register" className="bg-gray-900 text-white px-8 py-3 rounded-2xl shadow-xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white px-4 pt-20">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 mb-4">
              Official Undergraduate Thesis Repository
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 uppercase tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-bottom-8 duration-700">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Academic Discovery</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl font-bold text-gray-400 uppercase tracking-tight leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              Access the repository of Babcock University's undergraduate research.
              Powered by AI, designed for excellence.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white p-3 rounded-3xl shadow-2xl border border-gray-100 flex gap-2 group focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-300">
            <input
              type="text"
              placeholder="Explore thousands of research papers..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-bold placeholder:text-gray-300 text-lg px-4"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
              Search
            </button>
          </form>

          <div className="flex justify-center gap-12 pt-8">
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900 tracking-tighter">{stats.total_projects}+</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved Projects</p>
            </div>
            <div className="w-px h-12 bg-gray-100" />
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900 tracking-tighter">5</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Departments</p>
            </div>
            <div className="w-px h-12 bg-gray-100" />
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900 tracking-tighter">AI</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enhanced Discovery</p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-10 left-10 hidden lg:block animate-bounce">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500" />
            <div>
              <p className="text-[10px] font-black text-gray-900">Live Updates</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Real-time sync active</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Recent Section */}
      <section className="bg-gray-900 py-32 px-4 rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                Fresh <span className="text-blue-500">Perspectives</span>
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Recently approved undergraduate research papers</p>
            </div>
            <Link href="/projects" className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all border border-white/10">
              Browse All Projects
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.recent.length === 0 ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 h-64 rounded-[2rem] animate-pulse" />
              ))
            ) : (
              stats.recent.map((p: any) => (
                <Link href={`/projects/${p.id}`} key={p.id}>
                  <div className="group bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-white/10 transition-all duration-500 h-full flex flex-col justify-between space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-blue-400 transition-colors">
                        {p.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Evaluate Discovery
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/5 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <InquisiaLogo variant="blue" className="w-8 h-8" />
              <span className="text-2xl font-black text-white uppercase tracking-tighter">
                Inquisia<span className="text-blue-600">.</span>
              </span>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">© 2026 Babcock University Research Repository</p>
          </div>
          <div className="flex gap-8">
            <Link href="/projects" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors">Project Gallery</Link>
            <Link href="/login" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors">Submit Portal</Link>
            <Link href="#" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors">Help & Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
