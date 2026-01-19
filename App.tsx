
import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppView, MealResult, UserProfile } from './types';
import { generateMealPlan, generateMealImage, readSteps, stopAudio } from './services/geminiService';
import Charts from './components/Charts';
import { 
  Utensils, Camera, BookOpen, Loader2, Play, History, X, 
  ChefHat, User, Share2, 
  Settings, Zap, Award, Filter, ArrowRight, Plus, CheckCircle2, Volume2, Image as ImageIcon,
  Heart, Sparkles, RotateCw, Trash2, Square
} from 'lucide-react';

const COMMON_ALLERGIES = ['Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Shellfish', 'Soy', 'Eggs', 'Fish'];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.RECIPE_GEN);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [input, setInput] = useState('');
  const [isMultiCourse, setIsMultiCourse] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<MealResult | null>(null);
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [history, setHistory] = useState<MealResult[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // Active pantry state for interactive editing
  const [activePantry, setActivePantry] = useState<string[]>([]);
  const [newPantryItem, setNewPantryItem] = useState('');

  const [profile, setProfile] = useState<UserProfile>({
    skillLevel: 'Intermediate',
    dietaryRestrictions: [],
    flavorDNA: { sweet: 40, salty: 60, sour: 30, bitter: 20, umami: 80, spicy: 50 }
  });
  const [customAllergy, setCustomAllergy] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoTTS: true,
    highQualityImages: true
  });

  // Sync activePantry with result when it changes
  useEffect(() => {
    if (result) {
      setActivePantry(result.identifiedIngredients);
    }
  }, [result]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleAudio = () => {
    if (isAudioPlaying) {
      stopAudio();
      setIsAudioPlaying(false);
    } else if (result) {
      const textToRead = result.courses.map(c => `${c.name}. ${c.instructions.join('. ')}`).join('. ');
      setIsAudioPlaying(true);
      readSteps(textToRead, () => setIsAudioPlaying(false));
    }
  };

  const handleGenerate = async (refining: boolean = false) => {
    if (!input && !image && !refining) return;
    setState(AppState.ANALYZING);
    setIsAudioPlaying(false); // Reset audio state on new generation
    stopAudio();

    try {
      const base64 = refining ? null : (image?.split(',')[1] || null);
      
      // If refining, we use the activePantry tags as our primary input
      const refinedInput = refining 
        ? `Use specifically these ingredients: ${activePantry.join(', ')}. ${input}`
        : input;

      const res = await generateMealPlan(refinedInput, profile, base64 as any, isMultiCourse);
      setResult(res);
      const img = await generateMealImage(res.title, res.courses[0].summary);
      setMealImage(img);
      setHistory(prev => [res, ...prev].slice(0, 10));
      setState(AppState.RESULT);
      
      if (settings.autoTTS) {
        const textToRead = res.courses.map(c => `${c.name}. ${c.instructions.join('. ')}`).join('. ');
        setIsAudioPlaying(true);
        readSteps(textToRead, () => setIsAudioPlaying(false));
      }
    } catch (e) {
      console.error(e);
      setState(AppState.ERROR);
    }
  };

  const removeFromPantry = (index: number) => {
    setActivePantry(prev => prev.filter((_, i) => i !== index));
  };

  const addToPantry = () => {
    if (newPantryItem.trim()) {
      setActivePantry(prev => [...prev, newPantryItem.trim()]);
      setNewPantryItem('');
    }
  };

  const shareRecipe = async () => {
    if (!result) return;
    const shareData = {
      title: `BiteWise: ${result.title}`,
      text: `Generated this meal via BiteWise AI: ${result.title}. Check it out!`,
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Recipe details copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const toggleAllergy = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(allergy)
        ? prev.dietaryRestrictions.filter(a => a !== allergy)
        : [...prev.dietaryRestrictions, allergy]
    }));
  };

  const addCustomAllergy = () => {
    if (customAllergy && !profile.dietaryRestrictions.includes(customAllergy)) {
      setProfile(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, customAllergy]
      }));
      setCustomAllergy('');
    }
  };

  const updateFlavorDNA = (key: keyof UserProfile['flavorDNA'], val: number) => {
    setProfile(prev => ({
      ...prev,
      flavorDNA: { ...prev.flavorDNA, [key]: val }
    }));
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center">
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-full flex gap-12 z-50 shadow-2xl">
        <button onClick={() => setView(AppView.RECIPE_GEN)} className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${view === AppView.RECIPE_GEN ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-500 hover:text-slate-300'}`}>
          <Utensils className="w-6 h-6" />
          {view === AppView.RECIPE_GEN && <span className="text-xs font-black uppercase tracking-widest">Kitchen</span>}
        </button>
        <button onClick={() => setView(AppView.PROFILE)} className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${view === AppView.PROFILE ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-500 hover:text-slate-300'}`}>
          <User className="w-6 h-6" />
          {view === AppView.PROFILE && <span className="text-xs font-black uppercase tracking-widest">Profile</span>}
        </button>
      </nav>

      <header className="w-full max-w-6xl px-10 py-10 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center"><ChefHat className="text-white w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Bite<span className="text-amber-500">Wise</span></h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Master Kitchen Engine</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right hidden sm:block">
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Skill Mode</p>
             <p className="text-xs font-black text-amber-500 uppercase">{profile.skillLevel}</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl px-4 md:px-10 py-10 pb-40 flex-grow">
        {view === AppView.RECIPE_GEN && (
          <div className="space-y-12">
            {state === AppState.IDLE || state === AppState.ERROR ? (
              <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-6">
                  <div className="space-y-4 text-left">
                    <h2 className="text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter">
                      Plan your <span className="text-amber-500">Culinary<br/>Experience.</span>
                    </h2>
                    <p className="text-slate-500 text-lg max-w-md leading-relaxed font-medium">
                      Analyze pantry photos with high-fidelity vision and design chef-grade meals.
                    </p>
                  </div>

                  <div className="bg-slate-900/30 p-8 md:p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Inputs & Constraints</label>
                        <button onClick={() => setIsMultiCourse(!isMultiCourse)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isMultiCourse ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Zap className="w-3 h-3" /> Multi-Course Mode
                        </button>
                      </div>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Scan or type what you have... AI will audit your visual pantry items."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl p-6 h-32 text-lg font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div onClick={() => document.getElementById('camera-input')?.click()} className="h-44 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all overflow-hidden group">
                        {image ? <img src={image} className="h-full w-full object-cover" /> : <>
                          <Camera className="text-slate-500 w-10 h-10 group-hover:text-amber-500 transition-colors" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Analyze Pantry View</span>
                        </>}
                        <input id="camera-input" type="file" className="hidden" onChange={handleUpload} />
                      </div>
                      <button onClick={() => handleGenerate(false)} className="h-44 bg-amber-600 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 shadow-2xl shadow-amber-600/20 hover:scale-[1.02] active:scale-95 transition-all group">
                        <ArrowRight className="w-12 h-12 group-hover:translate-x-2 transition-transform" />
                        <span className="text-xl font-black uppercase tracking-widest">Audit & Orchestrate</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2"><History className="w-4 h-4" /> Lab History</h3>
                   <div className="space-y-4">
                     {history.length > 0 ? history.map((h, i) => (
                       <div key={i} onClick={() => {setResult(h); setState(AppState.RESULT);}} className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex gap-4 items-center cursor-pointer hover:bg-white/10 transition-all group">
                          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                            <Utensils className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate text-slate-200">{h.title}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{h.totalTime} • {h.courses.length} courses</p>
                          </div>
                       </div>
                     )) : (
                       <div className="p-12 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-600 gap-3 text-center">
                         <BookOpen className="w-8 h-8 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-[0.3em]">No experiments yet</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            ) : state === AppState.ANALYZING ? (
              <div className="flex flex-col items-center justify-center py-40 gap-10 animate-in zoom-in-95">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500 blur-[80px] opacity-20 animate-pulse"></div>
                  <Loader2 className="w-24 h-24 text-amber-500 animate-spin relative" />
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter">Performing High-Fidelity Audit...</h3>
                   <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Identifying Textures • Designing Masterpiece</p>
                </div>
              </div>
            ) : result && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div className="space-y-3">
                    <button onClick={() => {setState(AppState.IDLE); setMealImage(null); stopAudio(); setIsAudioPlaying(false);}} className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-amber-500 transition-colors"><X className="w-4 h-4" /> Reset Experiment</button>
                    <h2 className="text-6xl md:text-7xl font-black tracking-tighter uppercase leading-none">{result.title}</h2>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={shareRecipe} className="w-14 h-14 glass rounded-[1.25rem] flex items-center justify-center hover:bg-white/10 transition-all shadow-xl"><Share2 className="w-6 h-6 text-amber-500" /></button>
                    <button onClick={toggleAudio} className={`h-14 px-8 rounded-[1.25rem] flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all ${isAudioPlaying ? 'bg-rose-600 shadow-rose-600/20' : 'bg-amber-600 shadow-amber-600/20'}`}>
                      {isAudioPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      {isAudioPlaying ? 'Stop Audio' : 'Play Audio'}
                    </button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-14">
                     {/* Pantry Audit Section */}
                     <div className="bg-slate-900/30 p-8 rounded-[3rem] border border-white/5 space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Interactive Pantry Audit</h3>
                          <button 
                            onClick={() => handleGenerate(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600/10 text-amber-500 text-[10px] font-black uppercase rounded-xl border border-amber-600/20 hover:bg-amber-600 hover:text-white transition-all shadow-lg shadow-amber-600/10 group"
                          >
                            <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                            Refine & Re-Orchestrate
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {activePantry.map((item, idx) => (
                             <div key={idx} className="group relative flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest shadow-lg hover:border-amber-500/30 transition-all">
                                <span>{item}</span>
                                <button 
                                  onClick={() => removeFromPantry(idx)}
                                  className="text-slate-600 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                           ))}
                           <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 focus-within:border-amber-500/50 transition-all">
                              <input 
                                type="text"
                                value={newPantryItem}
                                onChange={(e) => setNewPantryItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addToPantry()}
                                placeholder="Add ingredient..."
                                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-slate-300 w-24 placeholder:text-slate-600"
                              />
                              <button onClick={addToPantry} className="text-slate-500 hover:text-amber-500"><Plus className="w-4 h-4" /></button>
                           </div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic leading-relaxed">
                          AI identifies shapes and textures. Remove errors or add missing items to refine the recipe intelligence.
                        </p>
                     </div>

                     <div className="rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 aspect-video relative group">
                        {mealImage ? <img src={mealImage} className="w-full h-full object-cover" /> : (
                           <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-600">
                              <Loader2 className="w-10 h-10 animate-spin" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Generating Plate Visual...</span>
                           </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-8 md:p-14">
                           <div className="glass p-8 md:p-10 rounded-[2.5rem] max-w-xl border border-white/10">
                              <p className="text-amber-500 font-black text-[10px] uppercase tracking-[0.3em] mb-3">{result.courses[0].type}</p>
                              <p className="text-white text-xl md:text-2xl font-bold leading-tight italic">"{result.courses[0].summary}"</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-12">
                        {result.courses.map((course, idx) => (
                          <div key={idx} className="bg-slate-900/30 p-8 md:p-12 rounded-[3.5rem] border border-white/5 space-y-10">
                             <div className="flex justify-between items-start border-b border-white/5 pb-8">
                                <div>
                                   <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2">{course.type}</p>
                                   <h4 className="text-4xl font-black uppercase tracking-tight">{course.name}</h4>
                                </div>
                                <div className="text-right glass px-6 py-4 rounded-[1.5rem] border border-white/5">
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Perfect Pairing</p>
                                   <p className="text-sm font-black text-slate-200 italic">{course.winePairing}</p>
                                </div>
                             </div>

                             <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><BookOpen className="w-5 h-5 text-amber-500" /> Ingredients</h5>
                                   <ul className="space-y-4">
                                      {course.ingredients.map((ing, i) => (
                                        <li key={i} className="flex justify-between text-base border-b border-white/5 pb-3 group">
                                           <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{ing.item}</span>
                                           <span className="text-amber-500 font-black tracking-tight">{ing.amount}</span>
                                        </li>
                                      ))}
                                   </ul>
                                </div>
                                <div className="space-y-8">
                                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><ChefHat className="w-5 h-5 text-amber-500" /> Preparation</h5>
                                   <ul className="space-y-6">
                                      {course.instructions.map((step, i) => (
                                        <li key={i} className="flex gap-5 group">
                                           <span className="w-7 h-7 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center text-[11px] font-black flex-shrink-0 border border-amber-600/20 group-hover:bg-amber-600 group-hover:text-white transition-all">{i+1}</span>
                                           <p className="text-sm text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{step}</p>
                                        </li>
                                      ))}
                                   </ul>
                                </div>
                             </div>
                             <div className="p-6 bg-slate-950/50 rounded-[2rem] border border-white/5 flex items-center gap-6 shadow-inner">
                                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center border border-amber-600/20">
                                  <Award className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Chef Advice: {profile.skillLevel} Mastery</p>
                                   <p className="text-sm text-slate-300 italic font-medium">{course.difficultyNotes}</p>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="lg:col-span-4 space-y-10">
                     <div className="sticky top-10 space-y-10">
                        <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-white/5 shadow-xl">
                           <Charts scores={result.macros} />
                        </div>
                        <div className="p-8 bg-amber-600/5 rounded-[2.5rem] border border-amber-600/10 flex flex-col items-center gap-6 text-center">
                           <Heart className="w-10 h-10 text-amber-500 animate-pulse" />
                           <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-relaxed">Recipe matched to your Flavor DNA and Restrictions</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === AppView.PROFILE && (
          <div className="space-y-12 animate-in slide-in-from-right-10 duration-500 max-w-5xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                  <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Chef <span className="text-amber-500">Profile.</span></h2>
                  <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">Personalize your culinary intelligence</p>
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${showSettings ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white'}`}>
                  <Settings className="w-4 h-4" /> Global Settings
                </button>
             </div>

             {showSettings && (
               <div className="bg-amber-600/5 p-10 rounded-[3rem] border border-amber-600/20 grid sm:grid-cols-2 gap-10 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between p-6 bg-slate-950 rounded-3xl border border-white/5 group transition-all hover:border-amber-500/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-amber-500/10"><Volume2 className="w-6 h-6 text-amber-500" /></div>
                      <span className="text-xs font-black uppercase tracking-widest">Voice Guide</span>
                    </div>
                    <button onClick={() => setSettings({...settings, autoTTS: !settings.autoTTS})} className={`w-14 h-7 rounded-full transition-all relative ${settings.autoTTS ? 'bg-amber-600' : 'bg-slate-800'}`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${settings.autoTTS ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-950 rounded-3xl border border-white/5 group transition-all hover:border-amber-500/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-amber-500/10"><ImageIcon className="w-6 h-6 text-amber-500" /></div>
                      <span className="text-xs font-black uppercase tracking-widest">Ultra HD Visuals</span>
                    </div>
                    <button onClick={() => setSettings({...settings, highQualityImages: !settings.highQualityImages})} className={`w-14 h-7 rounded-full transition-all relative ${settings.highQualityImages ? 'bg-amber-600' : 'bg-slate-800'}`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${settings.highQualityImages ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
               </div>
             )}

             <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                   <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-white/5 space-y-8">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 border-b border-white/5 pb-4"><Award className="w-5 h-5 text-amber-500" /> Experience Level</h3>
                      <div className="grid grid-cols-3 gap-4">
                         {['Beginner', 'Intermediate', 'Expert'].map((lvl) => (
                           <button key={lvl} onClick={() => setProfile({...profile, skillLevel: lvl as any})} className={`py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${profile.skillLevel === lvl ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/30 ring-2 ring-amber-400/50' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{lvl}</button>
                         ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">AI adjusts recipe terminology and technical guidance based on your selection.</p>
                   </div>

                   <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-white/5 space-y-8">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 border-b border-white/5 pb-4"><Filter className="w-5 h-5 text-amber-500" /> Dietary Intelligence</h3>
                      <div className="space-y-8">
                        <div className="flex flex-wrap gap-3">
                           {COMMON_ALLERGIES.map((diet) => (
                             <button 
                              key={diet} 
                              onClick={() => toggleAllergy(diet)}
                              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${profile.dietaryRestrictions.includes(diet) ? 'bg-amber-600/10 text-amber-500 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-800 text-slate-500 border-transparent hover:border-slate-700'}`}>
                                {profile.dietaryRestrictions.includes(diet) && <CheckCircle2 className="w-4 h-4" />}
                                {diet}
                             </button>
                           ))}
                        </div>
                        
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            value={customAllergy}
                            onChange={(e) => setCustomAllergy(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy()}
                            placeholder="Add custom restriction..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-700"
                          />
                          <button onClick={addCustomAllergy} className="bg-amber-600/10 border border-amber-600/20 p-4 rounded-2xl hover:bg-amber-600 hover:text-white transition-all text-amber-500 shadow-lg">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>

                        {profile.dietaryRestrictions.filter(d => !COMMON_ALLERGIES.includes(d)).length > 0 && (
                          <div className="pt-6 border-t border-white/5 space-y-4">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Custom Restrictions:</p>
                            <div className="flex flex-wrap gap-3">
                              {profile.dietaryRestrictions.filter(d => !COMMON_ALLERGIES.includes(d)).map(d => (
                                <span key={d} className="px-4 py-2 bg-amber-600/5 text-amber-500 rounded-xl text-[10px] font-black uppercase flex items-center gap-3 border border-amber-500/10">
                                  {d}
                                  <X className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleAllergy(d)} />
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-white/5 space-y-10">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 border-b border-white/5 pb-4"><Heart className="w-5 h-5 text-amber-500" /> My Flavor DNA</h3>
                   <div className="space-y-10">
                      {Object.entries(profile.flavorDNA).map(([key, val]) => (
                        <div key={key} className="space-y-4">
                           <div className="flex justify-between text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
                             <span>{key} Intensity</span>
                             <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg">{val}%</span>
                           </div>
                           <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={val} 
                              onChange={(e) => updateFlavorDNA(key as any, parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                           />
                        </div>
                      ))}
                   </div>
                   <div className="p-8 bg-amber-600/5 rounded-[2.5rem] border border-amber-600/10 flex items-start gap-6 shadow-xl">
                      <Zap className="w-8 h-8 text-amber-500 fill-current opacity-40 flex-shrink-0 mt-1" />
                      <div className="space-y-2">
                        <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Synthetic Palate Alignment</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium italic">Adjusting these sliders updates your digital palate. Our engine will prioritize textures and spice levels that match these weights.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-6xl p-10 mt-auto border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">
         <p>© 2024 BiteWise Culinary Intelligence Engine</p>
         <div className="flex gap-12">
            <a href="#" className="hover:text-amber-500 transition-all">Security</a>
            <a href="#" className="hover:text-amber-500 transition-all">API V3.0</a>
            <a href="#" className="hover:text-amber-500 transition-all">Privacy</a>
         </div>
      </footer>
    </div>
  );
};

export default App;
