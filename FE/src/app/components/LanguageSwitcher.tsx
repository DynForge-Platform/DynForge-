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
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm outline-none transition-colors',
          light
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
            : 'border-border bg-white text-foreground hover:bg-accent'
        )}
        style={{ fontWeight: 500 }}
      >
        <Globe className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="hidden md:inline">{current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {langs.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs" style={{ fontWeight: 700 }}>
                {l.flag}
              </span>
              <span>{l.label}</span>
            </div>
            {lang === l.code && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
