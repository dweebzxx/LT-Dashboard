import { useEffect, useState, useRef } from 'react';
import { Upload, Download, BarChart3, Users, Heart, Award, TrendingUp, Sparkles, Grid, Database, FileText } from 'lucide-react';
import { useSurveyStore } from './store/surveyStore';
import { loadDefaultCSV, loadCSVData } from './utils/dataLoader';
import { exportToPDF } from './utils/pdfExport';
import { FilterPanel } from './components/FilterPanel';
import { DemographicsSection } from './components/sections/DemographicsSection';
import { NostalgiaSection } from './components/sections/NostalgiaSection';
import { BrandPerceptionSentimentSection } from './components/sections/BrandPerceptionSentimentSection';
import { RankingAnalysisSection } from './components/sections/RankingAnalysisSection';
import { ModernTraditionalSection } from './components/sections/ModernTraditionalSection';
import { AttributeImportanceSection } from './components/sections/AttributeImportanceSection';
import { CompetitiveAnalysisSection } from './components/sections/CompetitiveAnalysisSection';
import { FutureDirectionSection } from './components/sections/FutureDirectionSection';
import { NPSSection } from './components/sections/NPSSection';
import { CrossTabAnalysisSection } from './components/sections/CrossTabAnalysisSection';
import { UTHTab } from './components/sections/UTHTab';

type TabType = 'overview' | 'demographics' | 'nostalgia' | 'brand' | 'competitive' |
'future' | 'crosstab' | 'uth';

function App() {
  const { data, filteredData, setData } = useSurveyStore();
const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [exportingPDF, setExportingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
useEffect(() => {
    loadDefaultCSV()
      .then((csvData) => {
        setData(csvData);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load survey data');
        setLoading(false);
        console.error(err);
      });
  }, [setData]);
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
try {
      const csvData = await loadCSVData(file);
      setData(csvData);
      setLoading(false);
} catch (err) {
      setError('Failed to parse CSV file');
      setLoading(false);
      console.error(err);
    }
  };
const handleExportCSV = () => {
    const headers = Object.keys(filteredData[0] || {});
const rows = filteredData.map(row => headers.map(h => row[h as keyof typeof row]).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
a.download = `little_tikes_filtered_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || exportingPDF) return;

    setExportingPDF(true);
    try {
      const tabLabel = tabs.find(t => t.id === activeTab)?.label || 'Dashboard';
      await exportToPDF(contentRef.current, {
        tabName: tabLabel,
        n: filteredData.length,
        total: data.length,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const completionRate = data.length > 0 ? '100.0' : '0';
if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4 absolute top-0 left-1/2 -translate-x-1/2" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
      
    </div>
          <p className="text-gray-800 font-semibold text-lg mt-8">Loading Little Tikes Survey Data...</p>
        </div>
      </div>
    );
}

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border-4 border-red-500">
          <p className="text-red-600 font-bold text-xl mb-6">{error}</p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl cursor-pointer hover:from-red-600 hover:to-blue-700 font-semibold transition-all transform hover:scale-105 shadow-lg">
            <Upload size={24} />
    
        Upload CSV File
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    );
}

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'demographics' as TabType, label: 'Demographics', icon: Users },
    { id: 'nostalgia' as TabType, label: 'Nostalgia & Memory', icon: Heart },
    { id: 'brand' as TabType, label: 'Brand Perception', icon: Award },
    { id: 'competitive' as TabType, label: 'Competitive Analysis', icon: TrendingUp },
    { id: 'future' as TabType, label: 'Future Directions', icon: Sparkles },
    { id: 'crosstab' as TabType, label: 'Cross-Tabulation', icon: Grid },
    { id: 'uth' as TabType, label: 'UTH', icon: Database },
  ];
const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <NPSSection />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DemographicsSection />
              <NostalgiaSection />
   
         </div>
          </div>
        );
case 'demographics':
        return <DemographicsSection />;
case 'nostalgia':
        return (
          <div className="space-y-8">
            <NostalgiaSection />
            <ModernTraditionalSection />
          </div>
        );
case 'brand':
        return (
          <div className="space-y-8">
            <BrandPerceptionSentimentSection />
            <RankingAnalysisSection />
            <AttributeImportanceSection />
          </div>
        );
case 'competitive':
        return <CompetitiveAnalysisSection />;
case 'future':
        return <FutureDirectionSection />;
case 'crosstab':
        return <CrossTabAnalysisSection />;
case 'uth':
        return <UTHTab />;
default:
        return null;
    }
  };
return (
    <div className="min-h-screen">
      <div className="bg-gray-100 transition-colors min-h-screen">
        <header className="sticky top-0 z-50 bg-red-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 
className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                  Little Tikes Survey Analytics Dashboard
                </h1>
                <div className="flex gap-4 mt-2 text-sm text-white/90">
                  <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">N = {filteredData.length} / {data.length}</span>
          
        <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Completion: {completionRate}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer p-2 hover:bg-white/20 rounded-lg transition-colors">

<Upload size={20} className="text-white" />
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredData.length === 0}

              className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 transition-colors"
                  title="Export CSV"
                >
                  <Download size={20} className="text-white" />
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={filteredData.length === 0 || exportingPDF}
                  className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 transition-colors relative"
                  title="Export PDF"
                >
                  {exportingPDF ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <FileText size={20} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-[88px] z-40 bg-white shadow-md border-b-4 border-red-500">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex w-full justify-between">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isUth = tab.id === 'uth';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 py-4 font-semibold whitespace-nowrap transition-all border-b-4 ${
                      isUth ? 'px-1 w-12 flex-none' : 'px-2 text-xs md:text-sm flex-1'
                    } ${
                      isActive
                        ? 'bg-red-50 text-red-700 border-red-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-transparent'
                    }`}
                    title={isUth ? tab.label : ''}
                  >
                    <Icon size={isUth ? 20 : 20} />
                    {!isUth && <span>{tab.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <FilterPanel />
          <div ref={contentRef} className="mt-6">
            {renderTabContent()}
          </div>
        </main>

      
  <footer className="bg-white mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
            <p>Little Tikes Brand Survey Analytics Dashboard - {new Date().getFullYear()}</p>
            <p className="mt-1">Professional market research insights for strategic decision-making</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;