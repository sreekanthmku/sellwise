import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Compact globe-icon button variant of the language picker (used in app headers).
 */
export const LangIconButton = () => {
  const { lang, setLang, languages } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="lang-icon-button"
        aria-label="Change language"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--blue-100)] text-[color:var(--gray-200)] transition-colors hover:bg-[color:var(--blue-200)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
      >
        <Globe className="h-5 w-5" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            data-testid={`lang-icon-option-${l.code}`}
            onSelect={() => setLang(l.code)}
            className={`cursor-pointer text-sm ${
              l.code === lang
                ? "font-semibold text-[color:var(--blue-600)]"
                : ""
            }`}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LangIconButton;
