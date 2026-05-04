import { Users, Phone, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AppScreen } from "@/components/AppScreen";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { EligereLogo } from "@/components/EligereLogo";

const FeatureCard = ({ icon: Icon, title, subtitle, testid }) => (
  <div
    data-testid={testid}
    className="sw-card flex flex-1 flex-col items-center justify-start px-3 py-4 text-center"
  >
    <div className="sw-icon-tile mb-2 flex h-10 w-10 items-center justify-center">
      <Icon className="h-5 w-5" strokeWidth={2.25} />
    </div>
    <p className="font-suzuki text-[15px] font-extrabold leading-tight text-[color:var(--text-strong)]">
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
    navigate("/leads");
  };

  return (
    <AppScreen
      screenTestId="welcome-screen"
      showHeader={false}
      mainClassName="pb-6"
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-end pt-[max(1.25rem,env(safe-area-inset-top,0px))]"
        data-testid="welcome-topbar"
      >
        <LanguageSwitcher />
      </div>

      {/* Brand */}
      <div className="mt-2 flex flex-col items-center" data-testid="welcome-brand">
        <img
          src={`${process.env.PUBLIC_URL}/Suzuki_logo_2025.svg`}
          alt="Suzuki"
          className="h-auto w-full max-w-[130px] object-contain"
          decoding="async"
        />
        <span
          className="font-suzuki mt-2 text-[26px] font-extrabold leading-none text-[color:var(--suzuki-red)]"
        >
          {t.appName}
        </span>
      </div>

      {/* Hero */}
      <div
        className="mt-4 flex items-center justify-center"
        data-testid="welcome-illustration"
      >
        <img
          src={`${process.env.PUBLIC_URL}/login-hero.png`}
          alt="Suzuki dealer with vehicle and growth chart"
          className="h-auto w-full max-w-[360px] rounded-[12px] object-cover object-center shadow-[0_4px_24px_rgba(15,23,42,0.08)]"
          decoding="async"
        />
      </div>

      {/* Headline */}
      <div className="mt-5 text-center" data-testid="welcome-headline">
        <h1
          className="font-suzuki text-[26px] font-extrabold leading-[1.15] text-[color:var(--suzuki-blue)] sm:text-[28px]"
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
        className="font-suzuki mt-6 w-full rounded-[12px] bg-[#2563EA] px-6 py-3.5 text-[16px] font-extrabold tracking-[0.01em] text-white transition-[background-color,transform] duration-[160ms] ease-out hover:bg-[#1e40ae] active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
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
        <EligereLogo className="max-h-6 max-w-[96px]" />
      </div>
    </AppScreen>
  );
}
