import { useState } from "react";
import {
  Bell,
  Mail,
  Megaphone,
  Settings,
  UserRound,
} from "lucide-react";
import { AppScreen } from "@/components/AppScreen";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";

function IconBadge({ icon: Icon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[color:var(--suzuki-blue)]">
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </span>
  );
}

function SettingRow({ icon: Icon, label, value, trailing }) {
  return (
    <div className="flex min-h-[42px] items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-[#8c8c8c]" strokeWidth={2} />
      <span className="font-body text-[15px] font-medium leading-none text-[color:var(--gray-300)]">
        {label}
      </span>
      <span className="ml-auto flex items-center gap-2">
        {value ? (
          <span className="text-[14px] text-[color:var(--gray-200)]">{value}</span>
        ) : null}
        {trailing}
      </span>
    </div>
  );
}

export default function Profile() {
  const { t } = useLanguage();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [leadAlertsEnabled, setLeadAlertsEnabled] = useState(true);
  const profileSwitchClass =
    "h-6 w-11 border-0 bg-[#d9d9d9] shadow-none data-[state=checked]:bg-[#2563EA] data-[state=unchecked]:bg-[#d9d9d9] [&>span]:h-4 [&>span]:w-4 [&>span]:bg-white [&>span]:shadow-sm data-[state=unchecked]:[&>span]:translate-x-0 data-[state=checked]:[&>span]:translate-x-5";

  return (
    <AppScreen
      screenTestId="profile-screen"
      mainTestId="profile-main"
      mainBgClass="bg-[#F7F8FB]"
      showBottomNav
    >
      <div className="pt-[16px] pb-0">
        <h1 className="font-suzuki text-[18px] font-bold leading-none text-[color:var(--gray-300)]">
          {t.profile.title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-10 pt-4">
        <section className="flex items-center gap-3.5">
          <Avatar className="h-[84px] w-[84px] border border-[#d9e0f6] bg-[color:var(--suzuki-blue)]">
            <AvatarFallback className="bg-[color:var(--suzuki-blue)] text-white">
              <UserRound className="h-8 w-8" strokeWidth={1.9} />
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="font-body text-[20px] font-bold leading-tight text-[color:var(--gray-300)]">
              {t.profile.name}
            </p>
            <p className="mt-1 text-[14px] leading-tight text-[color:var(--gray-200)]">
              {t.profile.role}
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-tight text-[color:var(--blue-600)]">
              {t.profile.dealership}
            </p>
          </div>
        </section>

        <Card className="mt-6 rounded-2xl border-[#e8eaef] bg-white px-4 py-4 shadow-[var(--card-shadow)]">
          <div className="space-y-6">
            <section>
              <div className="mb-3.5 flex items-center gap-3">
                <IconBadge icon={Settings} />
                <h2 className="text-[16px] font-bold text-[color:var(--gray-300)]">
                  {t.profile.accountSettings}
                </h2>
              </div>

              <div className="space-y-3.5 pl-0.5">
                <SettingRow icon={UserRound} label={t.profile.editProfile} />
                <SettingRow icon={Mail} label={t.profile.email} value={t.profile.emailValue} />
              </div>
            </section>

            <div className="h-px bg-[#eceff5]" />

            <section>
              <div className="mb-3.5 flex items-center gap-3">
                <IconBadge icon={Bell} />
                <h2 className="text-[16px] font-bold text-[color:var(--gray-300)]">
                  {t.profile.notifications}
                </h2>
              </div>

              <div className="space-y-3.5 pl-0.5">
                <SettingRow
                  icon={Bell}
                  label={t.profile.pushNotifications}
                  trailing={
                    <Switch
                      checked={pushEnabled}
                      onCheckedChange={setPushEnabled}
                      aria-label={t.profile.togglePushNotifications}
                      className={profileSwitchClass}
                    />
                  }
                />
                <SettingRow
                  icon={Mail}
                  label={t.profile.emailUpdates}
                  trailing={
                    <Switch
                      checked={emailEnabled}
                      onCheckedChange={setEmailEnabled}
                      aria-label={t.profile.toggleEmailUpdates}
                      className={profileSwitchClass}
                    />
                  }
                />
                <SettingRow
                  icon={Megaphone}
                  label={t.profile.leadAlerts}
                  trailing={
                    <Switch
                      checked={leadAlertsEnabled}
                      onCheckedChange={setLeadAlertsEnabled}
                      aria-label={t.profile.toggleLeadAlerts}
                      className={profileSwitchClass}
                    />
                  }
                />
              </div>
            </section>
          </div>
        </Card>
      </div>
    </AppScreen>
  );
}
