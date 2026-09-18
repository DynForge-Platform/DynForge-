import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Search, Send, LifeBuoy, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { cn } from '../components/ui/utils';
import { toast } from 'sonner';
import {
  listConversations, getConversation, sendMessage,
  type Conversation, type ConversationDetail,
} from '../services/messageService';

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function Messages({ role = 'student' }: { role?: 'student' | 'mentor' }) {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const [activeId, setActiveId] = useState<string | null>(mentorId ?? null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (mentorId) setActiveId(mentorId); }, [mentorId]);

  const fetchConversations = useCallback(async () => {
    try { setConversations(await listConversations()); }
    catch { /* keep previous */ }
    finally { setLoadingConvos(false); }
  }, []);

  useEffect(() => {
    fetchConversations();
    const t = setInterval(fetchConversations, 5000);
    return () => clearInterval(t);
  }, [fetchConversations]);

  const fetchDetail = useCallback(async () => {
    if (!activeId) { setDetail(null); return; }
    try { setDetail(await getConversation(activeId)); }
    catch { /* keep previous */ }
  }, [activeId]);

  useEffect(() => {
    fetchDetail();
    if (!activeId) return;
    const t = setInterval(fetchDetail, 3000);
    return () => clearInterval(t);
  }, [fetchDetail, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [detail?.messages.length, activeId]);

  const openConversation = (userId: string) => {
    setActiveId(userId);
    if (role === 'student') navigate(`/messages/${userId}`);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft('');
    setSending(true);
    try {
      await sendMessage(activeId, text);
      await fetchDetail();
      fetchConversations();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not send message.');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const convos = conversations.filter((c) =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()));

  const other = detail?.otherUser;

  return (
    <div className="flex -mx-6 -my-6 h-[calc(100vh-64px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Conversation list */}
      <aside className={cn(
        "w-full sm:w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90",
        activeId ? "hidden sm:flex" : "flex"
      )}>
        <div className="border-b border-slate-800 p-4">
          <h2 className="font-semibold text-lg text-white">Messages</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="size-5 animate-spin text-cyan-400" /> Loading…
            </div>
          ) : convos.length ? (
            convos.map((c) => (
              <button
                key={c.userId}
                onClick={() => openConversation(c.userId)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-slate-800/80 p-4 text-left transition-colors hover:bg-slate-800',
                  activeId === c.userId && 'bg-slate-800/90 border-l-4 border-l-cyan-400'
                )}
              >
                <div className="relative">
                  <ImageWithFallback src={c.avatarUrl ?? ''} alt={c.name} className="size-11 rounded-full object-cover border border-slate-700" />
                  {c.unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-cyan-500 text-xs text-white font-bold">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-semibold text-white">{c.name}</p>
                    <span className="shrink-0 text-xs text-slate-400">{fmtTime(c.lastAt)}</span>
                  </div>
                  <p className="truncate text-sm text-slate-400 mt-0.5">{c.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-slate-400">
              No conversations yet. Message a {role === 'student' ? 'mentor' : 'student'} to start chatting.
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className={cn(
        "flex-1 flex-col min-w-0",
        activeId ? "flex" : "hidden sm:flex"
      )}>
        {activeId && other ? (
          <>
            <div className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 sm:px-5">
              <button
                onClick={() => setActiveId(null)}
                className="sm:hidden flex size-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="size-4" />
              </button>
              <ImageWithFallback src={other.avatarUrl ?? ''} alt={other.name} className="size-9 rounded-full object-cover border border-slate-700" />
              <div>
                <p className="font-semibold text-white">{other.name}</p>
                <p className="text-xs text-cyan-400 font-medium">{role === 'student' ? 'Mentor' : 'Student'}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-950">
              {detail.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No messages yet. Say hi 👋
                </div>
              ) : detail.messages.map((m) => (
                <div key={m.id} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
                  {!m.mine && (
                    <ImageWithFallback src={other.avatarUrl ?? ''} alt={other.name} className="mr-2 size-8 self-end rounded-full object-cover border border-slate-700" />
                  )}
                  <div className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md',
                    m.mine
                      ? 'rounded-br-sm bg-cyan-600 text-white font-medium'
                      : 'rounded-bl-sm bg-slate-900 border border-slate-800 text-slate-100'
                  )}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <div className={cn('mt-1 flex items-center gap-1 text-xs', m.mine ? 'justify-end text-cyan-200' : 'text-slate-400')}>
                      <span>{fmtTime(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message..."
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                />
                <Button size="icon" onClick={send} disabled={!draft.trim() || sending} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
            <MessageSquare className="size-8 text-cyan-400" />
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* Right sidebar */}
      {other && (
        <aside className="hidden w-72 shrink-0 flex-col border-l border-slate-800 bg-slate-900/90 xl:flex">
          <div className="p-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageWithFallback src={other.avatarUrl ?? ''} alt={other.name} className="size-16 rounded-2xl object-cover border border-slate-700" />
              <div>
                <p className="font-semibold text-white">{other.name}</p>
                <p className="text-xs text-cyan-400 font-medium">{role === 'student' ? 'Mentor' : 'Student'}</p>
              </div>
            </div>
            <div className="mt-6 space-y-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => navigate('/support/contact')}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 transition-colors hover:bg-slate-800 font-medium"
              >
                <LifeBuoy className="size-4 text-cyan-400" /> Contact Support
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
