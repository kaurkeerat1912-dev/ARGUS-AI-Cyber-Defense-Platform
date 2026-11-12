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

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(() => {
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
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

        <main className="flex-1 p-6 overflow-y-auto bg-[#0b0f19]">
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
    </div>
  );
}

export default App;
