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
  SlidersHorizontal,
  Shield,
} from 'lucide-react';
import { ActiveWorldFilter } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab =
  | 'today'
  | 'tasks'
  | 'calendar'
  | 'goals'
  | 'ideas'
  | 'mariluna'
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
}) => {
  const coreNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  ];

  const personalNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'cycle', label: 'Cycle', icon: Activity },
    { id: 'mylife', label: 'My Life', icon: User },
  ];

  const businessNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'mariluna', label: 'Mariluna', icon: Briefcase },
  ];

  // Combined for responsive mobile bottom bar
  const mobileNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'cycle', label: 'Cycle', icon: Activity },
    { id: 'mariluna', label: 'Mariluna', icon: Briefcase },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'mylife', label: 'Life', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E2D6] bg-[#FAF8F3]/90 backdrop-blur-md transition-colors">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & World Filter */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => onSelectTab('today')}
            id="brand-logo-btn"
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-[#D5CCBE] bg-[#F3EDE2] flex items-center justify-center shadow-xs group-hover:border-[#B5A48B] transition shrink-0">
              <span className="font-serif text-[11px] font-semibold text-[#7E694E] tracking-tighter">
                P&M
              </span>
            </div>
            <span className="font-serif text-base sm:text-lg tracking-[0.2em] uppercase font-medium text-[#2C2825] group-hover:text-[#7E694E] transition-colors select-none">
              ALCHEMY
            </span>
          </button>

          {/* World Switcher: Balanced vs Personal vs Mariluna */}
          <div className="hidden md:flex items-center rounded-full border border-[#E3DCD1] bg-[#F1ECE3] p-0.5 text-xs">
            <button
              onClick={() => onSelectWorld('all')}
              id="world-filter-all"
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'all'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              Balanced
            </button>
            <button
              onClick={() => onSelectWorld('personal')}
              id="world-filter-personal"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'personal'
                  ? 'bg-[#FFFFFF] text-[#4A433A] shadow-xs font-medium border border-[#E2DDD2]'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478]"></span>
              Personal Sanctuary
            </button>
            <button
              onClick={() => onSelectWorld('mariluna')}
              id="world-filter-mariluna"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeWorld === 'mariluna'
                  ? 'bg-[#2C2825] text-[#F9F7F2] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
              Mariluna Studio
            </button>
          </div>
        </div>

        {/* Desktop Primary Nav items */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Core modules */}
          {coreNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                id={`nav-tab-${item.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EDE7DC] text-[#1F1C19] shadow-xs font-semibold'
                    : 'text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="h-4 w-px bg-[#E3DCD1] mx-1"></div>

          {/* Personal Group (Cycle & My Life) */}
          <div className="flex items-center gap-0.5 rounded-lg bg-[#F3EDE2]/60 p-0.5 border border-[#E8E1D4]">
            {personalNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  id={`nav-tab-${item.id}`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-semibold'
                      : 'text-[#6C6358] hover:text-[#2C2825]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478]"></span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-[#E3DCD1] mx-1"></div>

          {/* Mariluna Business Group */}
          {businessNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                id={`nav-tab-${item.id}`}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2C2825] text-[#F9F7F2] shadow-xs font-medium'
                    : 'text-[#5A4E3F] hover:text-[#2C2825] bg-[#F1E8DC] hover:bg-[#EAE0D3]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Notifications, AI Assistant, PWA Install, Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton />

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            id="notification-center-btn"
            title="Notification Center & Quiet Hours"
            className="relative p-2 rounded-full border border-transparent text-[#7A7167] hover:text-[#2C2825] hover:bg-[#F0EAE0] transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C5A880] ring-2 ring-[#FAF8F3]"></span>
            )}
          </button>

          {/* Central AI Assistant Button */}
          <button
            onClick={onOpenAssistant}
            id="assistant-open-btn"
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
              isAssistantOpen
                ? 'bg-[#2C2825] text-[#F9F7F2] border-[#2C2825] shadow-sm ring-2 ring-[#C5A880]/40'
                : 'bg-[#F2ECE1] text-[#3D3730] border-[#DDD5C7] hover:border-[#BFAF98] hover:bg-[#EAE3D6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
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
                ? 'bg-[#EDE7DC] text-[#2C2825]'
                : 'text-[#7A7167] hover:text-[#2C2825] hover:bg-[#F0EAE0]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#FAF8F3] ${
                securityLevel === 3
                  ? 'bg-[#3A6B35] animate-pulse'
                  : isSensitiveUnlocked
                  ? 'bg-[#C5A880]'
                  : 'bg-[#7E694E]'
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
                ? 'bg-[#EDE7DC] text-[#2C2825]'
                : 'text-[#7A7167] hover:text-[#2C2825] hover:bg-[#F0EAE0]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar on mobile for World Switcher */}
      <div className="md:hidden px-4 py-2 border-t border-[#EDE7DB] flex items-center justify-between bg-[#F8F5EE]">
        <div className="flex items-center gap-1 w-full justify-center">
          <button
            onClick={() => onSelectWorld('all')}
            className={`px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'all'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                : 'text-[#7A7167]'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => onSelectWorld('personal')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'personal'
                ? 'bg-[#FFFFFF] text-[#3B342C] shadow-xs font-medium border border-[#DDD5C7]'
                : 'text-[#7A7167]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478]"></span>
            Personal
          </button>
          <button
            onClick={() => onSelectWorld('mariluna')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition ${
              activeWorld === 'mariluna'
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium'
                : 'text-[#7A7167]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
            Mariluna
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-[#E8E2D6] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                isActive ? 'text-[#2C2825] font-semibold' : 'text-[#8C8377] hover:text-[#2C2825]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#8C7654]' : 'text-[#8C8377]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
