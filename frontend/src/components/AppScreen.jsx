import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

/**
 * Standard mobile shell: app canvas, optional header, padded main, optional bottom nav.
 * Horizontal padding is fixed at 16px for consistency across screens.
 *
 * When the bottom nav is shown, the shell defaults to a locked viewport height so
 * `main` + inner `flex-1 overflow-y-auto` regions get a bounded height and scroll correctly.
 */
export function AppScreen({
  children,
  screenTestId,
  mainTestId,
  showHeader = true,
  showBottomNav = false,
  /** Override auto: lock height when bottom nav is on (fixes nested scroll / “content won’t load”) */
  lockViewportHeight,
  mainBgClass = "",
  mainClassName = "",
}) {
  const viewportLocked = lockViewportHeight ?? showBottomNav;

  return (
    <div
      data-testid={screenTestId}
      className={cn(
        "relative mx-auto flex w-full max-w-[440px] flex-col bg-[var(--app-canvas)]",
        viewportLocked
          ? "h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden"
          : "min-h-screen",
      )}
    >
      {showHeader ? <AppHeader /> : null}
      <main
        data-testid={mainTestId}
        className={cn(
          "flex min-h-0 flex-1 flex-col px-[16px]",
          mainBgClass,
          mainClassName,
        )}
      >
        {children}
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}

export default AppScreen;
