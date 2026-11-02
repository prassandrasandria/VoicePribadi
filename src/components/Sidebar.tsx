import React from 'react';
import {
  Mic2,
  FolderKanban,
  Settings,
  X,
  Volume2,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { SystemConfig } from '../types';

export type NavTab = 'voice' | 'video_to_text' | 'library' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  config: SystemConfig | null;
  totalAudios: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  config,
  totalAudios,
}) => {
  const navItems = [
    {
      id: 'voice' as NavTab,
      label: 'Studio Voice Over',
      icon: Mic2,
      badge: 'id-ID',
      desc: '15 Vokal Penutur Asli (WAV 24kHz)',
    },
    {
      id: 'video_to_text' as NavTab,
      label: 'Video ke Teks',
      icon: Video,
      badge: 'Ekstrak AI',
      desc: 'Ekstrak Video, YouTube & Link',
    },
    {
      id: 'library' as NavTab,
      label: 'Koleksi Audio',
      icon: FolderKanban,
      badge: totalAudios > 0 ? String(totalAudios) : null,
      desc: 'Riwayat & File Tersimpan',
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan',
      icon: Settings,
      badge: null,
      desc: 'Status Gemini & API Audio',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel - Sticky on Desktop */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 w-72 shrink-0 bg-[#090d16] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b101c] rounded-[10px] flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                  Driacom
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  VOICE
                </span>
              </div>
              <p className="text-xs text-slate-400">Studio Audio Pribadi (id-ID)</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Studio
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left flex items-start gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/40 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-indigo-500 to-cyan-400 rounded-r-full" />
                )}

                <div
                  className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600/30 text-cyan-300'
                      : 'text-slate-400 group-hover:text-indigo-300 group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-white font-semibold' : 'text-slate-200'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Private Mode Badge at the bottom */}
        <div className="p-4 border-t border-slate-800/70">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Mode Privat Aktif
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                Noindex & Blokir Crawler
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
