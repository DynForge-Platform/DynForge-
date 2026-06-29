import { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Users, MonitorUp,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { cn } from './ui/utils';
import { toast } from 'sonner';

interface MeetProps {
  course: string;
  partnerName: string;
  partnerAvatar: string;
  partnerRole: string;
  durationMinutes: number;
  onClose: () => void;
}

function ControlBtn({
  icon: Icon, active = true, onClick, label,
}: { icon: React.ElementType; active?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl px-5 py-3 transition-colors',
        active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
      )}
    >
      <Icon className="size-5" />
      <span className="text-xs" style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}

export function MeetRoomOverlay({ course, partnerName, partnerAvatar, partnerRole, durationMinutes, onClose }: MeetProps) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [elapsed, setElapsed] = useState('00:00');

  useState(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${sec}`);
    }, 1000);
    return () => clearInterval(id);
  });

  const end = () => {
    toast.success('Session ended. Please mark it as completed.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1117]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white text-xs" style={{ fontWeight: 700 }}>G</span>
          <div>
            <p className="text-sm text-white" style={{ fontWeight: 600 }}>{course}</p>
            <p className="text-xs text-white/50">with {partnerName} · {durationMinutes} min</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-danger/20 px-3 py-1 text-xs text-red-400">
          <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE · {elapsed}
        </span>
      </div>

      {/* Video area */}
      <div className="flex flex-1 gap-3 min-h-0 px-6 pb-4">
        {/* Partner (main) */}
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#1c1f2e]">
          <ImageWithFallback
            src={partnerAvatar}
            alt={partnerName}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute bottom-4 left-4 rounded-xl bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur" style={{ fontWeight: 500 }}>
            {partnerName} ({partnerRole})
          </div>
        </div>
        {/* Self */}
        <div className="relative w-48 self-end overflow-hidden rounded-2xl bg-[#1c1f2e]">
          <div className="flex aspect-video items-center justify-center">
            {cam ? (
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/30 text-white text-2xl" style={{ fontWeight: 700 }}>
                L
              </div>
            ) : (
              <VideoOff className="size-8 text-white/30" />
            )}
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-white/60">You</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-8">
        <ControlBtn icon={mic ? Mic : MicOff} active={mic} onClick={() => setMic(!mic)} label={mic ? 'Mute' : 'Unmute'} />
        <ControlBtn icon={cam ? Video : VideoOff} active={cam} onClick={() => setCam(!cam)} label={cam ? 'Stop video' : 'Start video'} />
        <ControlBtn icon={MessageSquare} onClick={() => toast.info('Chat panel — coming soon.')} label="Chat" />
        <ControlBtn icon={Users} onClick={() => toast.info('Participants panel.')} label="Participants" />
        <ControlBtn icon={MonitorUp} onClick={() => toast.info('Screen share — coming soon.')} label="Share screen" />
        <button
          onClick={end}
          className="flex flex-col items-center gap-1 rounded-2xl bg-danger px-6 py-3 text-white transition-opacity hover:opacity-90"
        >
          <PhoneOff className="size-5" />
          <span className="text-xs" style={{ fontWeight: 500 }}>End</span>
        </button>
      </div>
    </div>
  );
}
