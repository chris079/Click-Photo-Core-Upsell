import { AbandonedCheckout, AccessRecord, PurchaseRecord } from '../types';
import { fetchSingle, insertRow, isSupabaseConfigured } from './supabaseClient';

const accessTable = import.meta.env.VITE_SUPABASE_ACCESS_TABLE || 'access_records';
const analyticsTable = import.meta.env.VITE_SUPABASE_ANALYTICS_TABLE || 'analytics_events';
const purchasesTable = import.meta.env.VITE_SUPABASE_PURCHASES_TABLE || 'purchases';
const abandonmentsTable = import.meta.env.VITE_SUPABASE_ABANDONMENTS_TABLE || 'abandoned_checkouts';
const emailFunctionUrl = import.meta.env.VITE_EMAIL_FUNCTION_URL;

export const fetchAccessRecord = async (
  code: string,
  email: string,
  fallbackRecords: AccessRecord[]
): Promise<AccessRecord | undefined> => {
  if (isSupabaseConfigured) {
    try {
      const data = await fetchSingle<AccessRecord>(
        accessTable,
        { code, email },
        'id,code,email,driveLink,photos,firstLoginAt'
      );
      if (data) {
        return {
          ...data,
          photos: Array.isArray((data as any).photos) ? (data as any).photos : [],
        };
      }
    } catch (err) {
      console.warn('Supabase access record lookup failed, using fallback data.', err);
    }
  }

  return fallbackRecords.find(
    (record) => record.code.toUpperCase() === code.toUpperCase() && record.email.toLowerCase() === email.toLowerCase()
  );
};

const insertEvent = async (table: string, payload: Record<string, any>) => {
  if (!isSupabaseConfigured) return;

  try {
    await insertRow(table, payload);
  } catch (err) {
    console.warn(`Supabase insert into ${table} failed`, err);
  }
};

export const recordLogin = async (payload: { email: string; codeUsed: string }) => {
  await insertEvent(analyticsTable, {
    event_type: 'login',
    ...payload,
    timestamp: new Date().toISOString(),
  });
};

export const recordPurchase = async (payload: PurchaseRecord) => {
  await insertEvent(purchasesTable, payload);
  await insertEvent(analyticsTable, {
    event_type: 'purchase',
    email: payload.email,
    amount: payload.amount,
    description: payload.description,
    timestamp: payload.timestamp,
  });
};

export const recordAbandonment = async (payload: AbandonedCheckout) => {
  await insertEvent(abandonmentsTable, payload);
  await insertEvent(analyticsTable, {
    event_type: 'abandoned_checkout',
    email: payload.email,
    potentialValue: payload.potentialValue,
    itemsCount: payload.itemsCount,
    stage: payload.stage,
    timestamp: payload.timestamp,
  });
};

export const sendDownloadEmail = async (payload: {
  email: string;
  downloadUrl?: string;
  selectionSummary: string;
}) => {
  if (!emailFunctionUrl) return;

  try {
    await fetch(emailFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Email send failed', err);
  }
};
