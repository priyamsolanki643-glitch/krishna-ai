"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Folder, Trash2, Settings, User, MoreVertical
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { SidebarHistorySkeleton } from "./ui/skeleton";
import { GyroLogo } from "./gyro-logo";

interface ChatThread {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  onOpenVault: () => void;
  onSignOut: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAnonymous?: boolean;
  onOpenFileTree?: () => void;
  onAddFile?: () => void;
}

export function Sidebar({ 
  onSignOut, 
  isOpen, 
  setIsOpen, 
  isAnonymous,
  onOpenFileTree
}: SidebarProps) {
  const router = useRouter();
  const [touchStart, setTouchStart] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Ujjwal");

  // Minimal flat projects list
  const projects = [
    { id: "p1", name: "Core Architecture" },
    { id: "p2", name: "Consensus Engine V3" },
    { id: "p3", name: "Adversarial Benchmarks" }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Ujjwal";
        setUserName(name);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClick = () => setActiveChatMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const deleteChat = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(c => c.id !== threadId));
    setActiveChatMenu(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${baseUrl}/api/v1/threads/${threadId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      });
    } catch (err) {
      console.error("Failed to delete thread", err);
    }
  };

  const fetchThreads = async (query?: string) => {
    if (!query) setIsLoadingHistory(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (isAnonymous || !session) { 
        setThreads([
          { id: "th-1", title: "Consensus Loop Verification", updated_at: new Date().toISOString() },
          { id: "th-2", title: "Adversarial Critic Rules", updated_at: new Date().toISOString() },
          { id: "th-3", title: "Multi-Model Arbitration Logic", updated_at: new Date(Date.now() - 86400000).toISOString() }
        ]);
        setIsLoadingHistory(false); 
        return; 
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const url = new URL(`${baseUrl}/api/v1/threads`);
      url.searchParams.append('t', String(Date.now()));
      if (query) url.searchParams.append('q', query);

      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        setThreads(data.data);
      }
    } catch (err) {
      setThreads([
        { id: "th-1", title: "Consensus Loop Verification", updated_at: new Date().toISOString() },
        { id: "th-2", title: "Adversarial Critic Rules", updated_at: new Date().toISOString() },
        { id: "th-3", title: "Multi-Model Arbitration Logic", updated_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const handleRefresh = () => fetchThreads();
    window.addEventListener('refresh-sidebar', handleRefresh);
    return () => window.removeEventListener('refresh-sidebar', handleRefresh);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchThreads(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart - e.changedTouches[0].clientX > 50) setIsOpen(false);
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col justify-between shrink-0 h-screen transition-all duration-300 bg-black/95 sm:bg-zinc-950/80 border-r border-white/5 backdrop-blur-2xl p-4 overflow-hidden ${
          isOpen ? "w-[260px] translate-x-0 opacity-100 shadow-2xl" : "w-0 -translate-x-full opacity-0 pointer-events-none p-0 border-0"
        }`}
        style={{ height: '100dvh' }}
      >
        {/* ── Top Area ── */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <GyroLogo size={20} />
            <span className="text-sm font-medium tracking-wide text-white">
              The Council
            </span>
          </div>

          {/* New Chat Primary Action Button */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event('new-thread'));
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 mt-4 mb-4 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>New Consensus</span>
          </button>

          {/* Minimalist Search Input */}
          <div className="relative mb-5">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/5 text-xs text-zinc-400 placeholder-zinc-600 outline-none hover:border-white/10 focus:border-white/20 transition-colors"
            />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
            
            {/* ── 3. Flat & Elegant Projects List ── */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-2 mb-2">
                PROJECTS
              </div>
              <div className="space-y-0.5">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      onOpenFileTree?.();
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Folder className="size-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 4. Recent Threads (Minimalist Flat Links) ── */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-2 mt-4 mb-2">
                RECENT
              </div>

              {isLoadingHistory ? (
                <div className="px-2 space-y-2">
                  <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredThreads.map((chat) => (
                    <div key={chat.id} className="group relative flex items-center">
                      <button 
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('load-thread', { detail: { threadId: chat.id } }));
                          if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        className="block w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 truncate cursor-pointer transition-colors pr-6"
                      >
                        {chat.title?.replace(/^\[Sent:.*?\]\s*/i, '') || 'New Consensus'}
                      </button>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="absolute right-1.5 p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                        title="Delete consensus"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ── 5. Clean Bottom Profile (Single Minimal Row) ── */}
        <div className="pt-3 border-t border-white/5 mt-auto">
          <div className="flex items-center justify-between px-2 py-1 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                <User className="size-3.5 text-zinc-300" />
              </div>
              <span className="text-xs font-medium text-white truncate">{userName}</span>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="size-3.5" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
