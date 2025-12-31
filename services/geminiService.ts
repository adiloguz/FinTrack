
import { GoogleGenAI } from "@google/genai";
import { Transaction, Subscription, UserProfile } from "../types";

// Guidelines: Always use a named parameter for the API key and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (
  month: string,
  transactions: Transaction[],
  subscriptions: Subscription[],
  profile: UserProfile,
  totalIncome: number,
  totalExpense: number
) => {
  // Guidelines: The API key's availability is handled externally and assumed to be present.
  const prompt = `
    Kullanıcının ${month} ayı için finansal özetini analiz et ve Türkçe olarak 2-3 cümlelik çok kısa, eyleme dönük bir tavsiye ver.
    Veriler:
    - Başlangıç Bakiyesi: ${profile.startingBalance} ${profile.currency}
    - Toplam Gelir: ${totalIncome} ${profile.currency}
    - Toplam Harcama: ${totalExpense} ${profile.currency}
    - Aktif Abonelik Sayısı: ${subscriptions.filter(s => s.isActive).length}
    - Harcama Detayları: ${JSON.stringify(transactions.filter(t => t.type === 'EXPENSE').map(t => ({ c: t.category, a: t.amount })))}
    
    Lütfen sade, dostça ve motive edici bir ton kullan. Harcamalar gelirden fazlaysa uyar, tasarruf alanı varsa belirt.
  `;

  try {
    // Guidelines: Use ai.models.generateContent with both model name and prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    });
    // Guidelines: Access the generated text directly from the .text property of the response object.
    return response.text || "Şu an analiz yapılamıyor.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Finansal asistanınız şu an meşgul.";
  }
};
