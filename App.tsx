
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Transaction, 
  Subscription, 
  UserProfile, 
  TransactionType, 
  Category, 
  SubscriptionFrequency,
  Budget,
  SavingsGoal
} from './types';
import { INITIAL_PROFILE, CURRENCIES, CATEGORY_METADATA, GOAL_COLORS } from './constants';
import TransactionList from './components/TransactionList';
import AdvancedCharts from './components/AdvancedCharts';
import { 
  Home, 
  PieChart as ChartIcon, 
  Wallet, 
  User, 
  Plus, 
  Target, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  X,
  CreditCard,
  Bell,
  TrendingUp,
  ArrowRightLeft
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [activeView, setActiveView] = useState<'home' | 'stats' | 'budgets' | 'profile'>('home');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fin_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const [searchTerm, setSearchTerm] = useState("");

  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('fin_subscriptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('fin_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('fin_goals');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals
  const [activeModal, setActiveModal] = useState<'tx' | 'sub' | 'budget' | 'goal' | 'contribute' | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('fin_profile', JSON.stringify(profile));
    localStorage.setItem('fin_transactions', JSON.stringify(allTransactions));
    localStorage.setItem('fin_subscriptions', JSON.stringify(subscriptions));
    localStorage.setItem('fin_budgets', JSON.stringify(budgets));
    localStorage.setItem('fin_goals', JSON.stringify(goals));
  }, [profile, allTransactions, subscriptions, budgets, goals]);

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

    const activeSubs = subscriptions.filter(s => s.isActive);
    const subsTotal = activeSubs.reduce((sum, s) => {
      return sum + (s.frequency === SubscriptionFrequency.YEARLY ? s.amount / 12 : s.amount);
    }, 0);

    return {
      income,
      expense,
      subs: subsTotal,
      balance: profile.startingBalance + income - expense - subsTotal
    };
  }, [monthTransactions, subscriptions, profile.startingBalance]);

  // Actions
  const deleteTransaction = (id: string) => {
    setAllTransactions(allTransactions.filter(t => t.id !== id));
  };

  const contributeToGoal = (amount: number) => {
    if (!selectedGoal) return;
    setGoals(goals.map(g => g.id === selectedGoal.id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    
    // Also add an internal transaction to track the outflow from balance
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: TransactionType.EXPENSE,
      amount: Math.abs(amount),
      category: Category.OTHER,
      date: new Date().toISOString().split('T')[0],
      description: `${selectedGoal.name} Hedefine Aktarım`,
    };
    setAllTransactions([...allTransactions, newTx]);
    setActiveModal(null);
  };

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

  const exportData = () => {
    const data = { profile, transactions: allTransactions, subscriptions, budgets, goals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinTrack_Yedek.json`;
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
        if (data.transactions) setAllTransactions(data.transactions);
        if (data.subscriptions) setSubscriptions(data.subscriptions);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        alert('Veriler başarıyla içe aktarıldı.');
      } catch (err) { alert('Hata: Geçersiz dosya formatı.'); }
    };
    reader.readAsText(file);
  };

  const renderHome = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Header Summary */}
      <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.25em] mb-1 opacity-70">Toplam Bakiyen</p>
              <h2 className="text-5xl font-black tracking-tight">
                {totals.balance.toLocaleString('tr-TR')} <span className="text-2xl font-medium opacity-30">{profile.currency}</span>
              </h2>
            </div>
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
              <TrendingUp className="text-indigo-400" size={28} />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-indigo-200/60 font-bold text-xs bg-white/5 rounded-full px-5 py-3 w-fit border border-white/5">
            <Bell size={14} className="animate-pulse" />
            <span>{subscriptions.filter(s => s.isActive).length} aktif abonelik mevcut</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:scale-110 transition-transform duration-1000"></div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Plus, label: 'İşlem', color: 'bg-indigo-600', modal: 'tx' },
          { icon: Target, label: 'Hedef', color: 'bg-emerald-600', modal: 'goal' },
          { icon: Wallet, label: 'Bütçe', color: 'bg-orange-600', modal: 'budget' },
          { icon: ArrowRightLeft, label: 'Abonelik', color: 'bg-purple-600', modal: 'sub' }
        ].map(item => (
          <button 
            key={item.label}
            onClick={() => setActiveModal(item.modal as any)}
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className={`w-full aspect-square ${item.color} text-white rounded-[2rem] shadow-lg flex items-center justify-center group-hover:-translate-y-1 transition-transform`}>
              <item.icon size={24} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Savings Progress */}
      {goals.length > 0 && (
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Birikim Durumu</h3>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
            {goals.map(goal => (
              <div 
                key={goal.id} 
                onClick={() => { setSelectedGoal(goal); setActiveModal('contribute'); }}
                className="min-w-[200px] bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className={`w-10 h-10 ${goal.color} rounded-2xl shadow-lg opacity-80`}></div>
                  <span className="text-[10px] font-black text-slate-300">%{Math.round((goal.currentAmount/goal.targetAmount)*100)}</span>
                </div>
                <p className="text-sm font-black text-slate-800 mb-2 truncate">{goal.name}</p>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div className={`h-full ${goal.color} transition-all duration-1000`} style={{ width: `${(goal.currentAmount/goal.targetAmount)*100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Feed */}
      <section className="pb-10">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Son Hareketler</h3>
          <button onClick={() => setActiveView('stats')} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">Tümü</button>
        </div>
        <TransactionList 
          transactions={monthTransactions} 
          currency={profile.currency} 
          onDelete={deleteTransaction} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
        />
      </section>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col relative overflow-x-hidden text-slate-900 select-none">
      {/* Top Navbar */}
      <header className="px-8 pt-14 pb-8 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-xl z-30 border-b border-transparent group transition-all duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">FinTrack</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => { const p = new Date(currentMonth); p.setMonth(p.getMonth()-1); setCurrentMonth(p); }} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all"><ChevronLeft size={18} /></button>
          <button onClick={() => { const n = new Date(currentMonth); n.setMonth(n.getMonth()+1); setCurrentMonth(n); }} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all"><ChevronRight size={18} /></button>
        </div>
      </header>

      {/* Content Area */}
      <main className="px-8 flex-1">
        {activeView === 'home' && renderHome()}
        {activeView === 'stats' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
             <AdvancedCharts transactions={monthTransactions} currency={profile.currency} monthKey={monthKey} />
             <TransactionList transactions={monthTransactions} currency={profile.currency} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onDelete={deleteTransaction} />
          </div>
        )}
        {activeView === 'budgets' && (
           <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 pb-20">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tight">Bütçe Yönetimi</h2>
                <button onClick={() => setActiveModal('budget')} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl"><Plus size={20} /></button>
              </div>
              {budgets.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-bold">Kategori bazlı bütçe belirlemediniz.</p>
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
                        <div className={`h-full rounded-full transition-all duration-1000 ${ratio > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${ratio}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        )}
        {activeView === 'profile' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500 pb-24">
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white text-center shadow-2xl">
               <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-3xl font-black">{profile.currency}</div>
               <h2 className="text-2xl font-black">Profil Ayarları</h2>
             </div>
             <div className="space-y-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Para Birimi</label>
                   <div className="grid grid-cols-4 gap-2">
                      {CURRENCIES.map(c => (
                        <button key={c} onClick={() => setProfile({...profile, currency: c})} className={`py-3 rounded-2xl text-xs font-black border transition-all ${profile.currency === c ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{c}</button>
                      ))}
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                   <button onClick={exportData} className="flex items-center space-x-3 text-xs font-black uppercase tracking-widest text-indigo-600"><Download size={18} /><span>Yedekle</span></button>
                   <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-3 text-xs font-black uppercase tracking-widest text-slate-800"><Upload size={18} /><span>İçe Aktar</span></button>
                   <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Global Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-6 pb-8 z-40">
        <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] px-8 py-5 flex justify-between items-center shadow-2xl">
          {[
            { id: 'home', icon: Home },
            { id: 'stats', icon: ChartIcon },
            { id: 'budgets', icon: Wallet },
            { id: 'profile', icon: User }
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

      {/* Unified Modal System */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[4rem] sm:rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black tracking-tight">{
                activeModal === 'tx' ? 'Yeni İşlem' :
                activeModal === 'budget' ? 'Limit Belirle' :
                activeModal === 'goal' ? 'Hedef Başlat' :
                activeModal === 'contribute' ? 'Para Aktar' : 'Abonelik'
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
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all text-sm uppercase tracking-widest">İşlemi Kaydet</button>
              </form>
            )}

            {activeModal === 'contribute' && selectedGoal && (
               <div className="space-y-8">
                  <div className="text-center">
                    <div className={`w-20 h-20 ${selectedGoal.color} rounded-3xl mx-auto mb-4 opacity-80 shadow-xl`}></div>
                    <p className="text-xl font-black text-slate-800">{selectedGoal.name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Bakiyenden bu hedefe ne kadar aktarmak istersin?</p>
                  </div>
                  <div className="space-y-4">
                    <input id="contribution-amt" required type="number" placeholder="0.00" className="w-full text-center text-5xl font-black text-slate-900 placeholder:text-slate-100 focus:outline-none" autoFocus />
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => contributeToGoal(Number((document.getElementById('contribution-amt') as any).value))} className="bg-emerald-600 text-white py-6 rounded-[2rem] font-black shadow-xl">Para Ekle</button>
                      <button onClick={() => contributeToGoal(-Number((document.getElementById('contribution-amt') as any).value))} className="bg-slate-100 text-slate-400 py-6 rounded-[2rem] font-black">Geri Çek</button>
                    </div>
                  </div>
               </div>
            )}
            
            {activeModal === 'budget' && (
              <form onSubmit={handleAddBudget} className="space-y-6">
                <div className="space-y-5">
                   <select name="category" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none">
                     {Object.keys(CATEGORY_METADATA).filter(c => !c.includes('Maaş')).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
                   <input required type="number" name="limit" placeholder="Aylık Limit Tutarı" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-2xl">Bütçeyi Onayla</button>
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
                <input required name="name" placeholder="Hedefin nedir? (örn: Ev)" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                <input required type="number" name="target" placeholder="Hedef Tutar" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-black outline-none" />
                <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black shadow-2xl">Başlat</button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .slide-in-from-bottom-full { animation-name: slide-in-bottom-full; }
        @keyframes slide-in-bottom-full { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slide-in-bottom { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(1rem); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-in-left { from { opacity: 0; transform: translateX(-1rem); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .slide-in-from-bottom-4 { animation-name: slide-in-bottom; }
        .slide-in-from-right-4 { animation-name: slide-in-right; }
        .slide-in-from-left-4 { animation-name: slide-in-left; }
        .zoom-in-95 { animation-name: zoom-in; }
      `}</style>
    </div>
  );
};

export default App;
