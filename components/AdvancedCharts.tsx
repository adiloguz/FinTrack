
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { Transaction, TransactionType } from '../types.ts';

interface Props {
  transactions: Transaction[];
  currency: string;
  monthKey: string;
}

const COLORS = ['#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#64748b'];

const AdvancedCharts: React.FC<Props> = ({ transactions, currency, monthKey }) => {
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  // Daily Trend Data
  const daysInMonth = new Date(Number(monthKey.split('-')[0]), Number(monthKey.split('-')[1]), 0).getDate();
  const trendData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const fullDate = `${monthKey}-${day}`;
    const amount = transactions
      .filter(t => t.date === fullDate && t.type === TransactionType.EXPENSE)
      .reduce((s, t) => s + t.amount, 0);
    return { day: i + 1, amount };
  });

  const comparisonData = [
    {
      name: 'Nakit Akışı',
      Gelir: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      Gider: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] text-center">Harcama Trendi</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, 'Harcama']}
              />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] text-center">Özet Kıyas</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="Gelir" fill="#10b981" radius={[0, 10, 10, 0]} barSize={25} />
                <Bar dataKey="Gider" fill="#ef4444" radius={[0, 10, 10, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {expenseData.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] text-center">Kategori Bazlı</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: number) => [`${value.toLocaleString('tr-TR')} ${currency}`, 'Tutar']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedCharts;
