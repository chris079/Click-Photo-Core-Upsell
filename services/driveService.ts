import { AccessRecord } from '../types';
import { fetchAccessRecord } from './backendService';

export const validateAccessCode = async (
  code: string,
  email: string,
  records: AccessRecord[]
): Promise<AccessRecord> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const normalizedCode = code.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (!email.includes('@') || email.length < 5) {
      throw new Error("Please enter a valid email address.");
  }

  const record = await fetchAccessRecord(normalizedCode, normalizedEmail, records);

  if (record) {
    return record;
  }

  throw new Error("That code and email combination does not match our records. Try 'DEMO' and 'demo@click.com' for this preview.");
};
