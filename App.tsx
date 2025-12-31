
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Transaction, 
  UserProfile, 
  TransactionType, 
  Category, 
  Budget,
  SavingsGoal
} from './types.ts';
import { INITIAL_PROFILE, CURRENCIES, CATEGORY_METADATA, GOAL_COLORS } from './constants.tsx';
import TransactionList from './components/TransactionList.tsx';
import AdvancedCharts from './components/AdvancedCharts.tsx';
import { 
  Home, 
  PieChart as ChartIcon, 
  Wallet, 
  Plus, 
  Target, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  X,
  CreditCard,
  TrendingUp,
  Settings
} from 'lucide-react';

const App: React.FC = () => {
  // --- Core State ---
  const [activeView, setActiveView] = useState<'home' | 'stats' | 'budgets' | 'profile'>('home');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fintrack_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const [searchTerm, setSearchTerm] = useState("");

  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fintrack_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('fintrack_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('fintrack_goals');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI State ---
  const [activeModal, setActiveModal] = useState<'tx' | 'budget' | 'goal' | 'contribute' | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('fintrack_profile', JSON.stringify(profile));
    localStorage.setItem('fintrack_txs', JSON.stringify(allTransactions));
    localStorage.setItem('fintrack_budgets', JSON.stringify(budgets));
    localStorage.setItem('fintrack_goals', JSON.stringify(goals));
  }, [profile, allTransactions, budgets, goals]);

  // --- Computed Data ---
  const monthTransactions = useMemo(() => {
    return allTransactions.filter(t => t.date.startsWith(monthKey));
  }, [allTransactions, monthKey]);

  const totals = useMemo(() => {
    const income = monthTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: profile.startingBalance + income - expense
    };
  }, [monthTransactions, profile.startingBalance]);

  // --- Handlers ---
  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: formData.get('type') as TransactionType,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as Category,
      date: formData.get('date') as string || new Date().toISOString().split('T')[0],
      description: formData.get('description') as string,
    };
    setAllTransactions([...allTransactions, newTx]);
    setActiveModal(null);
  };

  const handleAddBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as Category;
    const limit = Number(formData.get('limit'));
    setBudgets([...budgets.filter(b => b.category !== category), { category, limit }]);
    setActiveModal(null);
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions(allTransactions.filter(t => t.id !== id));
  };

  const exportData = () => {
    const data = { profile, allTransactions, budgets, goals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinTrack_Data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.profile) setProfile(data.profile);
        if (data.allTransactions) setAllTransactions(data.allTransactions);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        alert('Veriler başarıyla yüklendi!');
      } catch (err) {
        alert('Hatalı dosya formatı.');
      }
    };
    reader.readAsText(file);
  };

  const contributeToGoal = (amount: number) => {
    if (!selectedGoal) return;
    setGoals(goals.map(g => g.id === selectedGoal.id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: amount > 0 ? TransactionType.EXPENSE : TransactionType.INCOME,
      amount: Math.abs(amount),
      category: Category.OTHER,
      date: new Date().toISOString().split('T')[0],
      description: `${selectedGoal.name} Hedefi ${amount > 0 ? 'Aktarımı' : 'İadesi'}`,
    };
    setAllTransactions([...allTransactions, newTx]);
    setActiveModal(null);
  };

  const renderHome = () => (
    <div className="space-y-8 animate-slide-up">
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Cüzdan Özeti</p>
          <h2 className="text-5xl font-black tracking-tighter mb-8">
            {totals.balance.toLocaleString('tr-TR')} <span className="text-xl font-medium opacity-30">{profile.currency}</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Aylık Gelir</p>
              <p className="text-lg font-black text-emerald-400">+{totals.income.toLocaleString()} {profile.currency}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Aylık Harcama</p>
              <p className="text-lg font-black text-rose-400">-{totals.expense.toLocaleString()} {profile.currency}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Plus, label: 'Ekle', color: 'bg-indigo-600', modal: 'tx' },
          { icon: Target, label: 'Hedef', color: 'bg-emerald-600', modal: 'goal' },
          { icon: Wallet, label: 'Bütçe', color: 'bg-orange-600', modal: 'budget' },
          { icon: Download, label: 'Yedek', color: 'bg-slate-800', action: exportData }
        ].map((item, idx) => (
          <button 
            key={idx}
            onClick={() => item.action ? item.action() : setActiveModal(item.modal as any)}
            className="flex flex-col items-center group active:scale-90 transition-all"
          >
            <div className={`w-full aspect-square ${item.color} text-white rounded-[1.8rem] shadow-lg flex items-center justify-center group-hover:-translate-y-1 transition-transform`}>
              <item.icon size={22} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">{item.label}</span>
          </button>
        ))}
      </div>

      {goals.length > 0 && (
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Birikim Hedefleri</h3>
          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
            {goals.map(goal => (
              <div 
                key={goal.id} 
                onClick={() => { setSelectedGoal(goal); setActiveModal('contribute'); }}
                className="min-w-[180px] bg-slate-50 p-6 rounded-[2rem] border border-slate-100 active:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className={`w-10 h-10 ${goal.color} rounded-2xl mb-4 shadow-sm opacity-80 group-hover:scale-110 transition-transform`}></div>
                <p className="text-sm font-black text-slate-800 truncate mb-1">{goal.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mb-3">{goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()}</p>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div className={`h-full ${goal.color} transition-all duration-1000`} style={{ width: `${Math.min((goal.currentAmount/goal.targetAmount)*100, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Son İşlemler</h3>
          <button onClick={() => setActiveView('stats')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">Tümünü Gör</button>
        </div>
        <TransactionList 
          transactions={monthTransactions.slice(0, 10)} 
          currency={profile.currency} 
          onDelete={deleteTransaction} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
      </section>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col relative text-slate-900 select-none">
      <header className="px-8 pt-14 pb-8 flex justify-between items-center sticky top-0 bg-slate-50/90 backdrop-blur-xl z-30">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center space-x-2">
            <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center rotate-3"><CreditCard size={18} /></span>
            <span>FinTrack</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
            {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth()-1); setCurrentMonth(d); }} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all"><ChevronLeft size={18} /></button>
          <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth()+1); setCurrentMonth(d); }} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all"><ChevronRight size={18} /></button>
        </div>
      </header>

      <main className="px-8 flex-1">
        {activeView === 'home' && renderHome()}
        {activeView === 'stats' && (
          <div className="space-y-8 animate-slide-up">
            <AdvancedCharts transactions={monthTransactions} currency={profile.currency} monthKey={monthKey} />
            <TransactionList transactions={monthTransactions} currency={profile.currency} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onDelete={deleteTransaction} />
          </div>
        )}
        {activeView === 'budgets' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tight">Limitler</h2>
              <button onClick={() => setActiveModal('budget')} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95"><Plus size={20} /></button>
            </div>
            {budgets.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-bold">Kategori bazlı limit belirlenmedi.</p>
               </div>
            ) : (
              budgets.map(b => {
                const spent = monthTransactions.filter(t => t.category === b.category && t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
                const ratio = Math.min((spent/b.limit)*100, 100);
                const meta = CATEGORY_METADATA[b.category];
                return (
                  <div key={b.category} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-5">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${meta.color} bg-opacity-10`}>{meta.icon}</div>
                          <div>
                             <p className="text-sm font-black text-slate-800">{b.category}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{spent.toLocaleString()} / {b.limit.toLocaleString()} {profile.currency}</p>
                          </div>
                       </div>
                       <span className={`text-xs font-black ${ratio > 90 ? 'text-rose-500' : 'text-indigo-600'}`}>%{Math.round(ratio)}</span>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                      <div className={`h-full rounded-full transition-all duration-1000 ${ratio > 90 ? 'bg-rose-500' : ratio > 70 ? 'bg-orange-500' : 'bg-indigo-600'}`} style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {activeView === 'profile' && (
          <div className="space-y-6 animate-slide-up pb-24">
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white text-center shadow-2xl relative overflow-hidden">
               <div className="w-20 h-20 bg-white/10 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 text-3xl font-black">{profile.currency}</div>
               <h2 className="text-2xl font-black">Ayarlar</h2>
               <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
             </div>
             
             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Para Birimi</label>
                   <div className="grid grid-cols-4 gap-2">
                      {CURRENCIES.map(c => (
                        <button key={c} onClick={() => setProfile({...profile, currency: c})} className={`py-3 rounded-2xl text-xs font-black border transition-all ${profile.currency === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{c}</button>
                      ))}
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Başlangıç Bakiyesi</label>
                   <input 
                     type="number" 
                     value={profile.startingBalance} 
                     onChange={(e) => setProfile({...profile, startingBalance: Number(e.target.value)})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5"
                   />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={exportData} className="flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 p-6 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                  <Download size={18} /><span>Yedekle</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-800 p-6 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                  <Upload size={18} /><span>Yükle</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-6 pb-8 z-40">
        <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] px-8 py-5 flex justify-between items-center shadow-2xl">
          {[
            { id: 'home', icon: Home },
            { id: 'stats', icon: ChartIcon },
            { id: 'budgets', icon: Wallet },
            { id: 'profile', icon: Settings }
          ].map(btn => (
            <button 
              key={btn.id} 
              onClick={() => setActiveView(btn.id as any)}
              className={`p-3 rounded-2xl transition-all duration-300 ${activeView === btn.id ? 'bg-white text-slate-900 scale-110 shadow-xl' : 'text-white/30 hover:text-white'}`}
            >
              <btn.icon size={22} />
            </button>
          ))}
        </div>
      </nav>

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[4rem] sm:rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black tracking-tighter">{
                activeModal === 'tx' ? 'Yeni İşlem' :
                activeModal === 'budget' ? 'Limit Belirle' :
                activeModal === 'goal' ? 'Hedef Başlat' : 'Para Aktar'
              }</h2>
              <button onClick={() => setActiveModal(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><X size={24} /></button>
            </div>

            {activeModal === 'tx' && (
              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] border border-slate-200">
                  <label className="flex-1">
                    <input type="radio" name="type" value={TransactionType.EXPENSE} defaultChecked className="hidden peer" />
                    <div className="peer-checked:bg-white peer-checked:text-indigo-600 peer-checked:shadow-sm py-4 rounded-[1.2rem] text-center text-xs font-black cursor-pointer transition-all uppercase tracking-widest text-slate-400">Gider</div>
                  </label>
                  <label className="flex-1">
                    <input type="radio" name="type" value={TransactionType.INCOME} className="hidden peer" />
                    <div className="peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm py-4 rounded-[1.2rem] text-center text-xs font-black cursor-pointer transition-all uppercase tracking-widest text-slate-400">Gelir</div>
                  </label>
                </div>
                <div>
                  <input required type="number" name="amount" placeholder="0.00" className="w-full text-center text-6xl font-black text-slate-900 placeholder:text-slate-100 focus:outline-none mb-4" autoFocus />
                  <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{profile.currency}</p>
                </div>
                <div className="space-y-4">
                  <select name="category" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none">
                    {Object.keys(CATEGORY_METADATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                  <input type="text" name="description" placeholder="Açıklama (örn: Starbucks)" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all text-sm uppercase tracking-widest">İşlemi Onayla</button>
              </form>
            )}

            {activeModal === 'contribute' && selectedGoal && (
               <div className="space-y-8">
                  <div className="text-center">
                    <div className={`w-20 h-20 ${selectedGoal.color} rounded-[2rem] mx-auto mb-6 opacity-80 shadow-xl`}></div>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{selectedGoal.name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Bu hedefe ne kadar aktarmak istersin?</p>
                  </div>
                  <div className="space-y-5">
                    <input id="contribute-input" required type="number" placeholder="0.00" className="w-full text-center text-5xl font-black text-slate-900 placeholder:text-slate-100 focus:outline-none" autoFocus />
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => contributeToGoal(Number((document.getElementById('contribute-input') as any).value))} className="bg-emerald-600 text-white py-6 rounded-[2rem] font-black shadow-xl">Para Ekle</button>
                      <button onClick={() => contributeToGoal(-Number((document.getElementById('contribute-input') as any).value))} className="bg-slate-100 text-slate-400 py-6 rounded-[2rem] font-black">Geri Çek</button>
                    </div>
                  </div>
               </div>
            )}

            {activeModal === 'budget' && (
              <form onSubmit={handleAddBudget} className="space-y-6">
                <div className="space-y-5">
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Kategori</label>
                   <select name="category" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none">
                     {Object.keys(CATEGORY_METADATA).filter(c => !c.includes('Maaş')).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Aylık Limit</label>
                   <input required type="number" name="limit" placeholder="Tutar" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black shadow-2xl">Bütçeyi Onayla</button>
              </form>
            )}

            {activeModal === 'goal' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setGoals([...goals, { 
                  id: crypto.randomUUID(), name: fd.get('name') as string, 
                  targetAmount: Number(fd.get('target')), currentAmount: 0, 
                  color: GOAL_COLORS[goals.length % GOAL_COLORS.length] 
                }]);
                setActiveModal(null);
              }} className="space-y-6">
                <div className="space-y-4">
                  <input required name="name" placeholder="Hedef Adı (örn: Tatil)" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                  <input required type="number" name="target" placeholder="Hedeflenen Tutar" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black shadow-2xl">Hedefi Başlat</button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .animate-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .slide-in-from-bottom-full { animation: slideUpFull 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUpFull { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
