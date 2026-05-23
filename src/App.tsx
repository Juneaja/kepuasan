import React from 'react';
import { motion } from 'motion/react';
import { HeartPulse, ShieldAlert, Award, Sparkles, Star } from 'lucide-react';
import { SurveyResponse } from './types';
import { INITIAL_SURVEYS } from './data';
import ClinicHeader from './components/ClinicHeader';
import SurveyWizard from './components/SurveyWizard';
import AdminDashboard from './components/AdminDashboard';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, orderBy, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [surveys, setSurveys] = React.useState<SurveyResponse[]>([]);

  // Synchronize state with Firebase Firestore in real-time
  React.useEffect(() => {
    const surveysCol = collection(db, 'surveys');
    const q = query(surveysCol, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Only seed Firestore dynamically if empty AND never initialized/cleared before on this client
        const isInitialized = localStorage.getItem('sartika_db_initialized') === 'true';
        if (!isInitialized) {
          try {
            localStorage.setItem('sartika_db_initialized', 'true');
            for (const item of INITIAL_SURVEYS) {
              await setDoc(doc(db, 'surveys', item.id), item);
            }
          } catch (err) {
            console.error('Seeding Firestore error:', err);
          }
        } else {
          setSurveys([]);
        }
      } else {
        localStorage.setItem('sartika_db_initialized', 'true');
        const fetched = snapshot.docs.map(gdoc => ({
          ...gdoc.data(),
          id: gdoc.id
        } as SurveyResponse));
        setSurveys(fetched);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'surveys');
    });

    return () => unsubscribe();
  }, []);

  const handleAddSurvey = async (newSurvey: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const scores = Object.values(newSurvey.ratings);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Auto-compute text sentiment based on score
    let computedSentiment: 'positif' | 'netral' | 'negatif' = 'netral';
    if (avgScore >= 4.2) {
      computedSentiment = 'positif';
    } else if (avgScore < 3.0) {
      computedSentiment = 'negatif';
    }

    const docId = 'survey-' + Date.now();
    const created: SurveyResponse = {
      ...newSurvey,
      id: docId,
      timestamp: new Date().toISOString(),
      sentiment: computedSentiment
    };

    try {
      await setDoc(doc(db, 'surveys', docId), created);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `surveys/${docId}`);
    }
  };

  const handleDeleteSurvey = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'surveys', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `surveys/${id}`);
    }
  };

  const handleClearSurveys = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data indeks survei dari database Firebase?')) {
      try {
        // Set the initializer flag to true to prevent onSnapshot from re-seeding automatically
        localStorage.setItem('sartika_db_initialized', 'true');
        
        for (const s of surveys) {
          await deleteDoc(doc(db, 'surveys', s.id));
        }
        setSurveys([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'surveys');
      }
    }
  };

  const handleSeedData = async () => {
    try {
      // Temporary unset to allow seeding, then write
      localStorage.setItem('sartika_db_initialized', 'false');
      for (const item of INITIAL_SURVEYS) {
        await setDoc(doc(db, 'surveys', item.id), item);
      }
      localStorage.setItem('sartika_db_initialized', 'true');
    } catch (error) {
      console.error('Manual seed action error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-emerald-500 selection:text-white" id="main-app-container">
      
      {/* Interactive Navigation header logo */}
      <ClinicHeader 
        isAdmin={isAdmin} 
        setIsAdmin={setIsAdmin} 
        surveyCount={surveys.length} 
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isAdmin ? (
          /* Patient Form Mode */
          <div className="space-y-6 sm:space-y-8" id="patient-wizard-section">
            
            {/* Visual Hero Clinic Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-900 text-white rounded-none p-6 sm:p-8 relative overflow-hidden shadow-sm border-l-8 border-emerald-500"
              id="clinic-hero-banner"
            >
              {/* Decorative faint background graphics */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-950/40 translate-x-12 skew-x-12 z-0"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 bg-indigo-950 border border-indigo-800/80 w-fit px-3 py-1 rounded-none text-[10px] sm:text-xs font-semibold uppercase tracking-wider font-mono text-emerald-400">
                    <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Terakreditasi Paripurna (Sangat Baik)</span>
                  </div>
                  
                  <h2 className="font-display font-black text-2.5xl sm:text-3xl leading-tight tracking-tight uppercase">
                    Bantu kami memberikan <span className="text-emerald-400 font-black">pelayanan terbaik</span> untuk Anda
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-sans max-w-2xl">
                    Kepuasan Anda adalah komitmen utama kami. Pengisian data evaluasi kepuasan masyarakat mandiri diproses secara langsung oleh tim pengawas mutu Klinik Sartika Lamongan.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-indigo-950 border border-indigo-800 p-3 rounded-none shrink-0">
                  <div className="text-center px-2">
                    <span className="text-xl sm:text-2xl font-display font-black block font-mono text-emerald-400">★ 4.8</span>
                    <span className="text-[10px] text-indigo-300 block uppercase tracking-wider font-semibold font-mono">IKM INDEKS</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Render Multi-step wizard panel */}
            <SurveyWizard onAddSurvey={handleAddSurvey} />

          </div>
        ) : (
          /* Admin View Dashboard */
          <AdminDashboard 
            surveys={surveys}
            onClearSurveys={handleClearSurveys}
            onDeleteSurvey={handleDeleteSurvey}
            onSeedData={handleSeedData}
          />
        )}
      </main>

      {/* Humble Footer */}
      <footer className="bg-slate-100 p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium mt-12 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-center sm:text-left">
          <span>JL LAMONGREJO NO.100, LAMONGAN</span>
          <span>TELP: 085730591047</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-none"></div>
          <span>SURVEY KEPUASAN REAL-TIME V.2.4</span>
        </div>
      </footer>

    </div>
  );
}
