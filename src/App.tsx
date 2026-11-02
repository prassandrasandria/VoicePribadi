import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { VoiceOverView } from './components/VoiceOverView';
import { VideoToTextView } from './components/VideoToTextView';
import { AudioLibraryView } from './components/AudioLibraryView';
import { SettingsView } from './components/SettingsView';
import {
  Project,
  SystemConfig,
  StandaloneAudio,
} from './types';
import { api, DEFAULT_CONFIG } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('voice');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem('driacom_cached_projects');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [voiceStudioText, setVoiceStudioText] = useState<string>('');

  // Lock to dark mode permanently
  useEffect(() => {
    localStorage.removeItem('driacom_theme');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial projects & system config from server with retry and graceful fallback
  useEffect(() => {
    let isMounted = true;

    const loadDataWithRetry = async (retries = 3, delay = 800) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const [sysConfig, projectList] = await Promise.all([
            api.getConfig(),
            api.getProjects(),
          ]);

          if (!isMounted) return;

          if (sysConfig) {
            setConfig(sysConfig);
          }
          if (Array.isArray(projectList) && projectList.length > 0) {
            setProjects(projectList);
            setActiveProject(projectList[0]);
          }
          return;
        } catch (err) {
          console.warn(`Init data attempt ${attempt} delayed:`, err);
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
          }
        }
      }
    };

    loadDataWithRetry();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewAudio = () => {
    setVoiceStudioText('');
    setCurrentTab('voice');
    addToast('info', 'Voice Over Baru', 'Studio siap untuk mengetikkan naskah baru.');
  };

  const handleSaveStandaloneAudio = async (audio: StandaloneAudio) => {
    try {
      let targetProj = projects.find((p) => p.engineType === 'voice_over') || projects[0];
      if (!targetProj) {
        targetProj = await api.createProject({
          title: 'Koleksi Audio Voice Over Pribadi',
          description: 'Penyimpanan rekaman suara WAV id-ID',
          topic: audio.text.slice(0, 40),
          engineType: 'voice_over',
          contentType: 'audio',
          standaloneAudios: [audio],
        });
        setProjects([targetProj]);
        setActiveProject(targetProj);
      } else {
        const existing = targetProj.standaloneAudios || [];
        const updated = await api.updateProject(targetProj.id, {
          standaloneAudios: [audio, ...existing],
        });
        setActiveProject(updated);
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      addToast('success', 'Tersimpan', 'Audio WAV berhasil disimpan ke Koleksi Audio Anda.');
    } catch (err: any) {
      addToast('error', 'Gagal Simpan', err.message);
    }
  };

  const handleDeleteAudio = async (projectId: string, audioId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const updatedAudios = (proj.standaloneAudios || []).filter((a) => a.id !== audioId);
    const updated = await api.updateProject(projectId, {
      standaloneAudios: updatedAudios,
    });
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (activeProject && activeProject.id === projectId) {
      setActiveProject(updated);
    }
  };

  const totalAudios = projects.reduce(
    (acc, p) => acc + (p.standaloneAudios?.length || 0),
    0
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        config={config}
        totalAudios={totalAudios}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onNewAudio={handleNewAudio}
          hasApiKey={Boolean(config?.hasGeminiKey)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'voice' && (
            <VoiceOverView
              onNotify={addToast}
              onSaveToProject={handleSaveStandaloneAudio}
              initialText={voiceStudioText}
              activeProject={activeProject}
            />
          )}

          {currentTab === 'video_to_text' && (
            <VideoToTextView
              onNotify={addToast}
              onSendToVoiceOver={(extractedScript) => {
                setVoiceStudioText(extractedScript);
                setCurrentTab('voice');
              }}
              onSaveToProject={handleSaveStandaloneAudio}
            />
          )}

          {currentTab === 'library' && (
            <AudioLibraryView
              projects={projects}
              onDeleteAudio={handleDeleteAudio}
              onNotify={addToast}
              onNavigateToStudio={(textToLoad) => {
                if (textToLoad) setVoiceStudioText(textToLoad);
                setCurrentTab('voice');
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView config={config} />
          )}
        </main>
      </div>
    </div>
  );
}
