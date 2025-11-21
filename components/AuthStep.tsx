
import React, { useState } from 'react';
import { AppConfig, AccessRecord } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { validateAccessCode } from '../services/driveService';
import { ADMIN_ACCESS_CODE } from '../constants';

interface AuthStepProps {
  config: AppConfig;
  onSuccess: (record: AccessRecord) => void;
  onAdminAccess: () => void;
}

export const AuthStep: React.FC<AuthStepProps> = ({ config, onSuccess, onAdminAccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for Admin Code shortcut
    if (code.trim().toUpperCase() === ADMIN_ACCESS_CODE) {
      onAdminAccess();
      return;
    }

    setIsLoading(true);

    try {
      const record = await validateAccessCode(code, email, config.accessRecords);
      onSuccess(record);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="w-full max-w-4xl m-auto px-4 py-12 md:py-20 flex flex-col items-center">
        
        <div className="w-full text-center mb-10">
          <h1 className="text-5xl md:text-7xl font-bold text-[#0047BB] tracking-tight leading-[1.1] mb-6">
            {config.copy.authHeadline}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            {config.copy.authSubtext}
          </p>
        </div>

        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl shadow-blue-900/5 border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <Input
                label="Access Code"
                placeholder="Enter your unique code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 text-lg font-bold shadow-xl shadow-[#0047BB]/20 hover:-translate-y-0.5 transition-all" 
              isLoading={isLoading}
            >
              Verify & Continue &rarr;
            </Button>
          </form>
          
          <p className="text-xs text-center text-slate-400 mt-6">
            Protected by Click Media Group secure access.
          </p>
        </div>

        {/* Demo Credentials Footer */}
        <div className="mt-10 p-4 bg-white/50 backdrop-blur rounded-xl border border-slate-200/60 text-sm text-slate-500 text-center inline-block">
            <p className="font-semibold mb-2 text-[#0047BB] uppercase tracking-wider text-xs">Demo Credentials</p>
            <div className="flex flex-col md:flex-row gap-x-6 gap-y-2 text-left justify-center items-center">
              <div className="flex gap-2">
                <span className="text-slate-400">Code:</span>
                <span className="font-mono font-bold text-slate-700">DEMO</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono font-bold text-slate-700">demo@click.com</span>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};
