
import React, { useState, useEffect, useCallback, useRef } from 'react';
import LinkageCanvas from './components/LinkageCanvas';
import StaticProblemRenderer from './components/StaticProblemRenderer';
import { Mechanism, StaticProblem } from './types';
import { getRandomMechanism } from './utils/generators';
import { textbookProblems } from './utils/staticProblems';
import { Play, Pause, RefreshCw, CheckCircle, HelpCircle, MousePointerClick, BookOpen, PenTool } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interactive' | 'textbook'>('interactive');
  
  // Interactive State
  const [mechanism, setMechanism] = useState<Mechanism | null>(null);
  const [simState, setSimState] = useState({ isRunning: false, t: 0 });
  
  // Textbook State
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  
  // Shared Analysis Input
  const [inputs, setInputs] = useState({ n: '', j: '', sumFi: '', m: '' });
  const [feedback, setFeedback] = useState<{status: 'idle' | 'success' | 'error', msg: string}>({ status: 'idle', msg: '' });
  const [showSolution, setShowSolution] = useState(false);

  // Animation Loop
  const requestRef = useRef<number>(0);
  
  const animate = useCallback(() => {
    if (!mechanism || !mechanism.solve || activeTab !== 'interactive') return;

    setSimState(prev => {
        const speed = 0.02; 
        const newT = (prev.t + speed) % (2 * Math.PI);
        const updatedJoints = mechanism.solve!(newT, mechanism.joints);
        setMechanism(m => m ? ({ ...m, joints: updatedJoints }) : null);
        return { ...prev, t: newT };
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [mechanism, activeTab]);

  useEffect(() => {
    if (simState.isRunning && activeTab === 'interactive') {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [simState.isRunning, animate, activeTab]);

  // Init
  useEffect(() => {
    handleNewMechanism();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewMechanism = () => {
    setSimState({ isRunning: false, t: 0 });
    const newMech = getRandomMechanism();
    setMechanism(newMech);
    resetForm();
  };

  const resetForm = () => {
    setInputs({ n: '', j: '', sumFi: '', m: '' });
    setFeedback({ status: 'idle', msg: '' });
    setShowSolution(false);
  }

  const toggleSimulation = () => {
    setSimState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleJointClick = (jointId: string) => {
    if (!mechanism) return;
    const updatedJoints = mechanism.joints.map(j => ({
      ...j,
      isDriver: j.id === jointId
    }));
    setMechanism({ ...mechanism, joints: updatedJoints });
  };

  const currentTextbookProblem = textbookProblems[currentProblemIndex];
  
  // Determine if we are in spatial mode (K=6) or planar (K=3)
  const isSpatial = activeTab === 'textbook' && currentTextbookProblem.isSpatial;
  const K = isSpatial ? 6 : 3;

  const checkAnswers = () => {
    const n = parseInt(inputs.n);
    const j = parseInt(inputs.j);
    const sumFi = parseInt(inputs.sumFi);
    const m = parseInt(inputs.m);

    if (isNaN(n) || isNaN(j) || isNaN(sumFi) || isNaN(m)) {
      setFeedback({ status: 'error', msg: 'Please enter valid numbers for all fields.' });
      return;
    }

    let expectedN, expectedJ, expectedSumFi, expectedM;

    if (activeTab === 'interactive' && mechanism) {
        expectedN = mechanism.expectedN;
        expectedJ = mechanism.expectedJ;
        expectedSumFi = mechanism.expectedSumFi;
        expectedM = mechanism.expectedM;
    } else if (activeTab === 'textbook') {
        const prob = textbookProblems[currentProblemIndex];
        expectedN = prob.expectedN;
        expectedJ = prob.expectedJ;
        expectedSumFi = prob.expectedSumFi;
        expectedM = prob.expectedM;
    }

    if (n === expectedN && j === expectedJ && sumFi === expectedSumFi && m === expectedM) {
      setFeedback({ status: 'success', msg: 'Correct! You successfully analyzed the mobility.' });
    } else {
      setFeedback({ status: 'error', msg: 'Incorrect. Check your link/joint counts and connectivity sum.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">K</div>
            <h1 className="text-xl font-semibold tracking-tight">KinemaLearn</h1>
          </div>
          
          <div className="flex space-x-4">
             <button 
                onClick={() => { setActiveTab('interactive'); resetForm(); }}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${activeTab === 'interactive' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <PenTool size={16}/>
                <span>Interactive Generator</span>
             </button>
             <button 
                onClick={() => { setActiveTab('textbook'); resetForm(); }}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${activeTab === 'textbook' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <BookOpen size={16}/>
                <span>Textbook Problems</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visualization */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-slate-800">
                {activeTab === 'interactive' ? (mechanism?.name || 'Loading...') : currentTextbookProblem.title}
            </h2>
            
            {activeTab === 'interactive' && (
                <div className="flex space-x-2">
                <button 
                    onClick={toggleSimulation}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    simState.isRunning 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                >
                    {simState.isRunning ? <><Pause size={18} /> <span>Pause</span></> : <><Play size={18} /> <span>Animate</span></>}
                </button>
                <button 
                    onClick={handleNewMechanism}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300 transition-colors"
                >
                    <RefreshCw size={18} />
                    <span>New Problem</span>
                </button>
                </div>
            )}
            
            {activeTab === 'textbook' && (
                <div className="flex space-x-2">
                    <button 
                        disabled={currentProblemIndex === 0}
                        onClick={() => { setCurrentProblemIndex(i => i-1); resetForm(); }}
                        className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
                    >Prev</button>
                    <span className="py-1 px-2 text-sm font-bold text-slate-600">
                        {currentProblemIndex + 1} / {textbookProblems.length}
                    </span>
                    <button 
                        disabled={currentProblemIndex === textbookProblems.length - 1}
                        onClick={() => { setCurrentProblemIndex(i => i+1); resetForm(); }}
                        className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
                    >Next</button>
                </div>
            )}
          </div>

          {activeTab === 'interactive' && mechanism && (
            <LinkageCanvas 
                mechanism={mechanism} 
                onJointClick={handleJointClick} 
            />
          )}
          
          {activeTab === 'textbook' && (
             <StaticProblemRenderer problem={currentTextbookProblem} />
          )}

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
             <div className="flex items-start space-x-3">
               <MousePointerClick className="text-indigo-500 mt-1 flex-shrink-0" size={20} />
               <div className="text-slate-600 leading-relaxed text-sm">
                 <p className="mb-1 font-semibold text-slate-700">Instructions:</p>
                 {activeTab === 'interactive' ? (
                     <ul className="list-disc list-inside space-y-1 ml-1">
                        <li>Analyze the mechanism and determine the mobility parameters.</li>
                        <li>Count <b>Joints (j)</b> carefully: coincident pins count as 2.</li>
                        <li>Actuators (Cylinders) count as 2 links (Body+Piston) + 1 P-joint.</li>
                        <li>Determine sum of connectivities (R/P=1, Pin-in-Slot/Cam=2).</li>
                     </ul>
                 ) : (
                     <div className="space-y-2">
                        <p>{currentTextbookProblem.description}</p>
                        {isSpatial && <p className="text-amber-600 font-medium">Note: This is a Spatial Mechanism.</p>}
                     </div>
                 )}
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Analysis Quiz */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <CheckCircle className="mr-2 text-indigo-500" size={20}/>
              Mobility Criteria
            </h3>
            
            <div className="bg-slate-50 p-3 rounded-md mb-6 border border-slate-200 transition-colors duration-300" style={{ borderColor: isSpatial ? '#fcd34d' : '#e2e8f0' }}>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">General Formula</p>
              <code className="text-slate-800 font-mono text-sm block">
                M = <span className="font-bold text-indigo-600">{K}</span>(n - j - 1) + <span className="text-lg">Σ</span>f<sub className="text-xs">i</sub>
              </code>
              <p className="text-xs text-slate-400 mt-2 italic">
                {isSpatial ? 'For spatial linkages, K = 6.' : 'For planar linkages, K = 3.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Links (n)</label>
                <input 
                  type="number" 
                  value={inputs.n}
                  onChange={(e) => setInputs({...inputs, n: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Count ground as 1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Joints (j)</label>
                  <input 
                    type="number" 
                    value={inputs.j}
                    onChange={(e) => setInputs({...inputs, j: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="All joints"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sum Connectivity (Σf<sub className="text-xs">i</sub>)</label>
                  <input 
                    type="number" 
                    value={inputs.sumFi}
                    onChange={(e) => setInputs({...inputs, sumFi: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Sum of DOFs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobility (M)</label>
                <input 
                  type="number" 
                  value={inputs.m}
                  onChange={(e) => setInputs({...inputs, m: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold text-slate-800"
                  placeholder="Degrees of Freedom"
                />
              </div>

              <button 
                onClick={checkAnswers}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all transform active:scale-95"
              >
                Check Answer
              </button>

              {feedback.status !== 'idle' && (
                <div className={`p-4 rounded-md text-sm ${
                  feedback.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {feedback.msg}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setShowSolution(!showSolution)}
                  className="flex items-center text-sm text-slate-500 hover:text-slate-700"
                >
                  <HelpCircle size={16} className="mr-1" />
                  {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
                
                {showSolution && (
                  <div className="mt-3 text-sm text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                    <p>Links (n): <b>{activeTab === 'interactive' && mechanism ? mechanism.expectedN : currentTextbookProblem.expectedN}</b></p>
                    <p>Joints (j): <b>{activeTab === 'interactive' && mechanism ? mechanism.expectedJ : currentTextbookProblem.expectedJ}</b></p>
                    <p>Sum (Σf<sub>i</sub>): <b>{activeTab === 'interactive' && mechanism ? mechanism.expectedSumFi : currentTextbookProblem.expectedSumFi}</b></p>
                    <div className="mt-2 pt-2 border-t border-slate-200 font-mono text-xs">
                       Result: M = <b>{activeTab === 'interactive' && mechanism ? mechanism.expectedM : currentTextbookProblem.expectedM}</b>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
