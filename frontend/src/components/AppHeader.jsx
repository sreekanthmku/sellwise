import { User } from "lucide-react";
import { LangIconButton } from "@/components/LangIconButton";

const headerIconBtnClass =
  "flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4fc] text-[#6b7380] transition-colors hover:bg-[#e9ecf7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-400)]";

const IconButton = ({ children, label, testid, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-testid={testid}
    className={headerIconBtnClass}
  >
    {children}
  </button>
);

export const AppHeader = () => (
  <header
    data-testid="app-header"
    className="flex shrink-0 items-center justify-between border-b border-[#e4e4e4] bg-white px-[16px] pb-2 pt-[max(12px,env(safe-area-inset-top,0px))]"
  >
    <div className="flex items-center gap-2" data-testid="app-header-brand">
      <img
        src={`${process.env.PUBLIC_URL || ""}/Suzuki_logo_icon.svg`}
        alt="Suzuki"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
        decoding="async"
      />
      <span className="font-suzuki text-[18px] font-bold leading-none text-[color:var(--suzuki-red)]">
        SellWise
      </span>
    </div>
    <div className="flex items-center gap-[10px]">
      <LangIconButton />
      <IconButton label="Profile" testid="header-profile-btn">
        <User className="h-5 w-5" fill="currentColor" strokeWidth={2.25} />
      </IconButton>
    </div>
  </header>
);

export default AppHeader;
