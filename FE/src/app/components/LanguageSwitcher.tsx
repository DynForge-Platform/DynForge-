import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../context/LanguageContext';
import { cn } from './ui/utils';

const langs = [
  { code: 'en' as const, flag: 'EN', label: 'English' },
  { code: 'vi' as const, flag: 'VN', label: 'Tiếng Việt' },
];

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { lang, setLang } = useLanguage();
  const current = langs.find((l) => l.code === lang) ?? langs[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm outline-none transition-all cursor-pointer backdrop-blur-md',
          light
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
            : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
        )}
        style={{ fontWeight: 500 }}
      >
        <Globe className="size-3.5 shrink-0 text-cyan-400" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="hidden md:inline">{current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-[#090f1e] border-white/10 text-slate-100 shadow-2xl">
        {langs.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="flex items-center justify-between cursor-pointer focus:bg-white/10 focus:text-white"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-1.5 py-0.5 text-xs font-semibold">
                {l.flag}
              </span>
              <span className="text-sm">{l.label}</span>
            </div>
            {lang === l.code && <Check className="size-4 text-cyan-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
