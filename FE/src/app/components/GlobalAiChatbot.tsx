import { useState } from 'react';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { generalChat } from '../services/aiService';
import { cn } from './ui/utils';
import { FormattedText } from './FormattedText';

export function GlobalAiChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    {
      role: 'ai',
      text: 'Chào bạn! Mình là Gradora AI. Bạn cần mình tư vấn gia sư môn học nào hay giải đáp thắc mắc gì không?',
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Tìm gia sư môn PRJ301',
    'Quy trình thanh toán ký quỹ',
    'Học phí gia sư bao nhiêu?',
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (overrideMsg?: string) => {
    const text = (overrideMsg ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await generalChat(text);
      setMessages((prev) => [...prev, { role: 'ai', text: res.answer }]);
      if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
        setSuggestions(res.suggestedQuestions);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Xin lỗi, không thể kết nối tới Gradora AI lúc này. Vui lòng thử lại sau!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {open && (
        <div className="mb-4 flex h-[500px] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-primary/20 bg-background shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Gradora AI</p>
                <p className="text-[11px] text-primary-foreground/80">Trợ lý học tập 24/7</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-primary-foreground hover:bg-white/20"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-xl p-3 max-w-[85%]',
                  m.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted/70 text-foreground'
                )}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                ) : (
                  <FormattedText content={m.text} />
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Gradora AI đang suy nghĩ…
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && !loading && (
              <div className="mt-3 border-t border-border/50 pt-2">
                <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">💡 Gợi ý câu hỏi:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sg)}
                      className="rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-left text-xs text-primary transition-colors hover:bg-primary/15"
                    >
                      💬 {sg}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="border-t border-border p-3 bg-muted/20 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 items-center rounded-xl border-2 border-primary/40 bg-background px-2 py-1 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi AI bất kỳ điều gì…"
                className="h-9 border-none bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="size-8 rounded-lg bg-primary hover:bg-primary/90 shadow-sm shrink-0">
                <Send className="size-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="size-14 rounded-full shadow-xl hover:scale-105 transition-transform bg-primary text-primary-foreground"
          size="icon"
        >
          <Sparkles className="size-6 animate-pulse" />
        </Button>
      )}
    </div>
  );
}
