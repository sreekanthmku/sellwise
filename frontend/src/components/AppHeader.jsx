import { Search, User } from "lucide-react";
import { SuzukiSMark } from "@/components/SuzukiLogo";
import { LangIconButton } from "@/components/LangIconButton";

const IconButton = ({ children, label, testid, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-testid={testid}
    className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--blue-100)] text-[color:var(--gray-200)] transition-colors hover:bg-[color:var(--blue-200)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]"
  >
    {children}
  </button>
);

export const AppHeader = () => (
  <header
    data-testid="app-header"
    className="flex items-center justify-between px-6 pt-4 pb-3"
  >
    <div className="flex items-center gap-2" data-testid="app-header-brand">
      <SuzukiSMark size={36} />
      <span className="font-suzuki text-[24px] font-bold leading-none text-[color:var(--suzuki-red)]">
        SellWise
      </span>
    </div>
    <div className="flex items-center gap-2">
      <LangIconButton />
      <IconButton label="Search" testid="header-search-btn">
        <Search className="h-5 w-5" strokeWidth={2} />
      </IconButton>
      <IconButton label="Profile" testid="header-profile-btn">
        <User className="h-5 w-5" strokeWidth={2} />
      </IconButton>
    </div>
  </header>
);

export default AppHeader;
