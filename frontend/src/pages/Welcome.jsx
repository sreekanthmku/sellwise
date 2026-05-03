import { Users, Phone, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SuzukiSMark, SuzukiWordmark } from "@/components/SuzukiLogo";
import { ShowroomIllustration } from "@/components/ShowroomIllustration";
import { EligereLogo } from "@/components/EligereLogo";

const FeatureCard = ({ icon: Icon, title, subtitle, testid }) => (
  <div
    data-testid={testid}
    className="sw-card flex flex-1 flex-col items-center justify-start px-3 py-4 text-center"
  >
    <div className="sw-icon-tile mb-2 flex h-10 w-10 items-center justify-center">
      <Icon className="h-5 w-5" strokeWidth={2.25} />
    </div>
    <p className="text-[15px] font-extrabold leading-tight text-[color:var(--text-strong)]">
      {title}
    </p>
    <p className="mt-1 text-[12.5px] leading-snug text-[color:var(--text-muted)]">
      {subtitle}
    </p>
  </div>
);

export default function Welcome() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Will route to next screen once provided
    navigate("/");
  };

  return (
    <div
      data-testid="welcome-screen"
      className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-white px-6 pt-5 pb-6 sm:max-w-[460px] sm:rounded-none"
    >
      {/* Top bar */}
      <div className="flex items-center justify-end" data-testid="welcome-topbar">
        <LanguageSwitcher />
      </div>

      {/* Brand */}
      <div className="mt-2 flex flex-col items-center" data-testid="welcome-brand">
        <SuzukiSMark size={86} />
        <SuzukiWordmark className="mt-1 text-[34px] leading-none" />
        <span
          className="mt-1 text-[26px] font-extrabold leading-none text-[color:var(--suzuki-red)]"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {t.appName}
        </span>
      </div>

      {/* Showroom illustration */}
      <div
        className="mt-4 flex items-center justify-center"
        data-testid="welcome-illustration"
      >
        <ShowroomIllustration className="h-auto w-full max-w-[360px]" />
      </div>

      {/* Headline */}
      <div className="mt-5 text-center" data-testid="welcome-headline">
        <h1
          className="text-[26px] font-extrabold leading-[1.15] text-[color:var(--suzuki-blue)] sm:text-[28px]"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {t.headlineLine1}
          <br />
          {t.headlineLine2}
        </h1>
        <p className="mx-auto mt-3 max-w-[360px] text-[14.5px] leading-[1.55] text-[color:#4B5563]">
          {t.description}
        </p>
      </div>

      {/* Today prompt */}
      <p
        className="mt-7 text-center text-[16px] font-extrabold text-[color:var(--text-strong)]"
        data-testid="welcome-today-prompt"
      >
        {t.todayPrompt}
      </p>

      {/* Cards */}
      <div
        className="mt-3 grid grid-cols-3 gap-3"
        data-testid="welcome-feature-cards"
      >
        <FeatureCard
          icon={Users}
          title={t.cards.leads.title}
          subtitle={t.cards.leads.subtitle}
          testid="card-leads"
        />
        <FeatureCard
          icon={Phone}
          title={t.cards.smartCalling.title}
          subtitle={t.cards.smartCalling.subtitle}
          testid="card-smart-calling"
        />
        <FeatureCard
          icon={LineChart}
          title={t.cards.performance.title}
          subtitle={t.cards.performance.subtitle}
          testid="card-performance"
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleGetStarted}
        data-testid="get-started-btn"
        className="sw-cta mt-6 w-full rounded-full px-6 py-3.5 text-[16px] font-extrabold tracking-[0.01em] shadow-[0_8px_18px_rgba(37,99,235,0.28)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        {t.getStarted}
      </button>

      {/* Footer */}
      <div
        className="mt-5 flex items-center justify-center gap-2 pb-2"
        data-testid="welcome-footer"
      >
        <span className="text-[13.5px] font-semibold text-[color:#374151]">
          {t.poweredBy}
        </span>
        <EligereLogo />
      </div>
    </div>
  );
}
