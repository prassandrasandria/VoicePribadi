import { Menu, Plus, Mic2, Video, FolderKanban, Settings } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onNewAudio: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onNewAudio,
}) => {
  const getTabInfo = () => {
    switch (currentTab) {
      case 'video_to_text':
        return {
          title: 'Video ke Teks',
          subtitle: 'Ekstraksi AI',
          icon: <Video className="w-4 h-4 text-emerald-400" />,
          iconBg: 'bg-emerald-600/20',
        };
      case 'library':
        return {
          title: 'Koleksi Audio',
          subtitle: 'Penyimpanan WAV',
          icon: <FolderKanban className="w-4 h-4 text-indigo-400" />,
          iconBg: 'bg-indigo-600/20',
        };
      case 'settings':
        return {
          title: 'Pengaturan',
          subtitle: 'Status Sistem',
          icon: <Settings className="w-4 h-4 text-slate-400" />,
          iconBg: 'bg-slate-700/30',
        };
      case 'voice':
      default:
        return {
          title: 'Voice Over',
          subtitle: 'Studio Vokal',
          icon: <Mic2 className="w-4 h-4 text-cyan-400" />,
          iconBg: 'bg-indigo-600/20',
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <header className="sticky top-0 z-30 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
      {/* Left: Mobile Menu + Dynamic Tab Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-lg ${tabInfo.iconBg} flex items-center justify-center shrink-0`}>
            {tabInfo.icon}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {tabInfo.title}
          </h1>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 shrink-0">
            {tabInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Right: Clean minimal New Audio button */}
      <button
        type="button"
        onClick={onNewAudio}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs shadow-sm transition cursor-pointer shrink-0"
        title="Mulai Naskah Baru"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Naskah Baru</span>
      </button>
    </header>
  );
};

