import React from 'react';
import { ArrowUpRight, Bell, LockKeyhole, Plus, Sparkles } from 'lucide-react';

interface HomeLauncherProps {
  onEnterMariluna: () => void;
  onEnterPrivate: () => void;
  onQuickCapture: () => void;
  onOpenJarvis: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  unreadNotificationCount?: number;
  lang?: 'nl' | 'en';
}

export const HomeLauncher: React.FC<HomeLauncherProps> = ({
  onEnterMariluna,
  onEnterPrivate,
  onQuickCapture,
  onOpenJarvis,
  onOpenNotifications,
  onOpenSettings,
  unreadNotificationCount = 0,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const dateLabel = new Intl.DateTimeFormat(isNl ? 'nl-BE' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <main className="alchemy-home min-h-[calc(100vh-5rem)] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="mb-12 flex items-center justify-between gap-4">
          <div>
            <p className="alchemy-eyebrow">{dateLabel}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="alchemy-monogram">A</span>
              <span className="font-serif text-2xl tracking-[0.22em] text-[var(--text-primary)]">ALCHEMY</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenNotifications} className="alchemy-icon-button relative" aria-label={isNl ? 'Meldingen' : 'Notifications'}>
              <Bell size={18} />
              {unreadNotificationCount > 0 && <span className="alchemy-notification-dot" />}
            </button>
            <button type="button" onClick={onOpenSettings} className="alchemy-icon-button" aria-label={isNl ? 'Instellingen en beveiliging' : 'Settings and security'}>
              <LockKeyhole size={18} />
            </button>
          </div>
        </header>

        <section className="mb-10 max-w-2xl">
          <p className="alchemy-eyebrow">{isNl ? 'Twee werelden. Eén persoonlijke ruimte.' : 'Two worlds. One personal space.'}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-[var(--text-primary)] sm:text-6xl">
            {isNl ? 'Waar wil je vandaag binnenstappen?' : 'Where would you like to step in today?'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {isNl
              ? 'Kies je wereld. Alles wat je daar doet, blijft binnen de juiste context.'
              : 'Choose your world. What you do there stays in the right context.'}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label={isNl ? 'Kies je domein' : 'Choose your domain'}>
          <button type="button" onClick={onEnterMariluna} className="alchemy-domain-card alchemy-domain-card--mariluna group text-left">
            <div className="flex items-start justify-between">
              <span className="alchemy-domain-symbol">✧</span>
              <ArrowUpRight className="mt-1 opacity-65 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={21} />
            </div>
            <div className="mt-16">
              <p className="alchemy-eyebrow alchemy-eyebrow--light">BOTANICAL ALCHEMY</p>
              <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Mariluna</h2>
              <p className="mt-3 max-w-xs text-sm leading-6 opacity-80">
                {isNl ? 'Je creatieve atelier voor visie, strategie en onderneming.' : 'Your creative atelier for vision, strategy and business.'}
              </p>
              <span className="alchemy-enter-label">{isNl ? 'Betreed Mariluna' : 'Enter Mariluna'}</span>
            </div>
          </button>

          <button type="button" onClick={onEnterPrivate} className="alchemy-domain-card alchemy-domain-card--private group text-left">
            <div className="flex items-start justify-between">
              <span className="alchemy-domain-symbol">☾</span>
              <ArrowUpRight className="mt-1 opacity-65 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={21} />
            </div>
            <div className="mt-16">
              <p className="alchemy-eyebrow alchemy-eyebrow--light">EARTHBOUND</p>
              <h2 className="mt-2 font-serif text-4xl sm:text-5xl">{isNl ? 'Privé' : 'Private'}</h2>
              <p className="mt-3 max-w-xs text-sm leading-6 opacity-80">
                {isNl ? 'Je persoonlijke ruimte voor leven, welzijn en groei.' : 'Your personal space for life, wellbeing and growth.'}
              </p>
              <span className="alchemy-enter-label">{isNl ? 'Betreed Privé' : 'Enter Private'}</span>
            </div>
          </button>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-5">
          <button type="button" onClick={onQuickCapture} className="alchemy-utility-button">
            <Plus size={16} /> {isNl ? 'Snel vastleggen' : 'Quick capture'}
          </button>
          <button type="button" onClick={onOpenJarvis} className="alchemy-utility-button">
            <Sparkles size={16} /> Jarvis
          </button>
        </footer>
      </div>
    </main>
  );
};
