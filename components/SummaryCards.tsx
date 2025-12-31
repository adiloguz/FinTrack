
import React from 'react';
import { UserProfile } from '../types';

interface SummaryCardsProps {
  income: number;
  expense: number;
  subs: number;
  balance: number;
  profile: UserProfile;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ income, expense, subs, balance, profile }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Durum</span>
        <div className="mt-1">
          <span className={`text-xl font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            {balance.toLocaleString('tr-TR')} {profile.currency}
          </span>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Abonelikler</span>
        <div className="mt-1">
          <span className="text-xl font-bold text-orange-500">
            {subs.toLocaleString('tr-TR')} {profile.currency}
          </span>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
        <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Gelir</span>
        <div className="mt-1">
          <span className="text-xl font-bold text-green-700">
            +{income.toLocaleString('tr-TR')} {profile.currency}
          </span>
        </div>
      </div>
      <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
        <span className="text-xs font-medium text-red-600 uppercase tracking-wider">Harcama</span>
        <div className="mt-1">
          <span className="text-xl font-bold text-red-700">
            -{expense.toLocaleString('tr-TR')} {profile.currency}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
