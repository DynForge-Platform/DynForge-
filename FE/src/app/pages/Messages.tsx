import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Search, Send, LifeBuoy, Loader2, MessageSquare } from 'lucide-react';
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

  // Poll the conversation list.
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

  // Poll the open conversation for near-real-time chat.
  useEffect(() => {
    fetchDetail();
    if (!activeId) return;
    const t = setInterval(fetchDetail, 3000);
    return () => clearInterval(t);
  }, [fetchDetail, activeId]);

  // Auto-scroll to the newest message.
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
    <div className="flex -mx-6 -my-6 h-[calc(100vh-64px)] bg-background">
      {/* Conversation list */}
      <aside className="w-80 shrink-0 flex-col border-r border-border bg-white hidden sm:flex">
        <div className="border-b border-border p-4">
          <h2 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Messages</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="bg-input-background pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin" /> Loading…
            </div>
          ) : convos.length ? (
            convos.map((c) => (
              <button
                key={c.userId}
                onClick={() => openConversation(c.userId)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors hover:bg-accent',
                  activeId === c.userId && 'bg-accent'
                )}
              >
                <div className="relative">
                  <ImageWithFallback src={c.avatarUrl ?? ''} alt={c.name} className="size-11 rounded-full object-cover" />
                  {c.unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white" style={{ fontWeight: 700 }}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate" style={{ fontWeight: 600 }}>{c.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtTime(c.lastAt)}</span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Message a {role === 'student' ? 'mentor' : 'student'} to start chatting.
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {activeId && other ? (
          <>
            <div className="flex h-16 items-center gap-3 border-b border-border bg-white px-5">
              <ImageWithFallback src={other.avatarUrl ?? ''} alt={other.name} className="size-9 rounded-full object-cover" />
              <div>
                <p style={{ fontWeight: 600 }}>{other.name}</p>
                <p className="text-sm text-muted-foreground">{role === 'student' ? 'Mentor' : 'Student'}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-pale-blue/30">
              {detail.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No messages yet. Say hi 👋
                </div>
              ) : detail.messages.map((m) => (
                <div key={m.id} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
                  {!m.mine && (
                    <ImageWithFallback src={other.avatarUrl ?? ''} alt={other.name} className="mr-2 size-8 self-end rounded-full object-cover" />
                  )}
                  <div className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-3 text-sm',
                    m.mine
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-white border border-border text-foreground'
                  )}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <div className={cn('mt-1 flex items-center gap-1 text-xs', m.mine ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground')}>
                      <span>{fmtTime(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message..."
                  className="bg-input-background"
                />
                <Button size="icon" onClick={send} disabled={!draft.trim() || sending}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare className="size-8" />
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* Right sidebar */}
      {other && (
        <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-white xl:flex">
          <div className="p-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageWithFallback src={other.avatarUrl ?? ''} alt={other.name} className="size-16 rounded-2xl object-cover" />
              <div>
                <p style={{ fontWeight: 600 }}>{other.name}</p>
                <p className="text-sm text-muted-foreground">{role === 'student' ? 'Mentor' : 'Student'}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <button
                onClick={() => navigate('/support/contact')}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-accent"
                style={{ fontWeight: 500 }}
              >
                <LifeBuoy className="size-4 text-primary" /> Contact Support
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
