import React from 'react';
import {
  Sparkles,
  Calendar,
  CheckSquare,
  Target,
  Lightbulb,
  Briefcase,
  User,
  Settings,
  Bell,
  Activity,
  Heart,
  SlidersHorizontal,
  Shield,
  Lock,
} from 'lucide-react';
import { ActiveWorldFilter, Language } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { t } from '../lib/i18n';

export type NavTab =
  | 'home'
  | 'today'
  | 'mariluna'
  | 'prive'
  | 'ideas'
  | 'tasks'
  | 'calendar'
  | 'goals'
  | 'wellbeing'
  | 'cycle'
  | 'mylife'
  | 'settings'
  | 'security';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeWorld: ActiveWorldFilter;
  onSelectWorld: (world: ActiveWorldFilter) => void;
  onOpenAssistant: () => void;
  isAssistantOpen: boolean;
  sampleDataActive: boolean;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  securityLevel?: 1 | 2 | 3;
  isSensitiveUnlocked?: boolean;
  onLockApp?: () => void;
  lang?: Language;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeWorld,
  onSelectWorld,
  onOpenAssistant,
  isAssistantOpen,
  sampleDataActive,
  unreadNotificationCount = 0,
  onOpenNotifications,
  securityLevel = 1,
  isSensitiveUnlocked = false,
  onLockApp,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';

  // Primary 4 Main Experiences as requested
  const primaryDomainNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: isNl ? 'Vandaag' : 'Today', icon: Calendar },
    { id: 'mariluna', label: 'Mariluna', icon: Briefcase },
    { id: 'prive', label: isNl ? 'Privé' : 'Private Life', icon: Heart },
  ];

  // Retained Direct Access modules
  const secondaryNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'tasks', label: isNl ? 'Taken' : 'Tasks', icon: CheckSquare },
    { id: 'cycle', label: isNl ? 'Cyclus' : 'Cycle', icon: Activity },
    { id: 'wellbeing', label: isNl ? 'Welzijn' : 'Wellbeing', icon: Heart },
    { id: 'calendar', label: isNl ? 'Agenda' : 'Calendar', icon: Calendar },
  ];

  // Mobile clean 5-tab bar: Start, Vandaag, Mariluna, Privé, Taken
  const mobileNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: isNl ? 'Start' : 'Home', icon: Sparkles },
    { id: 'today', label: isNl ? 'Vandaag' : 'Today', icon: Calendar },
    { id: 'mariluna', label: 'Mariluna', icon: Briefcase },
    { id: 'prive', label: isNl ? 'Privé' : 'Private', icon: Heart },
    { id: 'tasks', label: isNl ? 'Taken' : 'Tasks', icon: CheckSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[#1C191E]/96 backdrop-blur-md transition-colors">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & World Filter */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => onSelectTab('home')}
            id="brand-logo-btn"
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-[var(--accent-secondary)]/40 bg-[var(--surface-1)] flex items-center justify-center shadow-xs group-hover:border-[#B5A48B] transition shrink-0">
              <span className="font-serif text-[11px] font-semibold text-[var(--accent-secondary)] tracking-tighter">
                P&M
              </span>
            </div>
            <span className="font-serif text-base sm:text-lg tracking-[0.2em] uppercase font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)] transition-colors select-none">
              ALCHEMY
            </span>
          </button>

          {/* World Switcher: Balanced vs Personal vs Mariluna */}
          <div className="hidden md:flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] p-0.5 text-xs">
            <button
              onClick={() => onSelectWorld('all')}
              id="world-filter-all"
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'all'
                  ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs font-medium'
                  : 'text-[#BDB3AA] hover:text-[#E8DCC7]'
              }`}
            >
              Balanced
            </button>
            <button
              onClick={() => onSelectWorld('personal')}
              id="world-filter-personal"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'personal'
                  ? 'bg-[#24443D] text-[#E5F0E9] shadow-xs font-medium border border-[#52786B]'
                  : 'text-[#BDB3AA] hover:text-[#E8DCC7]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#9A9B72]"></span>
              {isNl ? 'Persoonlijk Domein' : 'Personal Sanctuary'}
            </button>
            <button
              onClick={() => onSelectWorld('mariluna')}
              id="world-filter-mariluna"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'mariluna'
                  ? 'bg-[#563044] text-[#F3E5E9] shadow-xs font-medium border border-[#805269]'
                  : 'text-[#BDB3AA] hover:text-[#E8DCC7]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]"></span>
              {isNl ? 'Mariluna Studio' : 'Mariluna Studio'}
            </button>
          </div>
        </div>

        {/* Desktop Primary Nav items: Clearly distinguishing Vandaag, Mariluna, Privé, Ideeën */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
          {primaryDomainNavItems.map((item) => {
            const isActive = currentTab === item.id;
            const isMariluna = item.id === 'mariluna';
            const isPrive = item.id === 'prive';
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                id={`nav-tab-${item.id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? isMariluna
                      ? 'bg-[#563044] text-[#F3E5E9] border border-[#805269] shadow-xs font-semibold'
                      : isPrive
                      ? 'bg-[#24443D] text-[#E5F0E9] border border-[#52786B] shadow-xs font-semibold'
                      : 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs font-semibold'
                    : isMariluna
                    ? 'text-[#D7B9C5] bg-[#30232C] hover:bg-[#563044]'
                    : isPrive
                    ? 'text-[#B8D1C7] bg-[#202D29] hover:bg-[#24443D] hover:text-[#E5F0E9]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
                }`}
              >
                {isMariluna && <span className="w-1.5 h-1.5 rounded-full bg-[#D6C69B]" />}
                {isPrive && <span className="w-1.5 h-1.5 rounded-full bg-[#A2A36B]" />}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-[var(--border-strong)] mx-1"></div>

          {/* Retained direct access modules: Taken, Cyclus, Welzijn, Agenda */}
          <div className="flex items-center gap-0.5">
            {secondaryNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  id={`nav-tab-${item.id}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-semibold'
                      : 'text-[#BDB3AA] hover:text-[#E8DCC7] hover:bg-[#302B33]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Actions: Notifications, AI Assistant, PWA Install, Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton />

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            id="notification-center-btn"
            title="Notification Center & Quiet Hours"
            className="relative p-2 rounded-full border border-transparent text-[#BDB3AA] hover:text-[#E8DCC7] hover:bg-[#302B33] transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D6C69B] ring-2 ring-[#20231f]"></span>
            )}
          </button>

          {/* Central AI Assistant Button */}
          <button
            onClick={onOpenAssistant}
            id="assistant-open-btn"
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
              isAssistantOpen
                ? 'bg-[#D1A9B9] text-[#321F32] border-[#F0EBDD] shadow-sm ring-2 ring-[#D6C69B]/40'
                : 'bg-[#302B33] text-[#E8DCC7] border-[#51424A] hover:border-[#B49A79] hover:bg-[#302B33]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D6C69B]" />
            <span className="hidden sm:inline">JARVIS AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => onSelectTab('settings')}
            id="settings-tab-btn"
            title={isNl ? "Instellingen & systeemgeheugen" : "Settings & System Memory"}
            className={`p-2 rounded-full border border-transparent transition cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#302B33] text-[#E8DCC7]'
                : 'text-[#BDB3AA] hover:text-[#E8DCC7] hover:bg-[#302B33]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar on mobile for World Switcher */}
      <div className="md:hidden px-4 py-2 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[#1C191E]">
        <div className="flex items-center gap-1 w-full justify-center">
          <button
            onClick={() => onSelectWorld('all')}
            className={`px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'all'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs font-medium'
                : 'text-[#BDB3AA]'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => onSelectWorld('personal')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'personal'
                ? 'bg-[#24443D] text-[#E5F0E9] shadow-xs font-medium border border-[#52786B]'
                : 'text-[#BDB3AA]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A2A36B]"></span>
            Personal
          </button>
          <button
            onClick={() => onSelectWorld('mariluna')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'mariluna'
                ? 'bg-[#563044] text-[#F3E5E9] font-medium border border-[#805269]'
                : 'text-[#BDB3AA]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6C69B]"></span>
            Mariluna
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1C191E]/96 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                isActive ? 'text-[#F0E4E3] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[var(--accent-rose)]' : 'text-[var(--text-muted)]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
