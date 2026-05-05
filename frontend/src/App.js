import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const SPLASH_VISIBLE_MS = 2000;

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
        <BrowserRouter>
          <DocumentChrome />
          <VobizProvider>
            <CallShell />
            <LeadsDataProvider>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/leads/:leadId/call-feedback" element={<CallFeedback />} />
                <Route path="/leads/:leadId/call-details" element={<CallDetails />} />
                <Route path="/leads/:leadId/call" element={<ActiveCall />} />
                <Route path="/leads/:leadId" element={<LeadDetails />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/perform" element={<Performance />} />
                <Route path="/guide" element={<Guide />} />
              </Routes>
            </LeadsDataProvider>
          </VobizProvider>
        </BrowserRouter>
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
