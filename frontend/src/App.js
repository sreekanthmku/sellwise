import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/context/LanguageContext";
import Welcome from "@/pages/Welcome";
import Leads from "@/pages/Leads";
import LeadDetails from "@/pages/LeadDetails";
import CallDetails from "@/pages/CallDetails";
import CallFeedback from "@/pages/CallFeedback";
import ActiveCall from "@/pages/ActiveCall";
import Performance from "@/pages/Performance";
import Guide from "@/pages/Guide";

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <BrowserRouter>
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
