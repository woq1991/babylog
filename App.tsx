import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Baby, 
  BarChart3, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Milk,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Share2
} from 'lucide-react';
import { FeedingRecord, FeedingType } from './types';
import { PRESET_AMOUNTS, COLORS, APP_TITLE } from './constants';
import { RecordButton } from './components/RecordButton';
import { FeedingChart } from './components/FeedingChart';
import { getStoredRecords, saveRecord, deleteRecord } from './services/storageService';
import { analyzeFeedingData } from './services/geminiService';

// Main App Component
const App: React.FC = () => {
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'record' | 'analysis'>('record');
  // Initialize with today in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load records on mount
  useEffect(() => {
    setRecords(getStoredRecords());
  }, []);

  // Handlers
  const handleRecord = (amount: number, type: FeedingType) => {
    // Check if selected date is today
    const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    let timestamp = Date.now();
    if (selectedDate !== todayStr) {
       if(!window.confirm(`您正在查看历史日期 (${selectedDate})，记录将添加至今天 (${todayStr})。是否继续？`)) {
         return;
       }
       setSelectedDate(todayStr);
    }

    const newRecord: FeedingRecord = {
      id: crypto.randomUUID(),
      type,
      amount,
      timestamp: timestamp
    };
    const updated = saveRecord(newRecord);
    setRecords(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除这条记录吗？")) {
      const updated = deleteRecord(id);
      setRecords(updated);
    }
  };

  const handleExport = () => {
    const dailyRecords = filteredRecords;
    if (dailyRecords.length === 0) return alert("当前日期无数据可导出");

    const csvContent = "data:text/csv;charset=utf-8," 
      + "日期,时间,类型,奶量(ml)\n"
      + dailyRecords.map(r => {
        const d = new Date(r.timestamp);
        const dateStr = d.toLocaleDateString('zh-CN');
        const timeStr = d.toLocaleTimeString('zh-CN');
        const type = r.type === 'breast_milk' ? '母乳' : '配方奶';
        return `${dateStr},${timeStr},${type},${r.amount}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `baby_feeding_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSmartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await analyzeFeedingData(selectedDate, filteredRecords);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Filter records for selected date
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const rDate = new Date(r.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      return rDate === selectedDate;
    }).sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [records, selectedDate]);

  // Summaries
  const totalBreast = filteredRecords.filter(r => r.type === 'breast_milk').reduce((acc, curr) => acc + curr.amount, 0);
  const totalFormula = filteredRecords.filter(r => r.type === 'formula').reduce((acc, curr) => acc + curr.amount, 0);

  // Date Navigation
  const changeDate = (days: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'));
    setAnalysisResult(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setAnalysisResult(null);
  }

  // Helper for timeline time
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit', hour12: false});
  };

  // --- Views ---

  const renderRecordView = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Date Header */}
      <div className="sticky top-[4.5rem] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-center relative group cursor-pointer">
             {/* Invisible Date Input for Mobile Picker */}
             <input 
               ref={dateInputRef}
               type="date" 
               value={selectedDate}
               onChange={handleDateChange}
               className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
             />
             <div className="flex items-center justify-center gap-2 mb-1">
                <CalendarIcon size={16} className="text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  {selectedDate === new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') ? '今天' : selectedDate}
                </h2>
             </div>
             <p className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
               总摄入: <span className="text-slate-900 font-bold">{totalBreast + totalFormula}</span> mL
             </p>
          </div>

          <button 
            onClick={() => changeDate(1)} 
            className={`p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors ${selectedDate === new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') ? 'opacity-30 cursor-default' : ''}`}
            disabled={selectedDate === new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Input Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Breast Milk Section */}
        <div className="bg-gradient-to-r from-pink-50 to-white p-4 rounded-3xl border border-pink-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-pink-600 px-1">
            <Droplets size={20} fill="currentColor" className="opacity-20" />
            <h3 className="font-bold text-lg">母乳记录</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AMOUNTS.map(amount => (
              <RecordButton 
                key={`bm-${amount}`} 
                amount={amount} 
                type="breast_milk" 
                onClick={handleRecord} 
              />
            ))}
          </div>
        </div>

        {/* Formula Section */}
        <div className="bg-gradient-to-r from-sky-50 to-white p-4 rounded-3xl border border-sky-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-sky-600 px-1">
            <Milk size={20} fill="currentColor" className="opacity-20" />
            <h3 className="font-bold text-lg">配方奶记录</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AMOUNTS.map(amount => (
              <RecordButton 
                key={`fm-${amount}`} 
                amount={amount} 
                type="formula" 
                onClick={handleRecord} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="pt-6">
         <div className="flex items-center gap-2 mb-6 px-2">
            <div className="bg-slate-800 text-white p-1.5 rounded-lg">
               <Clock size={16} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">今日时间轴</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md ml-auto">
               {filteredRecords.length} 次记录
            </span>
         </div>

         <div className="relative pl-4">
            {/* Vertical Line */}
            <div className="absolute left-[29px] top-4 bottom-0 w-[2px] bg-slate-100 z-0"></div>

            {filteredRecords.length === 0 ? (
               <div className="py-12 text-center relative z-10">
                  <div className="inline-block p-4 bg-slate-50 rounded-full mb-3">
                     <Baby size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">还没有记录哦，快点击上方按钮记录吧</p>
               </div>
            ) : (
               <div className="space-y-6">
                  {filteredRecords.map((record, idx) => {
                     const isBreast = record.type === 'breast_milk';
                     const colorClass = isBreast ? 'pink' : 'sky';
                     // Dynamic Tailwind classes usually need full strings safe-listed, 
                     // but since we imported COLORS constant we can reuse or just use conditional standard classes for safety.
                     
                     return (
                        <div key={record.id} className="relative z-10 grid grid-cols-[60px_1fr] gap-4 group">
                           {/* Time Node */}
                           <div className="flex flex-col items-center pt-2">
                              <span className="text-lg font-bold text-slate-600 font-mono leading-none">
                                 {formatTime(record.timestamp)}
                              </span>
                              <div className={`w-4 h-4 rounded-full mt-3 border-[3px] bg-white transition-colors duration-300 ${isBreast ? 'border-pink-400 group-hover:bg-pink-100' : 'border-sky-400 group-hover:bg-sky-100'}`} />
                           </div>

                           {/* Content Card */}
                           <div className={`
                              relative p-4 rounded-2xl border transition-all duration-200
                              ${isBreast 
                                 ? 'bg-pink-50/50 border-pink-100 hover:border-pink-200 hover:shadow-md hover:shadow-pink-100/50' 
                                 : 'bg-sky-50/50 border-sky-100 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/50'
                              }
                           `}>
                              <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${isBreast ? 'bg-pink-100 text-pink-600' : 'bg-sky-100 text-sky-600'}`}>
                                       {isBreast ? <Droplets size={24} /> : <Milk size={24} />}
                                    </div>
                                    <div>
                                       <div className={`text-3xl font-bold tracking-tight ${isBreast ? 'text-pink-900' : 'text-sky-900'}`}>
                                          {record.amount}<span className="text-base font-medium ml-1 opacity-60">mL</span>
                                       </div>
                                       <div className={`text-xs font-semibold uppercase tracking-wide opacity-50 mt-1 ${isBreast ? 'text-pink-800' : 'text-sky-800'}`}>
                                          {isBreast ? '母乳' : '配方奶'}
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => handleDelete(record.id)}
                                    className="p-2 -mr-2 -mt-2 text-slate-300 hover:text-red-500 hover:bg-white/60 rounded-xl transition-colors"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </div>
    </div>
  );

  const renderAnalysisView = () => (
    <div className="space-y-6 animate-fade-in pb-20">
       {/* Header Card */}
       <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <BarChart3 size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
               <CalendarIcon size={16} />
               <span className="text-sm font-medium">{selectedDate} 概览</span>
            </div>
            <div className="text-4xl font-bold mb-1">
               {totalBreast + totalFormula} <span className="text-lg font-normal opacity-60">mL</span>
            </div>
            <p className="text-slate-300 text-sm">今日总摄入量</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
               <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <div className="text-xs text-pink-200 mb-1">母乳</div>
                  <div className="font-bold text-xl">{totalBreast} <span className="text-xs font-normal opacity-60">mL</span></div>
               </div>
               <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <div className="text-xs text-sky-200 mb-1">配方奶</div>
                  <div className="font-bold text-xl">{totalFormula} <span className="text-xs font-normal opacity-60">mL</span></div>
               </div>
            </div>
          </div>
       </div>

       {/* Prominent Tools Section */}
       <div className="grid grid-cols-2 gap-4">
          <button 
             onClick={handleExport}
             disabled={filteredRecords.length === 0}
             className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <div className="p-3 bg-green-50 text-green-600 rounded-full mb-1">
               <Download size={24} />
             </div>
             <span className="font-bold text-slate-700">导出数据</span>
             <span className="text-xs text-slate-400">CSV 格式</span>
          </button>

          <button 
             onClick={handleSmartAnalysis}
             disabled={isAnalyzing || filteredRecords.length === 0}
             className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-1">
               {isAnalyzing ? <span className="animate-spin">✨</span> : <Sparkles size={24} />}
             </div>
             <span className="font-bold text-slate-700">智能分析</span>
             <span className="text-xs text-slate-400">AI 健康建议</span>
          </button>
       </div>

       {/* AI Result Area */}
       {analysisResult && (
         <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-indigo-700">
               <Sparkles size={20} />
               <h3 className="font-bold">AI 分析报告</h3>
            </div>
            <div className="prose prose-sm prose-indigo text-slate-700 leading-relaxed whitespace-pre-line">
               {analysisResult}
            </div>
         </div>
       )}

       <FeedingChart records={filteredRecords} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-2 rounded-xl shadow-lg shadow-slate-200">
              <Baby size={22} />
            </div>
            <div>
               <h1 className="font-bold text-lg leading-tight text-slate-900">{APP_TITLE}</h1>
               <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Smart Feeding Log</p>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('record')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'record' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               记录 & 概览
             </button>
             <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               统计 & 导出
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 min-h-[calc(100vh-80px)]">
        {activeTab === 'record' && renderRecordView()}
        {activeTab === 'analysis' && renderAnalysisView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe-area shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-50">
        <div className="grid grid-cols-2 h-[3.5rem] relative">
          <button 
            onClick={() => setActiveTab('record')}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${activeTab === 'record' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === 'record' && (
               <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-900 rounded-b-full shadow-sm shadow-slate-200"></span>
            )}
            <Plus size={24} strokeWidth={activeTab === 'record' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">记录</span>
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${activeTab === 'analysis' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
             {activeTab === 'analysis' && (
               <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-900 rounded-b-full shadow-sm shadow-slate-200"></span>
            )}
            <BarChart3 size={24} strokeWidth={activeTab === 'analysis' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">分析</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
