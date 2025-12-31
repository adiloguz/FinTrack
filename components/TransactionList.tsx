import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_METADATA } from '../constants';
import { Trash2, Search } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
  onDelete?: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, currency, onDelete, searchTerm, setSearchTerm }) => {
  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
           <Search size={32} />
        </div>
        <p className="text-slate-400 text-sm font-bold">İşlem geçmişi bulunmuyor.</p>
      </div>
    );
  }

  // Group by date
  const grouped = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc, curr) => {
      const date = curr.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-8 pb-10">
      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="İşlemlerde ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none shadow-sm placeholder:text-slate-300"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sonuç bulunamadı</p>
        </div>
      ) : (
        /* Explicitly cast to ensure 'items' is treated as Transaction[] for .map() availability */
        (Object.entries(grouped) as [string, Transaction[]][]).map(([date, items]) => (
          <div key={date} className="animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-[10px] font-black text-slate-300 mb-4 px-2 uppercase tracking-[0.25em]">
              {new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </h3>
            <div className="space-y-3">
              {items.map((t, index) => {
                const meta = CATEGORY_METADATA[t.category] || CATEGORY_METADATA['Diğer'];
                return (
                  <div 
                    key={t.id} 
                    className="bg-white p-5 rounded-[2.2rem] border border-slate-50 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-all group overflow-hidden relative"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-center space-x-4 z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${meta.color} bg-opacity-10 shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{t.description || t.category}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{t.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 z-10">
                      <div className={`text-sm font-black tabular-nums ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-800'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString('tr-TR')} {currency}
                      </div>
                      {onDelete && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                          className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;