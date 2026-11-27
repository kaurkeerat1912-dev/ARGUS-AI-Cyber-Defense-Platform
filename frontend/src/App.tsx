import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Overview } from './pages/Overview';
import { Investigate } from './pages/Investigate';
import { InvestigationDetail } from './pages/InvestigationDetail';
import { ThreatGraph } from './pages/ThreatGraph';
import { DefensiveSimulation } from './pages/DefensiveSimulation';
import { MlEvaluation } from './pages/MlEvaluation';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { WhatsAppFloatingWidget } from './components/modals/WhatsAppFloatingWidget';
import { WhatsAppWebSimulatorModal } from './components/modals/WhatsAppWebSimulatorModal';

export function App() {
  // Support deep-linking from WhatsApp Web Chrome extension: e.g. http://localhost:5173/?tab=details&id=...
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'overview';
  });
  const [showWhatsAppSimulator, setShowWhatsAppSimulator] = useState<boolean>(false);
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    if (urlId) {
      sessionStorage.setItem('argus_active_investigation_id', urlId);
      return urlId;
    }
    return sessionStorage.getItem('argus_active_investigation_id');
  });

  const handleSetActiveInvestigationId = (id: string | null) => {
    setActiveInvestigationId(id);
    if (id) {
      sessionStorage.setItem('argus_active_investigation_id', id);
    } else {
      sessionStorage.removeItem('argus_active_investigation_id');
    }
  };

  const handleSelectInvestigation = (id: string) => {
    handleSetActiveInvestigationId(id);
    setActiveTab('details');
  };

  const handleNavigateToGraph = (id: string) => {
    handleSetActiveInvestigationId(id);
    setActiveTab('graph');
  };

  const handleNavigateToDefense = (id: string) => {
    handleSetActiveInvestigationId(id);
    setActiveTab('defense');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <Navbar
        onNewScan={() => setActiveTab('investigate')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeInvestigationId={activeInvestigationId}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-[#f8fafc]">
          {activeTab === 'overview' && (
            <Overview
              onSelectInvestigation={handleSelectInvestigation}
              onNavigateToInvestigate={() => setActiveTab('investigate')}
              onNavigateToDefense={handleNavigateToDefense}
              onNavigateToGraph={handleNavigateToGraph}
            />
          )}

          {activeTab === 'investigate' && (
            <Investigate
              onInvestigationComplete={(id) => {
                handleSetActiveInvestigationId(id);
              }}
              onNavigateToGraph={handleNavigateToGraph}
              onNavigateToDetails={handleSelectInvestigation}
              onNavigateToDefense={handleNavigateToDefense}
            />
          )}

          {activeTab === 'details' && (
            <InvestigationDetail
              investigationId={activeInvestigationId}
              onNavigateToGraph={handleNavigateToGraph}
              onNavigateToInvestigate={() => setActiveTab('investigate')}
              onNavigateToDefense={handleNavigateToDefense}
            />
          )}

          {activeTab === 'graph' && (
            <ThreatGraph
              investigationId={activeInvestigationId}
              onNavigateToInvestigate={() => setActiveTab('investigate')}
              onNavigateToDefense={handleNavigateToDefense}
              onSelectInvestigation={handleSetActiveInvestigationId}
            />
          )}

          {activeTab === 'defense' && (
            <DefensiveSimulation
              activeInvestigationId={activeInvestigationId}
              onSelectInvestigation={handleSetActiveInvestigationId}
              onNavigateToGraph={handleNavigateToGraph}
              onNavigateToDetails={handleSelectInvestigation}
              onNavigateToInvestigate={() => setActiveTab('investigate')}
            />
          )}

          {activeTab === 'ml-eval' && <MlEvaluation />}

          {activeTab === 'reports' && (
            <Reports onSelectInvestigation={handleSelectInvestigation} />
          )}

          {activeTab === 'settings' && (
            <Settings onSelectInvestigation={handleSelectInvestigation} />
          )}
        </main>
      </div>

      {/* Floating Draggable Pop Up for WhatsApp Web & PC App Drag-and-Drop */}
      <WhatsAppFloatingWidget
        onOpenDetails={(id) => {
          handleSelectInvestigation(id);
        }}
        onOpenWhatsAppSimulator={() => setShowWhatsAppSimulator(true)}
      />

      {/* WhatsApp Web / Desktop Interactive Simulator Modal */}
      <WhatsAppWebSimulatorModal
        isOpen={showWhatsAppSimulator}
        onClose={() => setShowWhatsAppSimulator(false)}
        onDropSampleFile={(file) => {
          // File dropped
        }}
        onTriggerFloatingWidget={() => {
          // Triggers evaluation in floating widget
        }}
      />
    </div>
  );
}

export default App;
