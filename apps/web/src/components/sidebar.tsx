import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Archive, LogOut, MoreVertical, Trash2, Folder, 
  FolderPlus, FileCode, Clock, FilePlus, ChevronRight, ChevronDown, 
  Settings, CreditCard, Zap, Sun, Moon, User
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { SidebarHistorySkeleton } from "./ui/skeleton";
import { GyroLogo } from "./gyro-logo";
import { useTheme } from "next-themes";

interface ChatThread {
  id: string;
  title: string;
  updated_at: string;
  folderId?: string;
}

interface ProjectFolder {
  id: string;
  name: string;
  lastActive: string;
  fileCount: number;
  chatCount: number;
}

interface HistoryGroup {
  group: string;
  chats: ChatThread[];
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
  onOpenVault, 
  onSignOut, 
  isOpen, 
  setIsOpen, 
  isAnonymous,
  onOpenFileTree,
  onAddFile
}: SidebarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [touchStart, setTouchStart] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyData, setHistoryData] = useState<HistoryGroup[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Ujjwal");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ "proj-1": true });

  // Default Projects sorted by LAST ACTIVE
  const [folders, setFolders] = useState<ProjectFolder[]>([
    { id: "proj-1", name: "Core Architecture", lastActive: "10 mins ago", fileCount: 4, chatCount: 3 },
    { id: "proj-2", name: "Consensus Engine V3", lastActive: "2 hours ago", fileCount: 2, chatCount: 5 },
    { id: "proj-3", name: "Adversarial Benchmarks", lastActive: "Yesterday", fileCount: 1, chatCount: 2 }
  ]);

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

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => setActiveChatMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const deleteChat = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryData(prev => 
      prev.map(group => ({
        ...group,
        chats: group.chats.filter((c: ChatThread) => c.id !== threadId)
      })).filter(group => group.chats.length > 0)
    );
    setActiveChatMenu(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${baseUrl}/api/v1/threads/${threadId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      });
      fetchThreads();
    } catch (err) {
      console.error("Failed to delete thread", err);
      fetchThreads();
    }
  };

  const fetchThreads = async (query?: string) => {
    if (!query) setIsLoadingHistory(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (isAnonymous || !session) { 
        // Fallback sample threads for seamless demo
        setHistoryData([
          {
            group: "Today",
            chats: [
              { id: "th-1", title: "Consensus Loop Verification", updated_at: new Date().toISOString() },
              { id: "th-2", title: "Adversarial Critic Rules", updated_at: new Date().toISOString() }
            ]
          },
          {
            group: "Yesterday",
            chats: [
              { id: "th-3", title: "Multi-Model Arbitration Logic", updated_at: new Date(Date.now() - 86400000).toISOString() }
            ]
          }
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
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);

        const grouped: HistoryGroup[] = [
          { group: "Today", chats: [] },
          { group: "Yesterday", chats: [] },
          { group: "Previous 7 Days", chats: [] },
          { group: "Older", chats: [] }
        ];

        data.data.forEach((t: ChatThread) => {
          const tDate = new Date(t.updated_at);
          if (tDate >= today) grouped[0].chats.push(t);
          else if (tDate >= yesterday) grouped[1].chats.push(t);
          else if (tDate >= last7Days) grouped[2].chats.push(t);
          else grouped[3].chats.push(t);
        });

        setHistoryData(grouped.filter(g => g.chats.length > 0));
      }
    } catch (err) {
      console.error("Failed to load threads", err);
      // Fallback
      setHistoryData([
        {
          group: "Today",
          chats: [
            { id: "th-1", title: "Consensus Loop Verification", updated_at: new Date().toISOString() },
            { id: "th-2", title: "Adversarial Critic Rules", updated_at: new Date().toISOString() }
          ]
        }
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

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart - e.changedTouches[0].clientX > 50) setIsOpen(false);
  };

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
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen transition-all duration-300 bg-[#09090b] border-r border-white/10 overflow-hidden ${
          isOpen ? "w-[280px] translate-x-0 opacity-100 shadow-2xl" : "w-0 -translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{ height: '100dvh' }}
      >
        {/* ── 1. Top Brand Header: THE COUNCIL ── */}
        <div className="p-4 shrink-0 flex flex-col gap-3 border-b border-white/5 bg-[#0d0d10]">
          <div className="flex items-center justify-between h-8">
            <div className="flex items-center gap-2.5">
              <GyroLogo size={22} />
              <span className="font-sans font-bold text-[14px] text-white tracking-[0.15em] uppercase">
                THE COUNCIL
              </span>
            </div>
          </div>

          {/* New Chat Primary Action Button */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event('new-thread'));
              setIsOpen(false);
            }}
            className="flex items-center justify-center gap-2 w-full bg-white text-black font-semibold py-2 px-4 rounded-full hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer text-[13px] shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>New Consensus</span>
          </button>
        </div>

        {/* ── 2. Search & Quick Actions ── */}
        <div className="p-3 shrink-0 flex flex-col gap-1 border-b border-white/5">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
            <Search className="size-3.5 text-zinc-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search consensus..." 
              className="bg-transparent border-none outline-none text-[12.5px] text-white w-full placeholder:text-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Add File / Open Project File Tree */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => {
                onOpenFileTree?.();
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-[11.5px] font-medium"
            >
              <Folder className="size-3.5 text-blue-400" />
              <span>Project Tree</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddFile?.();
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-[11.5px] font-medium"
            >
              <FilePlus className="size-3.5 text-emerald-400" />
              <span>Add File</span>
            </button>
          </div>
        </div>

        {/* ── 3. Projects / Folders (Sorted by LAST ACTIVE) ── */}
        <div className="flex-1 px-3 py-3 overflow-y-auto no-scrollbar space-y-4">
          
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
              <span>Projects (Last Active)</span>
              <FolderPlus className="size-3 text-zinc-400 cursor-pointer hover:text-white" />
            </div>

            <div className="space-y-1">
              {folders.map((folder) => {
                const isOpenFolder = openFolders[folder.id];
                return (
                  <div key={folder.id} className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/5">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 text-xs text-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isOpenFolder ? <ChevronDown className="size-3 text-zinc-400 shrink-0" /> : <ChevronRight className="size-3 text-zinc-400 shrink-0" />}
                        <span className="font-medium text-white truncate">{folder.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {folder.lastActive}
                      </span>
                    </button>

                    {isOpenFolder && (
                      <div className="px-3 pb-2 pt-0.5 space-y-1 pl-6 border-l border-white/5 ml-3">
                        <div 
                          onClick={() => onOpenFileTree?.()}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 cursor-pointer"
                        >
                          <FileCode className="size-3 text-blue-400" />
                          <span>{folder.fileCount} saved artifacts</span>
                        </div>
                        <div 
                          onClick={() => window.dispatchEvent(new Event('new-thread'))}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 cursor-pointer"
                        >
                          <Clock className="size-3 text-purple-400" />
                          <span>{folder.chatCount} consensus threads</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. Chat History / Recent ── */}
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1.5">
              Recent Consensus
            </div>

            {isLoadingHistory ? (
              <SidebarHistorySkeleton />
            ) : (
              historyData.map((group, i) => (
                <div key={i} className="space-y-1 mb-3">
                  <div className="text-[10px] font-medium text-zinc-600 px-2">
                    {group.group}
                  </div>
                  {group.chats.map((chat: ChatThread) => (
                    <div key={chat.id} className="group relative">
                      <button 
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('load-thread', { detail: { threadId: chat.id } }));
                          if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        className="w-full text-left py-1.5 px-2.5 pr-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-[12.5px] truncate cursor-pointer block"
                      >
                        {chat.title?.replace(/^\[Sent:.*?\]\s*/i, '') || 'New Chat'}
                      </button>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                        title="Delete chat"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

        </div>

        {/* ── 5. Bottom Profile Drawer ── */}
        <div className="p-3 border-t border-white/5 bg-[#0d0d10] shrink-0 space-y-1">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                <User className="size-4 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{userName}</div>
                <div className="text-[10px] text-purple-400 font-medium">Council Operator</div>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="size-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-zinc-500">
            <button onClick={() => router.push('/settings')} className="hover:text-zinc-300 transition-colors">Settings</button>
            <span>•</span>
            <button onClick={() => router.push('/pricing')} className="hover:text-zinc-300 transition-colors">Pricing</button>
            <span>•</span>
            <button onClick={onSignOut} className="hover:text-red-400 transition-colors">Sign Out</button>
          </div>
        </div>

      </aside>
    </>
  );
}
