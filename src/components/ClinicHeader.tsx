import React from 'react';
import { HeartPulse, LayoutDashboard, FileSpreadsheet, MapPin, Clock } from 'lucide-react';

interface ClinicHeaderProps {
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  surveyCount: number;
}

export default function ClinicHeader({ isAdmin, setIsAdmin, surveyCount }: ClinicHeaderProps) {
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-indigo-900 text-white border-b-4 border-emerald-500 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
              <div className="w-8 h-8 border-4 border-indigo-900 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-3.5 h-3.5 bg-indigo-900 rounded-xs"></div>
              </div>
            </div>
            <div>
              <h1 className="font-display font-black text-2xl uppercase tracking-tight text-white m-0 leading-none">
                KLINIK SARTIKA
              </h1>
              <span className="text-emerald-400 font-sans font-bold text-xs uppercase tracking-widest mt-1 block">
                SURVEY KEPUASAN PELAYANAN • LAMONGAN
              </span>
            </div>
          </div>

          {/* Time and Navigation Controls */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-950/70 border border-indigo-800/60 rounded text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span>LIVE: {timeStr}</span>
            </div>

            {/* Toggle Modes */}
            <div className="flex p-1 bg-indigo-950 rounded-lg border border-indigo-800/80" id="role-toggle-group">
              <button
                id="btn-patient-mode"
                onClick={() => setIsAdmin(false)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  !isAdmin
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ISI SURVEY</span>
              </button>
              <button
                id="btn-admin-mode"
                onClick={() => setIsAdmin(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>DASHBOARD</span>
                {surveyCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-indigo-950 text-emerald-400 rounded">
                    {surveyCount}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
