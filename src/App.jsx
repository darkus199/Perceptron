import React, { useState, useEffect, useRef } from 'react';
import { Play, StepForward, RotateCcw, Brain, Activity, ChevronLeft, ChevronRight, Hash, TrendingDown, Target } from 'lucide-react';

const trainingData = [
  { x1: 0, x2: 0, y: 0 }, { x1: 0, x2: 1, y: 0 }, { x1: 1, x2: 0, y: 0 }, { x1: 1, x2: 1, y: 1 },
];

export default function App() {
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0);
  const [b, setB] = useState(0);
  const [index, setIndex] = useState(0);
  const [isAutoTraining, setIsAutoTraining] = useState(false);
  const [epochCount, setEpochCount] = useState(0);
  const [currentEpochErrors, setCurrentEpochErrors] = useState(0);
  const [lastEpochLoss, setLastEpochLoss] = useState(null);
  const [undoStack, setUndoStack] = useState([]); // Pre krok späť

  const timerRef = useRef(null);
  const eta = 1;

  const currentZ = (trainingData[index].x1 * w1 + trainingData[index].x2 * w2 + b);
  const yHat = currentZ >= 0 ? 1 : 0;
  const e = trainingData[index].y - yHat;

  const trenujKrok = () => {
    // 1. Uloženie stavu do undoStack
    setUndoStack(prev => [...prev, { w1, w2, b, index, epochCount, lastEpochLoss, currentEpochErrors }]);

    // 2. Logika tréningu
    let newSumSquaredErrors = currentEpochErrors + (e * e);
    if (e !== 0) {
      setW1(prev => prev + eta * e * trainingData[index].x1);
      setW2(prev => prev + eta * e * trainingData[index].x2);
      setB(prev => prev + eta * e * 1);
    }
    if (index === 3) {
      setEpochCount(prev => prev + 1);
      setLastEpochLoss(newSumSquaredErrors / 4);
      setCurrentEpochErrors(0);
      if (newSumSquaredErrors === 0 && isAutoTraining) setIsAutoTraining(false);
    } else {
      setCurrentEpochErrors(newSumSquaredErrors);
    }
    setIndex((prev) => (prev + 1) % 4);
  };

  const krokSpat = () => {
    if (undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      setW1(prev.w1); setW2(prev.w2); setB(prev.b); setIndex(prev.index);
      setEpochCount(prev.epochCount); setLastEpochLoss(prev.lastEpochLoss);
      setCurrentEpochErrors(prev.currentEpochErrors);
      setUndoStack(prevStack => prevStack.slice(0, -1));
    }
  };

  const reset = () => { setW1(0); setW2(0); setB(0); setIndex(0); setEpochCount(0); setLastEpochLoss(null); setUndoStack([]); setIsAutoTraining(false); };

  useEffect(() => {
    if (isAutoTraining) timerRef.current = setInterval(trenujKrok, 400);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isAutoTraining, index, w1, w2, b]);

  // Pomocná funkcia pre vykreslenie tých špeciálnych boxov
  const StatCard = ({ icon: Icon, title, value, iconBg }) => (
    <div className="flex-1 min-w-[160px] bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-3 ${iconBg} rounded-xl text-blue-600`}>
        <Icon size={20} className={iconBg === 'bg-blue-50' ? 'text-blue-600' : 'text-rose-600'}/>
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400">{title}</p>
        <p className="text-xl font-extrabold text-slate-700">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER S OPRAVENÝM DIZAJNOM BOXOV */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs">
              <Activity size={14} /> Neural Learning System
            </div>
            <h1 className="text-4xl font-black text-slate-900">Perceptron Lab</h1>
          </div>

          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            {/* Presný dizajn boxov podľa predlohy */}
            <StatCard icon={Hash} title="Epocha" value={epochCount} iconBg="bg-blue-50" />
            <StatCard icon={TrendingDown} title="Loss (Epocha)" value={lastEpochLoss !== null ? lastEpochLoss.toFixed(2) : '--'} iconBg="bg-rose-50" />
            {/* Nový box pre Cieľovú hodnotu */}
            <StatCard icon={Target} title="Cieľ Y" value={trainingData[index].y} iconBg="bg-blue-50" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vizualizácia neurónu s opravenými vstupmi x1/x2 */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <svg width="100%" height="400" viewBox="0 0 600 400">
              <line x1="100" y1="100" x2="300" y2="200" stroke="#f1f5f9" strokeWidth={Math.abs(w1)*8 + 2} />
              <line x1="100" y1="300" x2="300" y2="200" stroke="#f1f5f9" strokeWidth={Math.abs(w2)*8 + 2} />
              <text x="180" y="130" className="fill-blue-600 font-mono text-xs font-bold">w1: {w1.toFixed(2)}</text>
              <text x="180" y="280" className="fill-blue-600 font-mono text-xs font-bold">w2: {w2.toFixed(2)}</text>
              
              {/* Opravené vstupy x1 a x2 vo vnútri guličiek */}
              <circle cx="100" cy="100" r="30" fill={trainingData[index].x1 ? '#3b82f6' : '#e2e8f0'} />
              <text x="88" y="105" fill={trainingData[index].x1 ? 'white' : '#94a3b8'} className="font-bold">x1</text>
              
              <circle cx="100" cy="300" r="30" fill={trainingData[index].x2 ? '#3b82f6' : '#e2e8f0'} />
              <text x="88" y="305" fill={trainingData[index].x2 ? 'white' : '#94a3b8'} className="font-bold">x2</text>
              
              <circle cx="300" cy="200" r="60" fill="#1e293b" />
              <text x="285" y="212" fill="white" className="text-3xl font-black">Σ</text>
              <text x="275" y="285" className="fill-slate-400 font-mono text-xs font-bold uppercase tracking-widest">Bias: {b.toFixed(2)}</text>

              <line x1="360" y1="200" x2="500" y2="200" stroke={yHat ? "#10b981" : "#e2e8f0"} strokeWidth="6" />
              <circle cx="500" cy="200" r="35" fill={yHat ? '#10b981' : '#f1f5f9'} />
              <text x="492" y="206" fill={yHat ? 'white' : '#94a3b8'} className="font-black text-lg">ŷ</text>
            </svg>
            <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-xs">
              z = ({trainingData[index].x1}×w1) + ({trainingData[index].x2}×w2) + b = {currentZ.toFixed(2)} | Výstup (ŷ): {yHat}
            </div>
          </div>

          {/* OVLÁDANIE */}
          <div className="space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-2">
                  <button onClick={krokSpat} className="flex-1 flex items-center justify-center gap-1.5 py-4 bg-slate-100 rounded-2xl text-slate-700 font-extrabold hover:bg-slate-200">
                    <ChevronLeft size={18}/> Späť
                  </button>
                  <button onClick={trenujKrok} className="flex-1 flex items-center justify-center gap-1.5 py-4 bg-slate-900 text-white rounded-2xl font-extrabold hover:bg-black">
                    <StepForward size={18}/> Krok
                  </button>
                </div>

                <button onClick={() => setIsAutoTraining(!isAutoTraining)} className={`w-full py-4 rounded-2xl font-black ${isAutoTraining ? 'bg-amber-500' : 'bg-blue-600'} text-white shadow-lg`}>
                  {isAutoTraining ? "Stop" : "Auto-trénuj"}
                </button>

                {/* VÝRAZNÉ RESET TLAČIDLO */}
                <button 
                  onClick={reset} 
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-200 text-slate-500 rounded-2xl font-bold hover:border-rose-300 hover:text-rose-500 transition-all"
                >
                  <RotateCcw size={16}/> Resetovať všetko
                </button>
             </div>
        </div>
      </div>
    </div>
  );
}