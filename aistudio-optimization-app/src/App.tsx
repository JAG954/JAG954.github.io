import { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Table,
  Code,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Cpu,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Info,
  HelpCircle,
  Briefcase,
  ChevronRight,
  Database,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { LPFormulation, LPFormulateResponse } from './types';
import Latex from './components/Latex';

const EXAMPLES = [
  {
    title: "🛋️ Product Mix Optimization",
    description: "A factory produces chairs and tables. Each chair earns $40 profit and each table earns $70 profit. A chair requires 2 labor hours and 1 unit of wood. A table requires 3 labor hours and 4 units of wood. The factory has 120 labor hours and 100 units of wood available. Formulate an LP to maximize profit.",
    prompt: "A factory produces chairs and tables. Each chair earns $40 profit and each table earns $70 profit. A chair requires 2 labor hours and 1 unit of wood. A table requires 3 labor hours and 4 units of wood. The factory has 120 labor hours and 100 units of wood available. Formulate an LP to maximize profit."
  },
  {
    title: "🍗 Cost-Minimizing Daily Diet",
    description: "Create a minimum-cost diet using chicken and rice. Chicken costs $4 per serving and rice costs $1 per serving. Each serving of chicken has 30 grams of protein and 5 grams of fat. Each serving of rice has 4 grams of protein and 1 gram of fat. The diet needs at least 60 grams of protein and at most 20 grams of fat.",
    prompt: "Create a minimum-cost diet using chicken and rice. Chicken costs $4 per serving and rice costs $1 per serving. Each serving of chicken has 30 grams of protein and 5 grams of fat. Each serving of rice has 4 grams of protein and 1 gram of fat. The diet needs at least 60 grams of protein and at most 20 grams of fat."
  },
  {
    title: "🚚 Supply Logistics (Transportation)",
    description: "A company ships products from two warehouses to three stores. Warehouse 1 has 80 units and Warehouse 2 has 120 units. Store A needs 50 units, Store B needs 70 units, and Store C needs 80 units. Shipping costs are 4, 6, and 8 from Warehouse 1, and 5, 4, and 3 from Warehouse 2. Formulate a minimum-cost LP.",
    prompt: "A company ships products from two warehouses to three stores. Warehouse 1 has 80 units and Warehouse 2 has 120 units. Store A needs 50 units, Store B needs 70 units, and Store C needs 80 units. Shipping costs are 4, 6, and 8 from Warehouse 1, and 5, 4, and 3 from Warehouse 2. Formulate a minimum-cost LP."
  }
];

export default function App() {
  const [inputText, setInputText] = useState(EXAMPLES[0].prompt);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [response, setResponse] = useState<LPFormulation | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [isPrepaymentDepleted, setIsPrepaymentDepleted] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState<'formulation' | 'standard' | 'matrix' | 'derivation' | 'developer' | 'solver'>('formulation');

  const handleFormulate = async (textToUse = inputText) => {
    setLoading(true);
    setCustomError(null);
    setIsOffline(false);
    setOfflineNotice(null);
    setIsPrepaymentDepleted(false);

    try {
      const res = await fetch('/api/formulate-lp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: textToUse }),
      });

      const body: LPFormulateResponse = await res.json();

      if (body.ok && body.data) {
        setResponse(body.data);
        setIsOffline(body.isOfflineFallback || false);
        setOfflineNotice(body.offlineNotice || null);
        setIsPrepaymentDepleted(body.isPrepaymentDepleted || false);
      } else {
        setCustomError(body.error || 'Failed to generate correct Linear Program formulation.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setCustomError('Network error connecting to the LP formulation backend. Ensure the Express service runs properly on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (exPrompt: string) => {
    setInputText(exPrompt);
    handleFormulate(exPrompt);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Run formulation on mount
  useEffect(() => {
    handleFormulate(EXAMPLES[0].prompt);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] selection:bg-[#fdf4f2] selection:text-[#8b2c15]" id="app-container">
      {/* Jishnu Ghosh Custom Academic Header Layout */}
      <header className="border-b border-[#e7e5e4] bg-white pt-10 pb-8 shrink-0 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6" id="header-identity">
          <div className="space-y-3">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[#8b2c15] block">
              INDUSIAL ENGINEERING PORTFOLIO MODEL
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-[#1c1917]" id="dev-name">
              Jishnu Auro Ghosh
            </h1>
            <p className="text-[#57534e] text-base leading-relaxed font-sans max-w-2xl">
              Industrial Engineering senior at Purdue University building production scheduling models, 
              ERP/SCM dashboards, and mathematical optimization systems for manufacturing and supply chain decision support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0 pt-1" id="social-links-panel">
            <a href="https://github.com/JishnuJAG" target="_blank" rel="noreferrer" className="px-3.5 py-1.5 border border-[#e7e5e4] hover:bg-[#fafaf9] transition-colors rounded text-xs font-semibold text-[#57534e] flex items-center gap-1.5">
              GitHub
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="px-3.5 py-1.5 border border-[#e7e5e4] hover:bg-[#fafaf9] transition-colors rounded text-xs font-semibold text-[#57534e] flex items-center gap-1.5">
              LinkedIn
            </a>
            <a href="mailto:jishnujag@gmail.com" className="px-3.5 py-1.5 border border-[#e7e5e4] hover:bg-[#fafaf9] transition-colors rounded text-xs font-semibold text-[#57534e] flex items-center gap-1.5">
              Email
            </a>
          </div>
        </div>

        {/* Inner page navigation mimicking a professional research sub-tab */}
        <div className="mt-8 border-t border-[#e7e5e4] pt-6 flex items-center justify-between" id="sub-navigation">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#8b2c15]" />
            <span className="font-serif italic text-md text-[#1c1917] font-semibold">
              Research Project Exhibit: Natural Language optimization to Linear Program Formulation
            </span>
          </div>
          <div className="text-[10px] uppercase font-mono tracking-wider bg-[#fdf4f2] text-[#8b2c15] px-2.5 py-1 border border-[#8b2c15]/10 rounded font-semibold hidden sm:inline-block">
            OR-Optima Engine v2.5
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8" id="portfolio-main-content">
        {/* Intro notice & constraints framework */}
        <section className="bg-white border border-[#e7e5e4] p-6 rounded-lg shadow-sm space-y-4" id="tool-introduction">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#fdf4f2] text-[#8b2c15] rounded">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-md font-serif font-semibold text-[#1c1917]">
                Sourcing Optimization LP Formulation Suite
              </h2>
              <p className="text-xs text-[#57534e] leading-relaxed">
                This operations research module translates general optimization prompts into rigorous mathematical equations. 
                It generates a detailed algebraic general form, standard equality transformations ready for Simplex pivots (minimizing cost systems), 
                structured coefficient matrices, step-by-step conversion traces, and developer JSON payloads designed for Google OR-Tools or primal-dual barrier algorithms.
              </p>
            </div>
          </div>
        </section>

        {/* Two Column Layout: Controls and Problem descriptions */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6" id="input-control-bento">
          {/* Default Templates (Column 4) */}
          <div className="md:col-span-4 space-y-4" id="example-prompts-container">
            <div className="bg-white border border-[#e7e5e4] p-5 rounded-lg shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[#e7e5e4] pb-2">
                <BookOpen className="h-4 w-4 text-[#8b2c15]" />
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                  Select Optimization Profile
                </h3>
              </div>
              <p className="text-xs text-[#57534e] leading-relaxed">
                Interact with any of these industrial engineering prompt profiles to formulate linear programs:
              </p>
              <div className="space-y-2.5">
                {EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    id={`template-loader-${idx}`}
                    onClick={() => loadExample(ex.prompt)}
                    className="w-full text-left p-3 border border-[#e7e5e4] hover:border-[#8b2c15] hover:bg-[#fdf4f2]/20 transition-all rounded-md group text-xs cursor-pointer flex flex-col justify-between"
                  >
                    <span className="font-serif font-bold text-[#1c1917] group-hover:text-[#8b2c15] transition-colors">
                      {ex.title}
                    </span>
                    <span className="text-[10px] text-[#57534e] mt-1 line-clamp-2">
                      {ex.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive input box (Column 8) */}
          <div className="md:col-span-8 space-y-4" id="main-editor-container">
            <div className="bg-white border border-[#e7e5e4] p-5 rounded-lg shadow-sm flex flex-col justify-between h-full space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="user-nl-prompt" className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#8b2c15]" />
                    Optimization Problem Specification
                  </label>
                  <span className="text-[10px] font-mono bg-[#f5f5f4] text-[#57534e] px-2 py-0.5 rounded border border-[#e7e5e4]">
                    NL Parsing Core
                  </span>
                </div>
                <p className="text-xs text-[#57534e]">
                  Modify or paste custom factory floor resource capabilities, shipping transport lists, lower bounds, or objectives:
                </p>
              </div>

              <textarea
                id="user-nl-prompt"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Declare variables, constraints, coefficients, and bounds..."
                className="w-full h-36 p-3 border border-[#e7e5e4] focus:border-[#8b2c15] rounded focus:outline-none focus:ring-1 focus:ring-[#8b2c15] text-xs font-sans leading-relaxed resize-none bg-[#fafaf9]"
              />

              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <p className="text-[10px] text-[#57534e] italic">
                  * All inputs processed via continuous linear relaxation pipeline.
                </p>

                <button
                  id="formulate-lp-submit"
                  onClick={() => handleFormulate()}
                  disabled={loading}
                  className={`px-4.5 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                    loading
                      ? 'bg-[#f5f5f4] text-[#a8a29e] border border-[#e7e5e4] cursor-not-allowed'
                      : 'bg-[#8b2c15] text-white hover:bg-[#701c0b] hover:shadow-sm'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#57534e] border-t-transparent" />
                      Parsing Parameters...
                    </>
                  ) : (
                    <>
                      <Sliders className="h-3.5 w-3.5" />
                      Formulate Linear Program
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {customError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2" id="error-alert">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span><b>Formulation Error:</b> {customError}</span>
          </div>
        )}

        {/* Results layout */}
        {response && (
          <div className="space-y-6" id="formulate-results-wrap">
            {/* Visualizer and transformation Navigation tab selector */}
            <div className="flex border-b border-[#e7e5e4] shrink-0 overflow-x-auto gap-1" id="formulator-nav-tabs">
              <button
                id="results-tab-formulation"
                onClick={() => setActiveResultsTab('formulation')}
                className={`py-2 px-4 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeResultsTab === 'formulation'
                    ? 'border-[#8b2c15] text-[#8b2c15] bg-white font-semibold'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                1. General LP Form
              </button>
              <button
                id="results-tab-standard"
                onClick={() => setActiveResultsTab('standard')}
                className={`py-2 px-4 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeResultsTab === 'standard'
                    ? 'border-[#8b2c15] text-[#8b2c15] bg-white font-semibold'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                2. Standard Equality Form
              </button>
              <button
                id="results-tab-matrix"
                onClick={() => setActiveResultsTab('matrix')}
                className={`py-2 px-4 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeResultsTab === 'matrix'
                    ? 'border-[#8b2c15] text-[#8b2c15] bg-white font-semibold'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                3. Matrix Vectors
              </button>
              <button
                id="results-tab-derivation"
                onClick={() => setActiveResultsTab('derivation')}
                className={`py-2 px-4 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeResultsTab === 'derivation'
                    ? 'border-[#8b2c15] text-[#8b2c15] bg-white font-semibold'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                4. Step-by-Step Derivation
              </button>
              <button
                id="results-tab-solver"
                onClick={() => setActiveResultsTab('solver')}
                className={`py-2 px-4 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeResultsTab === 'solver'
                    ? 'border-[#8b2c15] text-[#8b2c15] bg-white font-semibold'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                5. Solver Sandbox (Interface)
              </button>
              <button
                id="results-tab-developer"
                onClick={() => setActiveResultsTab('developer')}
                className={`py-2 px-4 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeResultsTab === 'developer'
                    ? 'border-[#8b2c15] text-[#8b2c15] bg-white font-semibold'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                6. Structured Developer JSON
              </button>
            </div>

            {/* Offline Fallback Warning banner */}
            {isOffline && (
              <div className="space-y-3" id="fallback-container-wrapper">
                {isPrepaymentDepleted ? (
                  <div className="p-5 bg-red-50 border border-red-200 text-red-950 rounded-lg text-xs space-y-3 shadow-sm" id="offline-banner">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-red-100 text-red-800 rounded">
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-700" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-sans font-bold text-red-900 text-sm">
                          Gemini API Key Prepayment Credits Depleted (429 RESOURCE_EXHAUSTED)
                        </p>
                        <p className="text-red-800 leading-relaxed">
                          Your custom Gemini API Key has been loaded successfully, but Google AI Studio reports that <strong>your prepayment credits are depleted</strong>. 
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-11 pr-4 py-3 bg-white/70 border border-red-100 rounded space-y-2 text-[#44403c] leading-relaxed">
                      <p className="font-bold text-xs text-[#1c1917]">How to restore live generative AI formulation:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-[#57534e]">
                        <li>
                          Go directly to <a href="https://ai.studio/projects" target="_blank" rel="noreferrer" className="text-[#8b2c15] font-semibold underline hover:text-[#701c0b]">Google AI Studio Projects</a> to manage your active projects and top up your prepay balance.
                        </li>
                        <li>
                          Read how Google manages prepayment credits and billing tiers at the <a href="https://ai.google.dev/gemini-api/docs/billing#prepay" target="_blank" rel="noreferrer" className="text-[#8b2c15] font-semibold underline hover:text-[#701c0b]">Google Gemini API Billing Guide</a>.
                        </li>
                        <li>
                          Alternatively, you can provide a different API Key in your workspace environment configuration files.
                        </li>
                      </ol>
                    </div>

                    <p className="pl-11 text-[11px] text-[#57534e]">
                      💡 <strong>Graceful Recovery:</strong> Jishnu Auro Ghosh's portfolio system has matched your scenario and automatically triggered <strong>cached linear formulation systems</strong> for testing. Standard operations research profiles (Product Mix, Diet, and Transportation Problems) are 100% active and editable.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs" id="offline-banner">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold">Offline Profile Loaded</p>
                        <p>{offlineNotice || "The model system loaded cached structures because the live Gemini API was unreachable."}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MAIN TAB WRAPPERS */}
            <div className="bg-white border border-[#e7e5e4] p-6 rounded-lg shadow-sm space-y-6" id="results-tab-pane">

              {/* TAB 1: GENERAL FORMULATION */}
              {activeResultsTab === 'formulation' && (
                <div className="space-y-6" id="layout-general-form-tab">
                  {/* Problem Interpretation Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="problem-interpretation-grid">
                    <div className="p-4 bg-[#fafaf9] rounded border border-[#e7e5e4] space-y-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#8b2c15] tracking-wider block">
                        Interpreted Primary Goal
                      </span>
                      <p className="text-xs text-[#1c1917] leading-relaxed">
                        {response.original_problem.interpreted_goal || "Solve the linear program variables."}
                      </p>
                    </div>

                    <div className="p-4 bg-[#fafaf9] rounded border border-[#e7e5e4] space-y-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#8b2c15] tracking-wider block">
                        Interpreted Context Domain
                      </span>
                      <p className="text-xs text-[#1c1917] leading-relaxed">
                        {response.original_problem.interpreted_context || "Industrial Scheduling / Logistics Operations."}
                      </p>
                    </div>
                  </div>

                  {/* Decision Variables table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Decision Variables Identifications ($n = {response.decision_variables.length}$)
                    </h3>
                    <div className="overflow-x-auto border border-[#e7e5e4] rounded" id="vars-tables-wrapper">
                      <table className="w-full text-xs text-left border-collapse bg-[#fafaf9]">
                        <thead>
                          <tr className="border-b border-[#e7e5e4] text-[#57534e] uppercase text-[10px] bg-white font-mono font-semibold">
                            <th className="p-2.5">Variable Symbol</th>
                            <th className="p-2.5">LaTeX Symbol</th>
                            <th className="p-2.5">Description</th>
                            <th className="p-2.5">Sign / Bounds</th>
                            <th className="p-2.5">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {response.decision_variables.map((v, i) => (
                            <tr key={i} className="border-b border-[#e7e5e4] hover:bg-white transition-all">
                              <td className="p-2.5 font-mono font-bold text-[#8b2c15]">{v.name}</td>
                              <td className="p-2.5 font-mono select-all">
                                <Latex math={v.symbol} />
                              </td>
                              <td className="p-2.5 text-[#57534e]">{v.description}</td>
                              <td className="p-2.5 font-mono text-[10px]">
                                <span className="bg-[#f5f5f4] border border-[#e7e5e4] px-1.5 py-0.5 rounded text-[#1c1917] uppercase">
                                  {v.sign}
                                </span>
                                {v.lower_bound !== null && ` (>= ${v.lower_bound})`}
                                {v.upper_bound !== null && ` (<= ${v.upper_bound})`}
                              </td>
                              <td className="p-2.5 text-[#57534e]">{v.unit || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* LaTeX Alignment General Form block */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      General Formulation Algebra System
                    </h3>
                    <div className="p-6 border border-[#e7e5e4] rounded bg-[#fafaf9] flex items-center justify-center overflow-x-auto">
                      <Latex math={response.general_form.latex_block} displayMode={true} />
                    </div>
                  </div>

                  {/* Mapped Constraints list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Constraint Algebraic Expressions
                    </h3>
                    <div className="space-y-2.5" id="general-constraints-box">
                      {response.general_form.constraints.map((c, i) => (
                        <div key={i} className="p-4 border border-[#e7e5e4] rounded hover:border-[#8b2c15] transition-colors bg-[#fafaf9]/40">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e5e4]/60 pb-1.5 mb-1.5">
                            <span className="text-xs font-serif font-bold text-[#1c1917]">
                              {c.name} <code className="text-[#8b2c15] font-mono text-[10px]">({c.id})</code>
                            </span>
                            <span className="font-mono text-xs text-[#8b2c15] font-semibold bg-[#fdf4f2] border border-[#8b2c15]/10 px-2 py-0.5 rounded select-all">
                              <Latex math={c.expression_latex} /> {c.operator} {c.rhs}
                            </span>
                          </div>
                          <p className="text-xs text-[#57534e] leading-relaxed">
                            {c.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STANDARD EQUALITY FORM */}
              {activeResultsTab === 'standard' && (
                <div className="space-y-6" id="layout-standard-transformation">
                  <div className="p-4 bg-[#fdf4f2]/40 border border-[#8b2c15]/10 rounded flex items-start gap-2.5">
                    <Info className="h-4 w-4 shrink-0 text-[#8b2c15] mt-0.5" />
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      <b>Transformation Convention:</b> Minimizes a negated cost objective structure <code className="text-[#1c1917] font-semibold">minimize c^T x</code> subject to <code className="text-[#1c1917] font-[#1c1917]">A_eq x = b</code> where <code className="text-[#1c1917] font-[#1c1917]">x &gt;= 0</code> and <code className="text-[#1c1917] font-[#1c1917]">b &gt;= 0</code>. Positive slacks are formulated for Less-Than boundaries (operator &le;), while surplus values are subtracted for Greater-Than requirements (operator &ge;), completing the linear matrices model.
                    </p>
                  </div>

                  {/* Standard variables map */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Standard Equality Form Ordered Vector Variable Schema ($N^* = {response.standard_form.variables_ordered.length}$)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5" id="variables-order-list">
                      {response.standard_form.variables_ordered.map((sv, i) => (
                        <div key={i} className="p-3 border border-[#e7e5e4] rounded bg-[#fafaf9] flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-15">
                            <span className="font-mono font-bold text-xs bg-white border border-[#e7e5e4] px-1.5 py-0.5 text-[#8b2c15] rounded">
                              index {i}: {sv.name}
                            </span>
                            <span className="text-[10px] text-[#57534e] uppercase bg-[#f5f5f4] px-1.5 py-0.5 rounded text-[8px] font-bold font-mono">
                              {sv.source}
                            </span>
                          </div>
                          <p className="text-xs text-[#57534e] mt-1 truncate">
                            {sv.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LaTeX Alignment Standard Form block */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Standard Equality Form Equation System
                    </h3>
                    <div className="p-6 border border-[#e7e5e4] rounded bg-[#fafaf9] flex items-center justify-center overflow-x-auto">
                      <Latex math={response.standard_form.latex_block} displayMode={true} />
                    </div>
                  </div>

                  {/* Equality constraint rows */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Equation Form Coefficients mapping
                    </h3>
                    <div className="overflow-x-auto border border-[#e7e5e4] rounded">
                      <table className="w-full text-xs text-left border-collapse bg-[#fafaf9]" id="standard-equations-table">
                        <thead>
                          <tr className="border-b border-[#e7e5e4] text-[#57534e] uppercase text-[10px] bg-white font-mono font-semibold">
                            <th className="p-2.5">Constraint Symbol ID</th>
                            <th className="p-2.5">Standardized Equation LaTeX</th>
                            <th className="p-2.5">Coefficients Ordered $[c_j]$</th>
                            <th className="p-2.5">RHS Value $[b_i]$</th>
                          </tr>
                        </thead>
                        <tbody>
                          {response.standard_form.constraints.map((sc, i) => (
                            <tr key={i} className="border-b border-[#e7e5e4] hover:bg-white transition-all">
                              <td className="p-2.5 font-mono text-[#8b2c15]">{sc.id}</td>
                              <td className="p-2.5 font-mono">
                                <Latex math={sc.expression_latex} />
                              </td>
                              <td className="p-2.5 font-mono text-[10px]">
                                [{sc.coefficients_ordered.join(', ')}]
                              </td>
                              <td className="p-2.5 font-mono">{sc.rhs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MATRIX VECTORS representation */}
              {activeResultsTab === 'matrix' && (
                <div className="space-y-6" id="layout-matrix-expressions">
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Compact Matrix Algebraic Expression
                    </h3>
                    <div className="p-6 border border-[#e7e5e4] rounded bg-[#fafaf9] flex items-center justify-center overflow-x-auto">
                      <Latex math={response.matrix_form.latex} displayMode={true} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="matrix-decomposed-panels">
                    {/* Matrix A */}
                    <div className="p-4 border border-[#e7e5e4] rounded space-y-3 bg-[#fafaf9]">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#8b2c15] tracking-wider block">
                        Coefficient Matrix (A)
                      </span>
                      <div className="p-4 bg-white border border-[#e7e5e4] rounded flex items-center justify-center overflow-x-auto min-h-[90px]">
                        <Latex math={`\\mathbf{A} = ${response.matrix_form.matrix_latex}`} />
                      </div>
                      <p className="text-[10px] text-[#57534e]">
                        A is the system matrix of size {response.matrix_form.A.length} &times; {response.matrix_form.A[0]?.length || 0}.
                      </p>
                    </div>

                    {/* Vector x */}
                    <div className="p-4 border border-[#e7e5e4] rounded space-y-3 bg-[#fafaf9]">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#8b2c15] tracking-wider block">
                        Variable vector (x)
                      </span>
                      <div className="p-4 bg-white border border-[#e7e5e4] rounded flex items-center justify-center overflow-x-auto min-h-[90px]">
                        <Latex math={`\\mathbf{x} = ${response.matrix_form.variable_vector_latex}`} />
                      </div>
                      <p className="text-[10px] text-[#57534e]">
                        Vector elements ordered index alignment: [{response.matrix_form.variables.join(', ')}].
                      </p>
                    </div>

                    {/* Objective Vector c */}
                    <div className="p-4 border border-[#e7e5e4] rounded space-y-3 bg-[#fafaf9]">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#8b2c15] tracking-wider block">
                        Cost Parameter Vector (c)
                      </span>
                      <div className="p-4 bg-white border border-[#e7e5e4] rounded flex items-center justify-center overflow-x-auto min-h-[90px]">
                        <Latex math={`\\mathbf{c} = ${response.matrix_form.objective_vector_latex}`} />
                      </div>
                      <p className="text-[10px] text-[#57534e]">
                        Represented objective cost factors for optimization: [{response.matrix_form.c.join(', ')}].
                      </p>
                    </div>

                    {/* b vector */}
                    <div className="p-4 border border-[#e7e5e4] rounded space-y-3 bg-[#fafaf9]">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#8b2c15] tracking-wider block">
                        Boundary Constant Vector (b)
                      </span>
                      <div className="p-4 bg-white border border-[#e7e5e4] rounded flex items-center justify-center overflow-x-auto min-h-[90px]">
                        <Latex math={`\\mathbf{b} = ${response.matrix_form.rhs_vector_latex}`} />
                      </div>
                      <p className="text-[10px] text-[#57534e]">
                        Right-hand side constraints values matching b: [{response.matrix_form.b.join(', ')}].
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: STEP-BY-STEP DERIVATION */}
              {activeResultsTab === 'derivation' && (
                <div className="space-y-6" id="layout-transformation-tracks">
                  <div className="space-y-3">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Model Formulate & Standard Form Transformation steps
                    </h3>
                    <div className="relative border-l-2 border-[#e7e5e4] ml-3 pl-6 space-y-6" id="transformation-trace-timeline">
                      {response.transformations.map((step, i) => (
                        <div key={i} className="relative space-y-2">
                          {/* Circle dot marker */}
                          <div className="absolute -left-[31px] top-1.5 h-4 w-4 bg-[#8b2c15] border-2 border-white rounded-full flex items-center justify-center" />
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white bg-[#8b2c15] px-2 py-0.5 rounded-full">
                              Step {step.step_number}
                            </span>
                            <h4 className="text-xs font-sans font-bold text-[#1c1917]">
                              {step.title}
                            </h4>
                          </div>
                          <p className="text-xs text-[#57534e] leading-relaxed max-w-2xl">
                            {step.description}
                          </p>

                          {step.before_latex || step.after_latex ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 bg-[#fafaf9] p-3 border border-[#e7e5e4] rounded">
                              {step.before_latex && (
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#57534e] block border-b border-[#e7e5e4]/60 pb-1">
                                    Before Alignment
                                  </span>
                                  <div className="font-mono text-center overflow-x-auto text-xs py-1.5">
                                    <Latex math={step.before_latex} />
                                  </div>
                                </div>
                              )}
                              {step.after_latex && (
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#8b2c15] block border-b border-[#e7e5e4]/60 pb-1">
                                    After Transformation
                                  </span>
                                  <div className="font-mono text-center overflow-x-auto text-xs py-1.5 font-bold">
                                    <Latex math={step.after_latex} />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2.5 pt-0.5">
                            {step.affected_constraints.length > 0 && (
                              <span className="text-[9px] font-mono bg-[#f5f5f4] text-[#57534e] border border-[#e7e5e4] px-2 py-0.5 rounded">
                                Affected Constraints: {step.affected_constraints.join(', ')}
                              </span>
                            )}
                            {step.introduced_variables.length > 0 && (
                              <span className="text-[9px] font-mono bg-[#fdf4f2] text-[#8b2c15] border border-[#8b2c15]/10 px-2 py-0.5 rounded font-semibold animate-pulse">
                                Added Variables: {step.introduced_variables.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assumptions Card */}
                  <div className="mt-8 border-t border-[#e7e5e4] pt-6 space-y-4" id="metadata-conventions">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Operational Assumptions & Warning Notes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Assumptions */}
                      <div className="p-4 bg-[#fafaf9] border border-[#e7e5e4] rounded space-y-2">
                        <span className="text-[10px] font-serif font-bold uppercase text-[#8b2c15] tracking-wider block">
                          Model Formulation Assumptions
                        </span>
                        {response.metadata.assumptions.length > 0 ? (
                          <ul className="text-xs text-[#57534e] space-y-1.5 list-disc pl-4 leading-relaxed">
                            {response.metadata.assumptions.map((as, idx) => <li key={idx}>{as}</li>)}
                          </ul>
                        ) : (
                          <p className="text-xs text-[#57534e] italic">Standard proportional continuous variables declared with zero loss assumptions.</p>
                        )}
                      </div>

                      {/* Warnings / Exclusions */}
                      <div className="p-4 bg-[#fafaf9] border border-[#e7e5e4] rounded space-y-2">
                        <span className="text-[10px] font-serif font-bold uppercase text-[#8b2c15] tracking-wider block">
                          Unstructured Constraints / Warnings
                        </span>
                        {response.metadata.warnings.length > 0 || response.metadata.unsupported_features.length > 0 ? (
                          <div className="space-y-3">
                            {response.metadata.warnings.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-mono text-amber-700 font-bold">Warnings:</span>
                                <ul className="text-xs text-amber-800 space-y-1 pl-3.5 list-disc">
                                  {response.metadata.warnings.map((wn, idx) => <li key={idx}>{wn}</li>)}
                                </ul>
                              </div>
                            )}
                            {response.metadata.unsupported_features.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-mono text-red-700 font-bold">Unsupported Features:</span>
                                <ul className="text-xs text-red-800 space-y-1 pl-3.5 list-disc">
                                  {response.metadata.unsupported_features.map((uf, idx) => <li key={idx}>{uf}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#57534e] italic">Model verified compatible with canonical Continuous Linear Programming assumptions. No integer variables or boundary warnings.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SOLVER PLACEHOLDER */}
              {activeResultsTab === 'solver' && (
                <div className="space-y-6" id="layout-solver-integrations">
                  <div className="p-4 bg-[#fafaf9] border border-[#e7e5e4] rounded flex items-start gap-3">
                    <Info className="h-5 w-5 text-[#8b2c15] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-sans font-bold text-[#1c1917]">
                        Under Construction: Solver Sandbox Placeholder
                      </p>
                      <p className="text-xs text-[#57534e] leading-relaxed">
                        In accordance with the operations research task parameters, the custom <b>Simplex</b>, <b>Interior Point Method (IPM)</b>, and <b>Google OR-Tools</b> verification solvers will be fully integrated as live engines in subsequent project phases. 
                        Do not claim this prototype has solved the LP until these backend libraries are deployed and verified. 
                        Below is the live validation check of the generated coordinates system matching model solver requirements:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="solver-readiness-cards">
                    <div className="p-4 border border-[#e7e5e4] rounded bg-[#fafaf9] space-y-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#57534e]">Simplex Integration State</span>
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                        <span className="text-xs font-bold text-[#1c1917]">
                          {response.solver_payload.ready_for_simplex ? "Ready for Simplex" : "Reformulation Needed"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border border-[#e7e5e4] rounded bg-[#fafaf9] space-y-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#57534e]">Primal-Dual Barrier (IPM)</span>
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                        <span className="text-xs font-bold text-[#1c1917]">
                          {response.solver_payload.ready_for_ipm ? "A_eq & b_eq Matrix Standardized" : "Matrix dimensions abnormal"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border border-[#e7e5e4] rounded bg-[#fafaf9] space-y-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-[#57534e]">Phase I Requirement</span>
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          response.solver_payload.requires_phase_one ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {response.solver_payload.requires_phase_one ? "Phase I Required (>= Bound)" : "Direct Simplex Feasible"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                      Notes for Future Solver Integrations & Dual Theory
                    </h4>
                    <div className="bg-[#fafaf9] p-4 border border-[#e7e5e4] rounded-md space-y-2">
                      <ul className="text-xs text-[#57534e] space-y-1.5 list-disc pl-45 leading-relaxed">
                        {response.solver_payload.notes_for_solver_integration.map((note, j) => (
                          <li key={j}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Future OR-Tools Verification Pathway */}
                  <div className="space-y-3 border-t border-[#e7e5e4] pt-5">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1">
                      <Database className="h-4 w-4 text-[#8b2c15]" />
                      OR-Tools pywraplp Verification Pathway
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border border-[#e7e5e4] bg-[#fafaf9] rounded space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[#57534e] block">GLOP Solver Status</span>
                        <p className="text-xs text-[#57534e] leading-relaxed">
                          {response.verification_plan.ortools_compatible 
                            ? "✅ Fully compliant with 'ortools-GLOP' solvers. Variable vectors can load directly as pywraplp coordinates." 
                            : "⚠️ Requires manual custom variable bounds mapping first."}
                        </p>
                      </div>

                      <div className="p-4 border border-[#e7e5e4] bg-[#fafaf9] rounded space-y-15">
                        <span className="text-[10px] uppercase font-mono text-[#57534e] block">Verification Notes</span>
                        <ul className="text-[11px] text-[#57534e] list-disc pl-4 leading-relaxed space-y-1">
                          {response.verification_plan.ortools_notes.map((orn, id) => <li key={id}>{orn}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DEVELOPER JSON PAYLOAD VIEW */}
              {activeResultsTab === 'developer' && (
                <div className="space-y-4" id="layout-json-debuggers">
                  <div className="flex items-center justify-between border-b border-[#e7e5e4] pb-2">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1c1917]">
                        Structured Solver Payload Contract (JSON Output)
                      </h3>
                      <p className="text-[10px] text-[#57534e]">
                        Matches the numerical arrays requested in LPFormulation schemas.
                      </p>
                    </div>

                    <button
                      id="copy-json-btn"
                      onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                      className="px-3.5 py-1.5 border border-[#e7e5e4] hover:bg-[#fafaf9] transition-all rounded text-xs font-semibold text-[#57534e] flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copied JSON!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 border border-[#e7e5e4] bg-[#fafaf9] text-[#1c1917] rounded text-xs overflow-x-auto font-mono leading-relaxed max-h-[450px]">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 md:px-8 border-t border-[#e7e5e4] mt-16 py-10 text-center space-y-2.5 text-[#57534e]" id="app-footer">
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Jishnu Auro Ghosh. Industrial Engineering &bull; Operations Research &bull; Production Systems optimization.
        </p>
        <p className="text-[10px] font-mono tracking-wider">
          Purdue University IE Coursecraft Portfolio Project
        </p>
      </footer>
    </div>
  );
}
