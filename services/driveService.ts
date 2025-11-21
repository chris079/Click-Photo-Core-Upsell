
import { AccessRecord } from '../types';

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

  const record = records.find(r => 
    r.code.toUpperCase() === normalizedCode && 
    r.email.toLowerCase() === normalizedEmail
  );

  if (record) {
    return record;
  }
  
  throw new Error("That code and email combination does not match our records. Try 'DEMO' and 'demo@click.com' for this preview.");
};
