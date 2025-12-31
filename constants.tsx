
import React from 'react';

export const CURRENCIES = ['TL', 'USD', 'EUR', 'GBP'];

export const CATEGORY_METADATA: Record<string, { color: string, icon: string }> = {
  'Yemek': { color: 'bg-orange-500', icon: '🍴' },
  'Ulaşım': { color: 'bg-blue-500', icon: '🚗' },
  'Alışveriş': { color: 'bg-pink-500', icon: '🛍️' },
  'Eğlence': { color: 'bg-purple-500', icon: '🎬' },
  'Sağlık': { color: 'bg-red-500', icon: '🏥' },
  'Fatura': { color: 'bg-yellow-500', icon: '⚡' },
  'Diğer': { color: 'bg-slate-500', icon: '📦' },
  'Maaş': { color: 'bg-emerald-500', icon: '💰' },
  'Freelance': { color: 'bg-teal-500', icon: '💻' },
  'Hediye/Diğer': { color: 'bg-cyan-500', icon: '🎁' },
};

export const INITIAL_PROFILE = {
  currency: 'TL',
  startingBalance: 0,
};

export const GOAL_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'
];
