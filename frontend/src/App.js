import { useEffect } from "react";
import "@/App.css";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/context/LanguageContext";
import { LeadsDataProvider } from "@/context/LeadsDataContext";
import Welcome from "@/pages/Welcome";
import { CallShell } from "@/components/CallShell";
import { VobizProvider } from "@/vobiz/VobizProvider";
import Leads from "@/pages/Leads";
import LeadDetails from "@/pages/LeadDetails";
import CallDetails from "@/pages/CallDetails";
import CallFeedback from "@/pages/CallFeedback";
import ActiveCall from "@/pages/ActiveCall";
import Performance from "@/pages/Performance";
import Guide from "@/pages/Guide";
import { DocumentChrome } from "@/components/DocumentChrome";
import Profile from "@/pages/Profile";
import HeaderProfileNavigation from "@/components/HeaderProfileNavigation";
import Analyze from "@/pages/Analyze";
import DialerOutboundCall from "@/pages/DialerOutboundCall";
import Dialer from "@/pages/Dialer";
import { BackNavigationToLeads } from "@/components/BackNavigationToLeads";

const SPLASH_VISIBLE_MS = 2000;

/** Shell for all routes: chrome, VoIP, leads data, and `Outlet` for the page. */
function AppShell() {
  return (
    <>
      <BackNavigationToLeads />
      <HeaderProfileNavigation />
      <DocumentChrome />
      <VobizProvider>
        <CallShell />
        <LeadsDataProvider>
          <Outlet />
        </LeadsDataProvider>
      </VobizProvider>
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Welcome /> },
      { path: "/leads/:leadId/call-feedback", element: <CallFeedback /> },
      { path: "/leads/:leadId/call-details", element: <CallDetails /> },
      { path: "/leads/:leadId/call", element: <ActiveCall /> },
      { path: "/leads/:leadId", element: <LeadDetails /> },
      { path: "/leads", element: <Leads /> },
      { path: "/call-feedback", element: <CallFeedback /> },
      { path: "/perform", element: <Performance /> },
      { path: "/guide", element: <Guide /> },
      { path: "/analyze", element: <Analyze /> },
      { path: "/dialer/call", element: <DialerOutboundCall /> },
      { path: "/dialer", element: <Dialer /> },
      { path: "/profile", element: <Profile /> },
    ],
  },
]);

function App() {
  useEffect(() => {
    const el = document.getElementById("pwa-splash-screen");
    if (!el) return;
    let done = false;
    const remove = () => {
      if (done) return;
      done = true;
      el.remove();
    };
    const hideTimer = window.setTimeout(() => {
      requestAnimationFrame(() => {
        el.classList.add("pwa-splash-screen--hide");
      });
    }, SPLASH_VISIBLE_MS);
    el.addEventListener("transitionend", remove, { once: true });
    const fallback = window.setTimeout(remove, SPLASH_VISIBLE_MS + 500);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <LanguageProvider>
      <div className="App">
        <RouterProvider router={router} />
        <Toaster
          position="bottom-center"
          offset={80}
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-[#e4e4e4] bg-white text-[color:var(--gray-300)] shadow-lg font-body text-[14px] font-medium",
              success: "bg-white",
            },
          }}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;
