import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Search, Paperclip, Send, Calendar, User, LifeBuoy, AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { mentors } from '../data/mockData';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { cn } from '../components/ui/utils';

interface Message {
  id: string;
  sender: 'student' | 'mentor';
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

const mockConversations = mentors.slice(0, 4).map((m, i) => ({
  mentorId: m.id,
  mentorName: m.name,
  mentorAvatar: m.avatar,
  lastMessage: i === 0 ? 'See you at 9AM tomorrow!' : i === 1 ? 'Please prepare the circuit problem set.' : i === 2 ? 'Your CV looks great, let\'s polish the cover letter.' : 'I\'ll send the thesis outline tonight.',
  unread: i === 0 ? 2 : 0,
  time: i === 0 ? '10:32' : i === 1 ? 'Yesterday' : i === 2 ? 'Mon' : 'Jun 18',
  sessionLabel: i < 2 ? 'Upcoming session' : undefined,
}));

const mockMessages: Message[] = [
  { id: '1', sender: 'student', text: 'Hi Linh! I wanted to confirm our session tomorrow at 9AM.', time: '09:15', status: 'read' },
  { id: '2', sender: 'mentor', text: 'Yes, confirmed! I\'ll send you a Google Meet link 15 minutes before we start. Please prepare the sorting algorithm problems we discussed last time.', time: '09:47', status: 'read' },
  { id: '3', sender: 'student', text: 'Perfect! I\'ve already worked through merge sort and quick sort. Should I also review heap sort?', time: '10:05', status: 'read' },
  { id: '4', sender: 'mentor', text: 'Yes, heap sort is on the agenda. Also bring any questions about the DP problems from your last exam — we\'ll go through them together.', time: '10:18', status: 'read' },
  { id: '5', sender: 'student', text: 'Got it. See you at 9AM tomorrow!', time: '10:32', status: 'read' },
  { id: '6', sender: 'mentor', text: 'See you at 9AM tomorrow! 👍', time: '10:33', status: 'delivered' },
];

function StatusIcon({ status }: { status: Message['status'] }) {
  if (status === 'read') return <CheckCheck className="size-3.5 text-primary" />;
  if (status === 'delivered') return <CheckCheck className="size-3.5 text-muted-foreground" />;
  return <Check className="size-3.5 text-muted-foreground" />;
}

export function Messages({ role = 'student' }: { role?: 'student' | 'mentor' }) {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(mentorId ?? mentors[0].id);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const active = mentors.find((m) => m.id === activeId);
  const convos = mockConversations.filter((c) =>
    !query || c.mentorName.toLowerCase().includes(query.toLowerCase())
  );

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: 'student', text: draft, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), status: 'sent' },
    ]);
    setDraft('');
  };

  const quickActions = [
    { icon: Calendar, label: 'Book Session', onClick: () => navigate(`/mentors/${activeId}/schedule`) },
    { icon: User, label: 'View Profile', onClick: () => navigate(`/mentors/${activeId}`) },
    { icon: LifeBuoy, label: 'Contact Support', onClick: () => navigate('/support/contact') },
    { icon: AlertTriangle, label: 'Open Dispute', onClick: () => navigate('/dashboard/disputes') },
  ];

  // Negate DashboardLayout's p-6 so chat fills the full available height
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
          {convos.map((c) => (
            <button
              key={c.mentorId}
              onClick={() => { setActiveId(c.mentorId); navigate(`/messages/${c.mentorId}`); }}
              className={cn(
                'flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors hover:bg-accent',
                activeId === c.mentorId && 'bg-accent'
              )}
            >
              <div className="relative">
                <ImageWithFallback src={c.mentorAvatar} alt={c.mentorName} className="size-11 rounded-full object-cover" />
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white" style={{ fontWeight: 700 }}>
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate" style={{ fontWeight: 600 }}>{c.mentorName}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.time}</span>
                </div>
                {c.sessionLabel && (
                  <p className="text-xs text-primary" style={{ fontWeight: 500 }}>{c.sessionLabel}</p>
                )}
                <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {active ? (
          <>
            {/* Chat header */}
            <div className="flex h-16 items-center gap-3 border-b border-border bg-white px-5">
              <ImageWithFallback src={active.avatar} alt={active.name} className="size-9 rounded-full object-cover" />
              <div>
                <p style={{ fontWeight: 600 }}>{active.name}</p>
                <p className="text-sm text-success" style={{ fontWeight: 500 }}>Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-pale-blue/30">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.sender === 'student' ? 'justify-end' : 'justify-start')}>
                  {m.sender === 'mentor' && (
                    <ImageWithFallback src={active.avatar} alt={active.name} className="mr-2 size-8 self-end rounded-full object-cover" />
                  )}
                  <div className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-3 text-sm',
                    m.sender === 'student'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-white border border-border text-foreground'
                  )}>
                    <p>{m.text}</p>
                    <div className={cn('mt-1 flex items-center gap-1 text-xs', m.sender === 'student' ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground')}>
                      <span>{m.time}</span>
                      {m.sender === 'student' && <StatusIcon status={m.status} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <button className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent">
                  <Paperclip className="size-4" />
                </button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Type a message..."
                  className="bg-input-background"
                />
                <Button size="icon" onClick={send} disabled={!draft.trim()}>
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* Right sidebar — mentor mini-card */}
      {active && (
        <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-white xl:flex">
          <div className="p-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageWithFallback src={active.avatar} alt={active.name} className="size-16 rounded-2xl object-cover" />
              <div>
                <p style={{ fontWeight: 600 }}>{active.name}</p>
                <p className="text-sm text-primary">{active.role}</p>
                <p className="text-sm text-muted-foreground">{active.university}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-accent"
                    style={{ fontWeight: 500 }}
                  >
                    <Icon className="size-4 text-primary" /> {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
