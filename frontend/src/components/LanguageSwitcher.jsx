import { Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";

export const LanguageSwitcher = () => {
  const { lang, setLang, languages } = useLanguage();
  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="language-switcher-trigger"
        className="sw-lang-pill inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" strokeWidth={2.25} />
        <span data-testid="language-switcher-current">{current.label}</span>
        <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px] rounded-xl"
        data-testid="language-switcher-menu"
      >
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            data-testid={`language-option-${l.code}`}
            onSelect={() => setLang(l.code)}
            className={`cursor-pointer text-sm ${
              l.code === lang ? "font-semibold text-[color:var(--action-blue)]" : ""
            }`}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
