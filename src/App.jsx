import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, StepForward, RotateCcw, Brain, Settings2, History, Activity, TrendingDown, Hash } from 'lucide-react';

const trainingData = [
  { x1: 0, x2: 0, y: 0 },
  { x1: 0, x2: 1, y: 0 },
  { x1: 1, x2: 0, y: 0 },
  { x1: 1, x2: 1, y: 1 },
];

export default function App() {
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0);
  const [b, setB] = useState(0);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [isAutoTraining, setIsAutoTraining] = useState(false);
  
  // Nové stavy pre Epochy a Loss
  const [epochCount, setEpochCount] = useState(0);
  const [currentEpochErrors, setCurrentEpochErrors] = useState(0);
  const [lastEpochLoss, setLastEpochLoss] = useState(null);

  const timerRef = useRef(null);
  const eta = 1;

  const currentZ = (trainingData[index].x1 * w1 + trainingData[index].x2 * w2 + b).toFixed(2);
  const currentYHat = currentZ >= 0 ? 1 : 0;

  const trenujKrok = () => {
    const d = trainingData[index];
    const z = d.x1 * w1 + d.x2 * w2 + b;
    const yHat = z >= 0 ? 1 : 0;
    const e = d.y - yHat;

    // Počítame sumu štvorcov chýb pre celú epochu (e^2)
    let newSumSquaredErrors = currentEpochErrors + (e * e);

    if (e !== 0) {
      setW1(prev => prev + eta * e * d.x1);
      setW2(prev => prev + eta * e * d.x2);
      setB(prev => prev + eta * e * 1);
      
      setHistory(prev => [{
        id: Date.now(),
        vstup: `[${d.x1}, ${d.x2}]`,
        predpoved: yHat,
        ciel: d.y,
        chyba: e
      }, ...prev].slice(0, 4));
    }

    // Ak sme na konci tréningovej sady (4. príklad, index 3)
    if (index === 3) {
      setEpochCount(prev => prev + 1);
      
      // VÝPOČET LOSS: Suma štvorcov chýb / počet príkladov (4)
      const mseLoss = newSumSquaredErrors / 4;
      setLastEpochLoss(mseLoss); 
      
      setCurrentEpochErrors(0);
      
      // Ak je strata 0, znamená to, že všetky 4 príklady sú správne
      if (newSumSquaredErrors === 0 && isAutoTraining) {
        setIsAutoTraining(false);
      }
    } else {
      setCurrentEpochErrors(newSumSquaredErrors);
    }

    setIndex((prev) => (prev + 1) % 4);
  };

  useEffect(() => {
    if (isAutoTraining) {
      timerRef.current = setInterval(() => trenujKrok(), 400);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isAutoTraining, index, w1, w2, b]);

  const reset = () => {
    setW1(0); setW2(0); setB(0); setIndex(0); 
    setHistory([]); setEpochCount(0); setLastEpochLoss(null);
    setCurrentEpochErrors(0); setIsAutoTraining(false);
  };

  const getLineData = () => {
    const pts = [];
    if (Math.abs(w2) < 0.01) {
      if (Math.abs(w1) > 0.01) {
        const xVal = -b / w1;
        pts.push({ x: xVal, y: -0.5 }, { x: xVal, y: 1.5 });
      }
    } else {
      pts.push({ x: -0.5, y: (-w1 * -0.5 - b) / w2 });
      pts.push({ x: 1.5, y: (-w1 * 1.5 - b) / w2 });
    }
    return pts;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER S UKAZOVATEĽMI */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs">
              <Activity size={14} /> Neural Learning System
            </div>
            <h1 className="text-4xl font-black text-slate-900">Perceptron Lab</h1>
          </div>

          {/* STATS COUNTERS */}
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Hash size={20}/></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Epocha</p>
                <p className="text-xl font-black text-slate-700">{epochCount}</p>
              </div>
            </div>
            <div className="flex-1 lg:flex-none bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${lastEpochLoss === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <TrendingDown size={20}/>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Loss (Epocha)</p>
                <p className={`text-xl font-black ${lastEpochLoss === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {lastEpochLoss !== null ? lastEpochLoss.toFixed(2).replace('.', ',') : '--'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setIsAutoTraining(!isAutoTraining)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isAutoTraining ? 'bg-amber-500 text-white shadow-lg' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isAutoTraining ? <RotateCcw size={18} className="animate-spin" /> : <Play size={18}/>}
                {isAutoTraining ? 'Zastaviť' : 'Auto-trénuj'}
              </button>
              <button onClick={reset} className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
                <RotateCcw size={20}/>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ARCHITEKTÚRA */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 relative min-h-[580px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2"><Brain size={24} className="text-blue-500"/> Vizualizácia modelu</h3>
                {lastEpochLoss === 0 && (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-1 rounded-full animate-bounce">
                    <Activity size={14}/> Tréning úspešne dokončený!
                  </div>
                )}
              </div>

              <div className="relative h-[400px]">
                <svg width="100%" height="100%" viewBox="0 0 600 400">
                  <g className="transition-all duration-500">
                    <line x1="100" y1="100" x2="300" y2="200" stroke="#f1f5f9" strokeWidth={Math.abs(w1)*8 + 2} className="transition-all" />
                    <line x1="100" y1="300" x2="300" y2="200" stroke="#f1f5f9" strokeWidth={Math.abs(w2)*8 + 2} className="transition-all" />
                    <text x="180" y="130" className="fill-blue-600 font-mono text-xs font-bold">w1: {w1.toFixed(2)}</text>
                    <text x="180" y="280" className="fill-blue-600 font-mono text-xs font-bold">w2: {w2.toFixed(2)}</text>
                  </g>

                  <circle cx="100" cy="100" r="30" className={`${trainingData[index].x1 ? 'fill-blue-500 shadow-xl' : 'fill-slate-100'} transition-all duration-300`} />
                  <text x="88" y="105" className={`${trainingData[index].x1 ? 'fill-white' : 'fill-slate-400'} font-bold`}>x1</text>
                  
                  <circle cx="100" cy="300" r="30" className={`${trainingData[index].x2 ? 'fill-blue-500 shadow-xl' : 'fill-slate-100'} transition-all duration-300`} />
                  <text x="88" y="305" className={`${trainingData[index].x2 ? 'fill-white' : 'fill-slate-400'} font-bold`}>x2</text>

                  <circle cx="300" cy="200" r="65" className="fill-slate-900 stroke-[10px] stroke-slate-800" />
                  <text x="285" y="212" className="fill-white text-4xl font-black">Σ</text>
                  <text x="275" y="295" className="fill-slate-400 text-xs font-mono font-bold uppercase tracking-widest">Bias: {b.toFixed(2)}</text>

                  <line x1="365" y1="200" x2="500" y2="200" stroke={currentYHat ? "#10b981" : "#f1f5f9"} strokeWidth="6" />
                  <circle cx="500" cy="200" r="35" className={`${currentYHat ? 'fill-emerald-500' : 'fill-slate-50'} transition-all duration-300`} />
                  <text x="492" y="206" className={`${currentYHat ? 'fill-white' : 'fill-slate-400'} font-bold text-lg`}>ŷ</text>
                </svg>

                <div className="absolute top-0 right-0 bg-blue-600 text-white p-5 rounded-3xl max-w-[240px] shadow-2xl">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-blue-200 font-black mb-2">Matematické jadro</h4>
                  <p className="text-xs font-mono leading-relaxed opacity-90">
                    z = ({trainingData[index].x1} × {w1.toFixed(1)}) + ({trainingData[index].x2} × {w2.toFixed(1)}) + ({b.toFixed(1)}) = <span className="text-emerald-300 font-bold underline">{currentZ}</span>
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-500/50 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-blue-200">Aktivácia:</span>
                    <span className="text-xs font-black bg-blue-700 px-2 py-1 rounded">z ≥ 0 → 1</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-12">
                <button onClick={trenujKrok} disabled={isAutoTraining} className="col-span-3 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                  <StepForward size={24}/> Ďalší krok učenia
                </button>
                <div className="bg-slate-50 rounded-[1.5rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                   <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Cieľ Y</span>
                   <span className="text-3xl font-black text-slate-800">{trainingData[index].y}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-[280px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex items-center gap-2 tracking-[0.2em]">
                <Settings2 size={14}/> Geometrický model
              </h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                    
                    {/* Osi s viditeľnými číslami */}
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      domain={[-0.2, 1.2]} 
                      name="x1" 
                      stroke="#94a3b8" 
                      fontSize={10}
                      tick={{fontSize: 10}}
                      label={{ value: 'x1', position: 'bottom', offset: 0, fontSize: 10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      domain={[-0.2, 1.2]} 
                      name="x2" 
                      stroke="#94a3b8" 
                      fontSize={10}
                      tick={{fontSize: 10}}
                      label={{ value: 'x2', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />

                    {/* Body (Červená pre 0, Zelená pre 1) */}
                    <Scatter 
                      name="Cieľ 0" 
                      data={trainingData.filter(d => d.y === 0).map(d => ({ x: d.x1, y: d.x2 }))} 
                      fill="#ef4444" 
                    />
                    <Scatter 
                      name="Cieľ 1" 
                      data={trainingData.filter(d => d.y === 1).map(d => ({ x: d.x1, y: d.x2 }))} 
                      fill="#10b981" 
                    />
                    
                    {/* Deliaca čiara */}
                    <Scatter data={getLineData()} line={{ stroke: '#3b82f6', strokeWidth: 2 }} shape={() => null} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex items-center gap-2 tracking-[0.2em]">
                <History size={14}/> Protokol učenia
              </h3>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white transition-all group">
                    <div>
                      <div className="text-xs font-bold text-slate-800 tracking-tight">Vstup: {h.vstup}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        ŷ:{h.predpoved} | y:{h.ciel} → Update
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-12 opacity-30 italic text-sm">Systém pripravený...</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}