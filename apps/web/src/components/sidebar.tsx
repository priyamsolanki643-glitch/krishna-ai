"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  FilePlus, 
  MessageSquare, 
  Folder, 
  Trash2, 
  MoreVertical, 
  Menu, 
  Search, 
  Clock, 
  FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import { SidebarHistorySkeleton } from "./ui/skeleton";
import { GyroLogo } from "./gyro-logo";

interface ChatThread {
  id: string;
  title: string;
  updated_at: string;
}

interface HistoryGroup {
  group: string;
  chats: ChatThread[];
}

interface SidebarProps {
  onOpenVault?: () => void;
  onSignOut?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAnonymous?: boolean;
  theme?: "dark" | "light";
}

export function Sidebar({ 
  isOpen, 
  setIsOpen, 
  isAnonymous, 
  theme = "dark" 
}: SidebarProps) {
  const isLight = theme === "light";
  const router = useRouter();

  const [touchStart, setTouchStart] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyData, setHistoryData] = useState<HistoryGroup[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Operator");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Operator";
        setUserName(name);
        setUserEmail(session.user.email || "");
      }
    };
    fetchUser();
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => setActiveChatMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
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
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
      await fetch(`${baseUrl}/api/v1/threads/${threadId}`, {
        method: "DELETE",
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
        setIsLoadingHistory(false); 
        return; 
      }
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
      const url = new URL(`${baseUrl}/api/v1/threads`);
      url.searchParams.append("t", String(Date.now()));
      if (query) url.searchParams.append("q", query);

      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
        cache: "no-store"
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
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const handleRefresh = () => fetchThreads();
    window.addEventListener("refresh-sidebar", handleRefresh);
    return () => window.removeEventListener("refresh-sidebar", handleRefresh);
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

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen transition-all duration-300 overflow-hidden font-sans",
          isLight 
            ? "bg-white/95 backdrop-blur-2xl lg:bg-zinc-50/90 border-r border-zinc-200 text-zinc-900" 
            : "bg-zinc-950/95 backdrop-blur-2xl lg:bg-[#08080a] border-r border-white/10 text-white",
          isOpen ? "w-[260px] translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0"
        )}
        style={{ height: "100dvh" }}
      >
        {/* ── Top Header Brand ── */}
        <div className="p-4 pb-2 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between h-8">
            <div className="flex items-center gap-2">
              <GyroLogo size={20} />
              {isOpen && (
                <span className={cn(
                  "font-sans font-bold text-[13px] tracking-[0.14em] uppercase",
                  isLight ? "text-zinc-950" : "text-white"
                )}>
                  The Council
                </span>
              )}
            </div>
            {isOpen && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  isLight ? "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200" : "text-zinc-400 hover:text-white hover:bg-white/10"
                )}
                title="Close sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 1. New Chat Button */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("new-thread"));
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className={cn(
              "flex items-center justify-center gap-2 w-full font-medium py-2 px-4 rounded-xl transition-all cursor-pointer text-xs shrink-0 shadow-sm active:scale-[0.98]",
              isLight 
                ? "bg-zinc-950 text-white hover:bg-zinc-800" 
                : "bg-white text-zinc-950 hover:bg-zinc-100"
            )}
          >
            <Plus className="size-4" />
            <span>New chat</span>
          </button>

          {/* 2. Apple-Style "Add new file" Button */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-add-file"));
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className={cn(
              "flex items-center gap-2.5 w-full font-medium py-2 px-3 rounded-xl border transition-all cursor-pointer text-xs shrink-0 active:scale-[0.98]",
              isLight
                ? "bg-zinc-100/80 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800 hover:text-zinc-950"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-300 hover:text-white"
            )}
          >
            <FilePlus className="size-4 text-zinc-400 shrink-0" />
            <span className="truncate">Add new file</span>
          </button>

          {/* Quick Search */}
          <div className="pt-1">
            {isSearchActive ? (
              <div className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs",
                isLight ? "bg-zinc-100 border-zinc-300" : "bg-black/60 border-white/15"
              )}>
                <Search className="size-3.5 text-zinc-400 shrink-0" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search recent activity..." 
                  className="bg-transparent border-none outline-none text-xs w-full text-zinc-100 placeholder:text-zinc-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchActive(false)}
                  onKeyDown={(e) => e.key === "Escape" && setIsSearchActive(false)}
                />
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setIsSearchActive(true)}
                className={cn(
                  "flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer",
                  isLight && "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950"
                )}
              >
                <Search className="size-3.5" />
                <span>Search activity...</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable History List & Recent Activity (Folders & Chats) ── */}
        <div className="flex-1 px-3 py-2 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {isOpen && (
            <>
              {isLoadingHistory ? (
                <SidebarHistorySkeleton />
              ) : (() => {
                const RECENT_GROUPS = ["Today", "Yesterday", "Previous 7 Days", "Older"];
                const finalHistory = historyData
                  .filter(g => RECENT_GROUPS.includes(g.group))
                  .map(g => ({
                    ...g,
                    chats: g.chats.filter((c: ChatThread) => (c?.title || "").toLowerCase().includes(searchQuery.toLowerCase()))
                  })).filter(g => g.chats.length > 0);

                if (finalHistory.length === 0) {
                  return (
                    <div className="px-3 py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-1.5">
                      <Clock className="size-4 text-zinc-600" />
                      <span>No recent chat activity</span>
                    </div>
                  );
                }

                return finalHistory.map((group, i) => (
                  <div key={i} className="space-y-1">
                    <div className={cn(
                      "text-[10px] font-mono font-semibold tracking-wider uppercase px-2 mb-1",
                      isLight ? "text-zinc-400" : "text-zinc-500"
                    )}>
                      {group.group}
                    </div>

                    {group.chats.map((chat: ChatThread) => (
                      <div key={chat.id} className="group relative">
                        <button 
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("load-thread", { detail: { threadId: chat.id } }));
                            if (window.innerWidth < 1024) setIsOpen(false);
                          }}
                          className={cn(
                            "w-full text-left py-1.5 px-2.5 pr-7 rounded-lg transition-colors text-xs truncate cursor-pointer flex items-center gap-2",
                            isLight
                              ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                              : "text-zinc-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <MessageSquare className="size-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{chat.title?.replace(/^\[Sent:.*?\]\s*/i, "") || "Untitled Conversation"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id);
                          }}
                          className={cn(
                            "absolute right-1 top-1/2 -translate-y-1/2 p-1 transition-opacity rounded cursor-pointer",
                            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                            activeChatMenu === chat.id ? "md:opacity-100" : "",
                            isLight ? "text-zinc-400 hover:text-zinc-900" : "text-zinc-500 hover:text-white"
                          )}
                          title="Chat actions"
                        >
                          <MoreVertical className="size-3.5" />
                        </button>

                        {activeChatMenu === chat.id && (
                          <div className={cn(
                            "absolute right-2 top-7 z-50 w-28 rounded-lg border shadow-xl overflow-hidden py-1",
                            isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-white/10"
                          )}>
                            <button
                              type="button"
                              onClick={(e) => deleteChat(chat.id, e)}
                              className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="size-3" />
                              <span>Delete chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </>
          )}
        </div>

        {/* ── Non-Clickable Sleek Operator Profile Row (Dropdown Removed) ── */}
        <div className={cn(
          "p-3 border-t shrink-0 select-none pointer-events-none",
          isLight ? "border-zinc-200 bg-zinc-50" : "border-white/5 bg-black/20"
        )}>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className={cn(
              "size-7 rounded-full flex items-center justify-center shrink-0 border",
              isLight 
                ? "bg-zinc-200 border-zinc-300 text-zinc-900" 
                : "bg-white/10 border-white/10 text-white"
            )}>
              <span className="text-[11px] font-bold uppercase">
                {isAnonymous ? "A" : userName.charAt(0)}
              </span>
            </div>

            {isOpen && (
              <div className="flex flex-col min-w-0 text-left">
                <span className={cn(
                  "text-xs font-medium truncate leading-tight",
                  isLight ? "text-zinc-900" : "text-zinc-200"
                )}>
                  {isAnonymous ? "Guest Session" : userName}
                </span>
                <span className={cn(
                  "text-[10px] truncate leading-none mt-0.5",
                  isLight ? "text-zinc-500" : "text-zinc-500"
                )}>
                  {userEmail || (isAnonymous ? "Read-only" : "The Council Active")}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
