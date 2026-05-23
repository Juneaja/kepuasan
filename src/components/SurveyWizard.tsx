import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, CheckCircle2, ChevronRight, ChevronLeft, 
  Smile, UserCheck, Stethoscope, HeartHandshake, 
  Building2, Pill, Clock, MessageSquare, ArrowRight, HelpCircle
} from 'lucide-react';
import { SurveyResponse, SurveyCategoryKey } from '../types';
import { CATEGORY_SPECS, KECAMATAN_LAMONGAN } from '../data';

interface SurveyWizardProps {
  onAddSurvey: (survey: Omit<SurveyResponse, 'id' | 'timestamp'>) => void;
}

const STEPS = [
  { id: 'demographics', label: 'Profil Pasien' },
  { id: 'ratings', label: 'Eveluasi Mutu' },
  { id: 'feedback', label: 'Kritik & Saran' },
  { id: 'completion', label: 'Selesai' }
];

const RATING_LABELS = {
  0: 'Klik bintang untuk memberi nilai',
  1: 'Sangat Buruk (Kecewa Sekali)',
  2: 'Kurang Baik (Butuh Perbaikan)',
  3: 'Cukup Memuaskan (Standar)',
  4: 'Sangat Memuaskan (Bagus)',
  5: 'Sempurna (Sangat Direkomendasikan)'
};

const SUGGESTED_FEEDBACKS = [
  'Dokter sangat ramah dan sabar memberikan penjelasan.',
  'Petugas pendaftaran sangat sigap melayani.',
  'Waktu tunggu dokter terlalu lama, mohon dipercepat.',
  'Area ruang tunggu sangat bersih, ber-AC, dan nyaman.',
  'Antrean pengambilan obat di apotek cukup padat dan lama.',
  'Perawat melayani dengan senyum dan sabar.',
  'Sistem pendaftaran online mohon segera disediakan.',
  'Toilet bersih dan air mengalir dengan lancar.'
];

