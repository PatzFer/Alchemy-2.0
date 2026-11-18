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
    { id: 'ideas', label: isNl ? 'Ideeën' : 'Ideas', icon: Lightbulb },
  ];

  // Retained Direct Access modules
  const secondaryNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'tasks', label: isNl ? 'Taken' : 'Tasks', icon: CheckSquare },
    { id: 'cycle', label: isNl ? 'Cyclus' : 'Cycle', icon: Activity },
    { id: 'wellbeing', label: isNl ? 'Welzijn' : 'Wellbeing', icon: Heart },
    { id: 'calendar', label: isNl ? 'Agenda' : 'Calendar', icon: Calendar },
  ];

  // Mobile clean 5-tab bar: Vandaag, Mariluna, Privé, Ideeën, Taken
  const mobileNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: isNl ? 'Vandaag' : 'Today', icon: Calendar },
    { id: 'mariluna', label: 'Mariluna', icon: Briefcase },
    { id: 'prive', label: isNl ? 'Privé' : 'Privé', icon: Heart },
    { id: 'ideas', label: isNl ? 'Ideeën' : 'Ideas', icon: Lightbulb },
    { id: 'tasks', label: isNl ? 'Taken' : 'Tasks', icon: CheckSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#343a32] bg-[#20231f]/90 backdrop-blur-md transition-colors">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & World Filter */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => onSelectTab('today')}
            id="brand-logo-btn"
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-[#555A50] bg-[#30352f] flex items-center justify-center shadow-xs group-hover:border-[#B5A48B] transition shrink-0">
              <span className="font-serif text-[11px] font-semibold text-[#D6C69B] tracking-tighter">
                P&M
              </span>
            </div>
            <span className="font-serif text-base sm:text-lg tracking-[0.2em] uppercase font-medium text-[#F0EBDD] group-hover:text-[#D6C69B] transition-colors select-none">
              ALCHEMY
            </span>
          </button>

          {/* World Switcher: Balanced vs Personal vs Mariluna */}
          <div className="hidden md:flex items-center rounded-full border border-[#3D443B] bg-[#282c27] p-0.5 text-xs">
            <button
              onClick={() => onSelectWorld('all')}
              id="world-filter-all"
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'all'
                  ? 'bg-[#30352f] text-[#F0EBDD] shadow-xs font-medium'
                  : 'text-[#B7B7A9] hover:text-[#F0EBDD]'
              }`}
            >
              Balanced
            </button>
            <button
              onClick={() => onSelectWorld('personal')}
              id="world-filter-personal"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'personal'
                  ? 'bg-[#30352f] text-[#F0EBDD] shadow-xs font-medium border border-[#E2DDD2]'
                  : 'text-[#B7B7A9] hover:text-[#F0EBDD]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478]"></span>
              {isNl ? 'Persoonlijk Domein' : 'Personal Sanctuary'}
            </button>
            <button
              onClick={() => onSelectWorld('mariluna')}
              id="world-filter-mariluna"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'mariluna'
                  ? 'bg-[#F0EBDD] text-[#20231f] shadow-xs font-medium'
                  : 'text-[#B7B7A9] hover:text-[#F0EBDD]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6C69B]"></span>
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
                      ? 'bg-[#F0EBDD] text-[#20231f] shadow-xs font-semibold'
                      : isPrive
                      ? 'bg-[#F0EBDD] text-[#F0EBDD] shadow-xs font-semibold'
                      : 'bg-[#30352f] text-[#F0EBDD] shadow-xs font-semibold'
                    : isMariluna
                    ? 'text-[#4A3E31] bg-[#263D35] hover:bg-[#304b40] hover:text-[#F0EBDD]'
                    : isPrive
                    ? 'text-[#F0EBDD] bg-[#282c27] hover:bg-[#39312B] hover:text-[#F0EBDD]'
                    : 'text-[#B7B7A9] hover:text-[#F0EBDD] hover:bg-[#F2ECE1]'
                }`}
              >
                {isMariluna && <span className="w-1.5 h-1.5 rounded-full bg-[#D6C69B]" />}
                {isPrive && <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478]" />}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-[#3D443B] mx-1"></div>

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
                      ? 'bg-[#30352f] text-[#F0EBDD] font-semibold'
                      : 'text-[#B7B7A9] hover:text-[#F0EBDD] hover:bg-[#F2ECE1]'
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
            className="relative p-2 rounded-full border border-transparent text-[#B7B7A9] hover:text-[#F0EBDD] hover:bg-[#30352f] transition cursor-pointer"
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
                ? 'bg-[#F0EBDD] text-[#20231f] border-[#F0EBDD] shadow-sm ring-2 ring-[#D6C69B]/40'
                : 'bg-[#F2ECE1] text-[#F0EBDD] border-[#555A50] hover:border-[#B49A7A] hover:bg-[#EAE3D6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D6C69B]" />
            <span className="hidden sm:inline">JARVIS AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Security & Privacy Center Button */}
          <button
            onClick={() => onSelectTab('security')}
            id="security-center-btn"
            title="Security & Privacy Center (Passkeys, Levels, Data Firewall)"
            className={`relative p-2 rounded-full border border-transparent transition cursor-pointer ${
              currentTab === 'security'
                ? 'bg-[#30352f] text-[#F0EBDD]'
                : 'text-[#B7B7A9] hover:text-[#F0EBDD] hover:bg-[#30352f]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#20231f] ${
                securityLevel === 3
                  ? 'bg-[#3A6B35] animate-pulse'
                  : isSensitiveUnlocked
                  ? 'bg-[#D6C69B]'
                  : 'bg-[#D6C69B]'
              }`}
            />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => onSelectTab('settings')}
            id="settings-tab-btn"
            title="Settings & System Memory"
            className={`p-2 rounded-full border border-transparent transition cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#30352f] text-[#F0EBDD]'
                : 'text-[#B7B7A9] hover:text-[#F0EBDD] hover:bg-[#30352f]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar on mobile for World Switcher */}
      <div className="md:hidden px-4 py-2 border-t border-[#343a32] flex items-center justify-between bg-[#F8F5EE]">
        <div className="flex items-center gap-1 w-full justify-center">
          <button
            onClick={() => onSelectWorld('all')}
            className={`px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'all'
                ? 'bg-[#30352f] text-[#F0EBDD] shadow-xs font-medium'
                : 'text-[#B7B7A9]'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => onSelectWorld('personal')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'personal'
                ? 'bg-[#30352f] text-[#F0EBDD] shadow-xs font-medium border border-[#555A50]'
                : 'text-[#B7B7A9]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478]"></span>
            Personal
          </button>
          <button
            onClick={() => onSelectWorld('mariluna')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'mariluna'
                ? 'bg-[#F0EBDD] text-[#20231f] font-medium'
                : 'text-[#B7B7A9]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6C69B]"></span>
            Mariluna
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#20231f]/95 backdrop-blur-md border-t border-[#343a32] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                isActive ? 'text-[#F0EBDD] font-semibold' : 'text-[#858A7F] hover:text-[#F0EBDD]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#8C7654]' : 'text-[#858A7F]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