export default function SurveyWizard({ onAddSurvey }: SurveyWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [composing, setComposing] = React.useState(true);

  // Demographic States
  const [name, setName] = React.useState('');
  const [ageRange, setAgeRange] = React.useState('26-35');
  const [gender, setGender] = React.useState<'Laki-laki' | 'Perempuan' | 'Tidak Menyebutkan'>('Perempuan');
  const [kecamatan, setKecamatan] = React.useState('Lamongan Kota');
  const [searchKecamatan, setSearchKecamatan] = React.useState('');
  const [showKecDropdown, setShowKecDropdown] = React.useState(false);

  // Ratings State
  const [ratings, setRatings] = React.useState<Record<SurveyCategoryKey, number>>({
    pendaftaran: 0,
    dokter: 0,
    perawat: 0,
    fasilitas: 0,
    farmasi: 0,
    waktuTunggu: 0
  });

  // Suggestion State
  const [feedback, setFeedback] = React.useState('');

  const filteredKecamatan = KECAMATAN_LAMONGAN.filter(k => 
    k.toLowerCase().includes(searchKecamatan.toLowerCase())
  );

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck': return <UserCheck className="w-5 h-5" />;
      case 'Stethoscope': return <Stethoscope className="w-5 h-5" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5" />;
      case 'Building2': return <Building2 className="w-5 h-5" />;
      case 'Pills': return <Pill className="w-5 h-5" />;
      case 'Clock': return <Clock className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  const handleRatingChange = (key: SurveyCategoryKey, rate: number) => {
    setRatings(prev => ({ ...prev, [key]: rate }));
  };

  const handleSelectSuggestedFeedback = (text: string) => {
    setFeedback(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.endsWith('.') || trimmed.endsWith('!')) return `${trimmed} ${text}`;
      return `${trimmed}. ${text}`;
    });
  };

  const checkRatingsComplete = () => {
    return (Object.keys(ratings) as SurveyCategoryKey[]).every(key => ratings[key] > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSurvey({
      name: name.trim() || 'Anonim',
      ageRange,
      gender,
      kecamatan,
      ratings,
      feedback: feedback.trim()
    });
    setComposing(false);
    setCurrentStepIndex(3);
  };

  const handleReset = () => {
    setName('');
    setAgeRange('26-35');
    setGender('Perempuan');
    setKecamatan('Lamongan Kota');
    setRatings({
      pendaftaran: 0,
      dokter: 0,
      perawat: 0,
      fasilitas: 0,
      farmasi: 0,
      waktuTunggu: 0
    });
    setFeedback('');
    setComposing(true);
    setCurrentStepIndex(0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto" id="survey-wizard-container">
      {/* Progress Stepper Tracking */}
      <div className="mb-6 bg-white p-6 rounded-none border-l-8 border-indigo-900 shadow-sm">
        <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-3">Langkah Pengisian Survei</label>
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0"></div>
          {STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isActive = currentStepIndex === idx;
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-9 h-9 rounded-none flex items-center justify-center text-xs font-black font-mono transition-all duration-300 border-2 ${
                    isCompleted 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500' 
                      : isActive 
                        ? 'bg-indigo-900 text-white border-indigo-900' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-2 transition-colors ${
                  isActive ? 'text-indigo-900' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {composing ? (
          <motion.div
            key={`step-${currentStepIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-none border-t-8 border-indigo-900 shadow-md p-6 sm:p-8"
          >
            {/* Step 1: Demographics */}
            {currentStepIndex === 0 && (
              <div id="step-demographics-view">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-indigo-900 mb-1">
                    <Smile className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs uppercase tracking-widest font-black font-mono">PROFIL RESPONDEN</span>
                  </div>
                  <h2 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">
                    SUARA ANDA SANGAT BERHARGA
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-sans">
                    Demi peningkatan mutu pelayanan medis berkelanjutan di <strong className="text-indigo-900">Klinik Sartika Lamongan</strong>, mohon lengkapi profil singkat berikut ini. Privasi Anda terjamin 100% anonim dan terlindungi.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Name (Optional) */}
                  <div className="group">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                      NAMA LENGKAP PASIEN <span className="text-slate-400 font-normal">(OPSIONAL / BOLEH KOSONG)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso (Biarkan kosong untuk anonim)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none text-slate-900 text-sm focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Gender & Age Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                        JENIS KELAMIN <span className="text-emerald-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Laki-laki', 'Perempuan', 'Tidak Menyebutkan'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`px-1.5 py-3 text-[10px] font-extrabold uppercase tracking-wider border-2 rounded-none transition-all cursor-pointer ${
                              gender === g
                                ? 'border-indigo-900 bg-indigo-50 text-indigo-900 font-black'
                                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            {g === 'Tidak Menyebutkan' ? 'LAINNYA' : g.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                        RENTANG USIA MALAIK <span className="text-emerald-500">*</span>
                      </label>
                      <select
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-none text-slate-900 text-xs sm:text-sm font-bold focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
                      >
                        <option value="<18">&lt; 18 TAHUN</option>
                        <option value="18-25">18 - 25 TAHUN</option>
                        <option value="26-35">26 - 35 TAHUN</option>
                        <option value="36-45">36 - 45 TAHUN</option>
                        <option value="46-55">46 - 55 TAHUN</option>
                        <option value=">55">&gt; 55 TAHUN</option>
                      </select>
                    </div>
                  </div>

                  {/* Subdistrict Selector (Kecamatan di Lamongan) */}
                  <div className="relative">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                      KECAMATAN DOMISILI (LAMONGAN) <span className="text-emerald-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik nama kecamatan Anda..."
                        value={searchKecamatan || kecamatan}
                        onFocus={() => {
                          setShowKecDropdown(true);
                          setSearchKecamatan('');
                        }}
                        onChange={(e) => {
                          setSearchKecamatan(e.target.value);
                          setKecamatan(e.target.value);
                          setShowKecDropdown(true);
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none text-slate-900 text-sm font-bold focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all shadow-xs"
                      />
                      {showKecDropdown && (
                        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border-2 border-slate-200 rounded-none shadow-lg z-35 divide-y divide-slate-100">
                          {filteredKecamatan.length > 0 ? (
                            filteredKecamatan.map((kecName) => (
                              <button
                                key={kecName}
                                type="button"
                                onClick={() => {
                                  setKecamatan(kecName);
                                  setSearchKecamatan('');
                                  setShowKecDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase transition-colors flex justify-between items-center"
                              >
                                <span>{kecName}</span>
                                {kecamatan === kecName && <span className="text-[10px] font-black text-indigo-900">TERPILIH</span>}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">
                              Kecamatan tidak terdaftar. Mengetik manual...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end mt-8 border-t-2 border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(1)}
                    className="flex items-center gap-2 px-6 py-3.5 bg-indigo-900 hover:bg-indigo-850 text-white rounded-none text-xs sm:text-sm uppercase tracking-wider font-extrabold hover:shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Lanjut Evaluasi Klinik</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Quality Ratings */}
            {currentStepIndex === 1 && (
              <div id="step-ratings-view">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <span className="text-xs uppercase tracking-widest font-black font-mono text-indigo-900">EVALUASI MUTU LAYANAN</span>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 uppercase">
                    PENILAIAN SEKTOR PELAYANAN
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan tentukan tingkat kepuasan Anda pada 6 aspek pelayanan klinik di bawah ini.
                  </p>
                </div>

                <div className="space-y-6">
                  {CATEGORY_SPECS.map((spec, sIdx) => {
                    const ratingValue = ratings[spec.key];
                    // Alternating geometric solid borders
                    const borderTheme = sIdx % 2 === 0 ? 'border-indigo-600' : 'border-emerald-500';
                    return (
                      <div 
                        key={spec.key} 
                        className={`p-6 rounded-none border-l-8 ${borderTheme} bg-slate-50/50 shadow-xs`}
                        id={`category-wrapper-${spec.key}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-indigo-900 text-white rounded-xs">
                            {getIcon(spec.iconName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 block tracking-widest font-mono">SEKTOR 0{sIdx + 1}</span>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                              {spec.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {spec.description}
                            </p>

                            {/* Crisp Point Buttons 1-5 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                              <div className="flex justify-between items-center gap-2 flex-wrap sm:flex-1">
                                {[1, 2, 3, 4, 5].map((rate) => {
                                  const isActive = ratingValue === rate;
                                  // Button label descriptions
                                  const rateLabels: Record<number, string> = {
                                    1: 'BURUK',
                                    2: 'KURANG',
                                    3: 'CUKUP',
                                    4: 'BAIK',
                                    5: 'ISTIMEWA'
                                  };

                                  return (
                                    <button
                                      key={rate}
                                      type="button"
                                      onClick={() => handleRatingChange(spec.key, rate)}
                                      className={`flex-1 min-w-[50px] py-3.5 border-2 rounded-none transition-all cursor-pointer font-extrabold text-[11px] font-mono uppercase text-center ${
                                        isActive
                                          ? 'border-indigo-900 bg-indigo-900 text-white scale-[1.03] shadow-sm'
                                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/20'
                                      }`}
                                      title={rateLabels[rate]}
                                      id={`star-${spec.key}-${rate}`}
                                    >
                                      <div className="text-xs font-black">{rate}</div>
                                      <div className={`text-[8px] opacity-80 mt-0.5 tracking-tighter ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                                        {rateLabels[rate]}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="sm:w-36 text-right sm:text-left">
                                {ratingValue > 0 ? (
                                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-none border border-slate-200 bg-slate-100 text-slate-800`}>
                                    SKOR: {ratingValue} / 5
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                    BELUM DINILAI *
                                  </span>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center mt-8 border-t-2 border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(0)}
                    className="flex items-center gap-1.5 px-5 py-3 border-2 border-slate-200 text-slate-800 font-extrabold uppercase text-xs tracking-wider rounded-none hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(2)}
                    disabled={!checkRatingsComplete()}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-none text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      checkRatingsComplete()
                        ? 'bg-indigo-900 hover:bg-indigo-850 text-white shadow-md'
                        : 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <span>Lanjut ke Kritik & Saran</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Write Suggestions Feedback */}
            {currentStepIndex === 2 && (
              <form onSubmit={handleSubmit} id="step-feedback-view">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <span className="text-xs uppercase tracking-widest font-black font-mono text-indigo-900">AKHIRI EVALUASI</span>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 uppercase">
                    KRITIK, SARAN & MASUKAN
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan isi pendapat Anda atau gunakan templat aspirasi cepat di bawah.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Suggestion Text Area */}
                  <div className="bg-slate-100 p-6 flex flex-col rounded-none">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4.5 h-4.5 text-indigo-900" />
                      Saran & Masukan Tambahan
                    </label>
                    <textarea
                      placeholder="Tuliskan pendapat Anda di sini..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={5}
                      className="w-full p-4 bg-white border-2 border-slate-300 rounded-none text-slate-800 text-xs sm:text-sm font-bold resize-none outline-hidden focus:border-indigo-900"
                    />
                  </div>

                  {/* Suggestion Quick Tags */}
                  <div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
                      PILIHAN SARAN KHAS (KLIK UNTUK MENYALIN LANGSUNG):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {SUGGESTED_FEEDBACKS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSelectSuggestedFeedback(tag)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-none hover:border-indigo-600 hover:bg-indigo-50/20 text-[10px] uppercase font-bold text-left active:scale-98 transition-all cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center mt-8 border-t-2 border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(1)}
                    className="flex items-center gap-1.5 px-5 py-3 border-2 border-slate-200 text-slate-800 font-extrabold uppercase text-xs tracking-wider rounded-none hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 max-w-sm ml-4 items-center justify-center gap-2 px-6 py-4 bg-indigo-900 text-white rounded-none text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-indigo-850 transition-all cursor-pointer text-center"
                    id="submit-survey-button"
                  >
                    KIRIM SURVEY SEKARANG
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : (
          /* Step 4: Completion Screen */
          <motion.div
            key="completion-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-none border-t-8 border-emerald-500 shadow-md p-8 sm:p-12 text-center"
            id="completion-success-view"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border-2 border-emerald-500 rounded-none flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 uppercase tracking-tight">
              TERIMA KASIH BANYAK!
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Survei kepuasan Anda telah berhasil dikirim ke basis data analitik <strong className="text-indigo-900">Klinik Sartika Lamongan</strong>.
            </p>

            {/* Quality Commitment Notice */}
            <div className="bg-slate-50 border-l-4 border-indigo-900 p-4 max-w-md mx-auto mt-6 text-left text-xs text-slate-600 space-y-1 rounded-none">
              <p className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500"></span> KOMITMEN MUTU KLINIK SARTIKA
              </p>
              <p className="leading-relaxed text-slate-500">
                Pimpinan & seluruh staf medis akan menggunakan data bintang dan saran Anda untuk perbaikan operasional bulanan klinis.
              </p>
            </div>

            {/* Back / Restart trigger */}
            <button
              type="button"
              onClick={handleReset}
              className="mt-8 px-6 py-3.5 border-2 border-slate-300 hover:border-indigo-900 text-slate-800 font-black rounded-none text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer"
            >
              Kirim Survei Baru Lainnya
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
