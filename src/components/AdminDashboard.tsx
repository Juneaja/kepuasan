import React from 'react';
import { 
  Building, UserCheck, Stethoscope, HeartHandshake, Building2, Pill, Clock, 
  Trash2, ShieldCheck, RefreshCw, Sparkles, LogOut, CheckCircle2, Search, Filter, AlertTriangle, ChevronRight, User,
  FileDown, Key, Lock, Image, Upload
} from 'lucide-react';
import { SurveyResponse, BrandSettings } from '../types';
import { CATEGORY_SPECS } from '../data';
import { jsPDF } from 'jspdf';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AdminDashboardProps {
  surveys: SurveyResponse[];
  onClearSurveys: () => void;
  onDeleteSurvey: (id: string) => void;
  onSeedData?: () => void;
  brandSettings?: BrandSettings;
}

export default function AdminDashboard({ surveys, onClearSurveys, onDeleteSurvey, onSeedData, brandSettings }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');

  // Password Management States
  const [dbPassword, setDbPassword] = React.useState<string>('sartika123');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [passwordChangeError, setPasswordChangeError] = React.useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = React.useState('');

  // Branding Management States
  const [isChangingBranding, setIsChangingBranding] = React.useState(false);
  const [logoBase64, setLogoBase64] = React.useState<string>('');
  const [faviconBase64, setFaviconBase64] = React.useState<string>('');
  const [brandingError, setBrandingError] = React.useState('');
  const [brandingSuccess, setBrandingSuccess] = React.useState('');

  // Synchronize branding state on load
  React.useEffect(() => {
    if (brandSettings) {
      setLogoBase64(brandSettings.logo || '');
      setFaviconBase64(brandSettings.favicon || '');
    }
  }, [brandSettings, isChangingBranding]);

  // Handle uploaded local files conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      setBrandingError(`Ukuran berkas ${target === 'logo' ? 'Logo' : 'Favicon'} terlalu besar! Maksimal 512 KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'logo') {
        setLogoBase64(base64String);
      } else {
        setFaviconBase64(base64String);
      }
      setBrandingError('');
    };
    reader.onerror = () => {
      setBrandingError('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  // Save changes to Firestore brand doc
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingError('');
    setBrandingSuccess('');

    try {
      const docRef = doc(db, 'settings', 'brand');
      await setDoc(docRef, {
        logo: logoBase64 || '',
        favicon: faviconBase64 || ''
      });
      setBrandingSuccess('Logo dan Favicon berhasil diperbarui secara instan!');
      setTimeout(() => {
        setIsChangingBranding(false);
        setBrandingSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Error saving branding:', err);
      setBrandingError('Gagal menyimpan ke database. Periksa koneksi.');
    }
  };

  // Reset custom branding to default live app visuals
  const handleResetBranding = async () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang logo dan favicon ke bawaan sistem?')) {
      try {
        const docRef = doc(db, 'settings', 'brand');
        await setDoc(docRef, {
          logo: '',
          favicon: ''
        });
        setLogoBase64('');
        setFaviconBase64('');
        setBrandingSuccess('Visual branding berhasil dikembalikan ke bawaan!');
        setTimeout(() => {
          setIsChangingBranding(false);
          setBrandingSuccess('');
        }, 1500);
      } catch (err) {
        console.error('Error resetting branding:', err);
        setBrandingError('Gagal menyetel ulang branding.');
      }
    }
  };

  // Fetch the current saved password from firestore settings doc
  React.useEffect(() => {
    const fetchAdminPassword = async () => {
      try {
        const docRef = doc(db, 'settings', 'admin_auth');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.password === 'string') {
            setDbPassword(data.password);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil sandi dari database:', err);
      }
    };
    fetchAdminPassword();
  }, []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSentiment, setSelectedSentiment] = React.useState<string>('semua');
  const [selectedSubdistrict, setSelectedSubdistrict] = React.useState<string>('semua');

  // AI State
  const [aiAnalysis, setAiAnalysis] = React.useState<string>('');
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiLoadStep, setAiLoadStep] = React.useState(0);

  // Authentication Handler using the fetched dbPassword with a fallback of 'sartika123'
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === dbPassword) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Sandi Klinik salah!');
    }
  };

  // Password Update Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (newPassword.trim().length < 4) {
      setPasswordChangeError('Kata sandi baru minimal harus 4 karakter!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    try {
      const docRef = doc(db, 'settings', 'admin_auth');
      await setDoc(docRef, { password: newPassword }, { merge: true });
      setDbPassword(newPassword);
      setPasswordChangeSuccess('Kata sandi administrator berhasil diperbarui!');
      
      // Clear inputs
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Auto-close dialog after 1.8 seconds
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordChangeSuccess('');
      }, 1800);
    } catch (err: any) {
      console.error('Error saving updated password to firestore:', err);
      setPasswordChangeError('Gagal menyimpan sandi ke database. Periksa koneksi.');
    }
  };

  // Compute metrics based on actual surveys
  const totalSurveys = surveys.length;

  const getCategoryAverage = (key: keyof SurveyResponse['ratings']) => {
    if (totalSurveys === 0) return 0;
    const sum = surveys.reduce((acc, curr) => acc + (curr.ratings[key] || 0), 0);
    return Number((sum / totalSurveys).toFixed(2));
  };

  const avgPendaftaran = getCategoryAverage('pendaftaran');
  const avgDokter = getCategoryAverage('dokter');
  const avgPerawat = getCategoryAverage('perawat');
  const avgFasilitas = getCategoryAverage('fasilitas');
  const avgFarmasi = getCategoryAverage('farmasi');
  const avgWaktuTunggu = getCategoryAverage('waktuTunggu');

  const averages = {
    pendaftaran: avgPendaftaran,
    dokter: avgDokter,
    perawat: avgPerawat,
    fasilitas: avgFasilitas,
    farmasi: avgFarmasi,
    waktuTunggu: avgWaktuTunggu
  };

  const overallRating = totalSurveys > 0
    ? Number((Object.values(averages).reduce((a, b) => a + b, 0) / 6).toFixed(2))
    : 0;

  // Indeks Kepuasan Masyarakat (IKM) conversion out of 100
  const ikmValue = overallRating > 0 ? Number((overallRating * 20).toFixed(1)) : 0;

  const getIkmQualitative = (ikm: number) => {
    if (ikm >= 88.31) return { label: 'SANGAT BAIK (A)', color: 'text-emerald-500 border-emerald-500 bg-emerald-50/10' };
    if (ikm >= 76.61) return { label: 'BAIK (B)', color: 'text-indigo-600 border-indigo-600 bg-indigo-50/10' };
    if (ikm >= 65.00) return { label: 'KURANG BAIK (C)', color: 'text-amber-600 border-amber-600 bg-amber-50/10' };
    return { label: 'BURUK (D)', color: 'text-rose-600 border-rose-600 bg-rose-50/10' };
  };

  const qualitative = getIkmQualitative(ikmValue);

  // Sentiment counters
  const sentimentCounts = surveys.reduce((acc, s) => {
    const avgScore = Object.values(s.ratings).reduce((a, b) => a + b, 0) / 6;
    let sType: 'positif' | 'netral' | 'negatif' = s.sentiment || 'netral';
    if (!s.sentiment) {
      if (avgScore >= 4.2) sType = 'positif';
      else if (avgScore >= 3.0) sType = 'netral';
      else sType = 'negatif';
    }
    acc[sType] += 1;
    return acc;
  }, { positif: 0, netral: 0, negatif: 0 });

  // Get list of subdistricts submitting feedback
  const subdistrictsWithData = Array.from(new Set(surveys.map(s => s.kecamatan)));

  // Filtered feedback rows
  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = searchQuery.trim() === '' || 
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kecamatan.toLowerCase().includes(searchQuery.toLowerCase());

    const avgScore = Object.values(s.ratings).reduce((a, b) => a + b, 0) / 6;
    let computedSent = s.sentiment;
    if (!computedSent) {
      computedSent = avgScore >= 4.2 ? 'positif' : avgScore >= 3.0 ? 'netral' : 'negatif';
    }
    const matchesSentiment = selectedSentiment === 'semua' || computedSent === selectedSentiment;

    // Subdistrict matches
    const matchesSubdistrict = selectedSubdistrict === 'semua' || s.kecamatan === selectedSubdistrict;

    return matchesSearch && matchesSentiment && matchesSubdistrict;
  });

  // Call Gemini API to summarize
  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiLoadStep(0);
    setAiAnalysis('');

    const stepInterval = setInterval(() => {
      setAiLoadStep(prev => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveys })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi Server E-Kepuasan.');
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAiAnalysis(`### ❌ Terjadi Kesalahan Koneksi\n\nAda kendala saat berkomunikasi dengan asisten kecerdasan AI. Pastikan server berjalan dan \`GEMINI_API_KEY\` sudah dikonfigurasi di pengaturan.\n\nDetail: ${err.message}`);
    } finally {
      clearInterval(stepInterval);
      setIsAiLoading(false);
    }
  };

  // High Fidelity PDF Generator using jsPDF - Ultra-Minimalist & Modern Swiss Design
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let posY = 20;

    // Helper to draw horizontal line (Understated, extremely fine hair lines)
    const drawLine = (y: number, color: [number, number, number] = [226, 232, 240]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.2);
      doc.line(20, y, 190, y);
    };

    // Helper to clean markdown characters
    const cleanMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // remove basic bold markers
        .replace(/\*(.*?)\*/g, '$1')     // remove basic italic markers
        .replace(/__(.*?)__/g, '$1')     // remove underline
        .replace(/`([^`]+)`/g, '$1')     // remove code block markers
        .trim();
    };

    // --- PAGE 1 HEADER: MINIMALIST PROFESSIONAL LETTERHEAD ---
    // Pure white backdrop with precise, balanced typography
    doc.setTextColor(15, 23, 42); // slate-900 (Deep Charcoal)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('KLINIK SARTIKA LAMONGAN', 20, posY + 4);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500 (Muted Steel Slate)
    doc.text('LAPORAN EVALUASI & SURVEI KEPUASAN PELAYANAN (INDEKS IKM)', 20, posY + 10);

    // Document Meta (Right-aligned details block)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const currentDateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Periode Laporan : Real-Time`, 190, posY + 4, { align: 'right' });
    doc.text(`Tanggal Cetak  : ${currentDateStr}`, 190, posY + 9, { align: 'right' });

    posY += 16;
    drawLine(posY, [226, 232, 240]); // soft separator
    posY += 12;

    if (totalSurveys === 0) {
      // Empty State Design
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Belum tersedia data respons survei dalam database untuk dicetak.', 20, posY);
    } else {
      // --- SECTION 1: SAAS-STYLE TYPOGRAPHIC HERO STATS ---
      // We display large numbers with tiny labels below
      doc.setTextColor(15, 23, 42); // slate-900
      
      // Metric 1: IKM VALUE
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(26);
      doc.text(`${ikmValue}`, 20, posY + 7);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('INDEKS KEPUASAN (IKM)', 20, posY + 13);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text(`Mutu: ${qualitative.label}`, 20, posY + 18);

      // Metric 2: RATING BINTANG
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.text(`${overallRating}`, 85, posY + 7);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('RATA-RATA EVALUASI', 85, posY + 13);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229); // indigo-600
      const positivePercent = totalSurveys > 0 ? Math.round((sentimentCounts.positif / totalSurveys) * 100) : 0;
      doc.text(`${positivePercent}% Sentimen Positif`, 85, posY + 18);

      // Metric 3: JUMLAH SAMPEL
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.text(`${totalSurveys}`, 150, posY + 7);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL RESPONDEN', 150, posY + 13);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Sampel Pasien Aktif', 150, posY + 18);

      posY += 26;
      drawLine(posY, [241, 245, 249]); // lighter separator
      posY += 10;

      // --- SECTION 2: SKOR DETAIL PER SEKTOR (PRECISION INTERACTION SLIDERS) ---
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('I. METRIK NILAI PER SEKTOR LAYANAN', 20, posY);
      posY += 4;
      drawLine(posY, [15, 23, 42]);
      posY += 8;

      CATEGORY_SPECS.forEach((spec) => {
        const score = averages[spec.key];
        
        // Sector Title (Left aligned)
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(spec.title.toUpperCase(), 20, posY + 2);

        // Score (Aligned near progress bar start)
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${score.toFixed(2)} / 5.00`, 85, posY + 2);

        // Modern Ultra-Thin Progress Line representation on the right
        doc.setFillColor(241, 245, 249); // slate-100 sleeve
        doc.rect(125, posY + 0.8, 65, 0.8, 'F');
        
        const fillPercent = (score / 5);
        const fillWidth = fillPercent * 65;
        let pColor: [number, number, number] = [79, 70, 229]; // Indigo-600
        if (score >= 4.2) pColor = [16, 185, 129]; // Positive Emerald
        else if (score < 3.0) pColor = [225, 29, 72]; // Negative Rose
        
        doc.setFillColor(pColor[0], pColor[1], pColor[2]);
        doc.rect(125, posY + 0.8, fillWidth, 0.8, 'F');

        posY += 6.5;
      });

      posY += 8;

      // --- SECTION 3: DISTRIBUSI DOMISILI KECAMATAN (MINIMAL CARD FREE GRID) ---
      if (posY > 235) { doc.addPage(); posY = 20; }
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('II. DISTRIBUSI WILAYAH DOMISILI RESPONDEN', 20, posY);
      posY += 4;
      drawLine(posY, [15, 23, 42]);
      posY += 8;

      const subdistList = subdistrictsWithData.filter(sub => sub.trim().length > 0);
      if (subdistList.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Tidak ada catatan domisili responden.', 20, posY);
        posY += 6;
      } else {
        doc.setFontSize(8);
        let isRightCol = false;
        let colStartY = posY;

        subdistList.forEach((subdist, idx) => {
          const count = surveys.filter(s => s.kecamatan === subdist).length;
          const percent = ((count / totalSurveys) * 100).toFixed(0);
          
          const colX = isRightCol ? 110 : 20;
          const curY = isRightCol ? colStartY + (Math.floor(idx / 2) * 6) : posY;

          if (curY > 265) {
            doc.addPage();
            posY = 20;
            colStartY = 20;
          }

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`Kecamatan ${subdist.toUpperCase()}`, colX, curY);

          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`${count} Responden (${percent}%)`, colX + 45, curY);

          if (!isRightCol) {
            posY += 6;
          }
          isRightCol = !isRightCol;
        });

        if (isRightCol) {
          posY += 6;
        }
      }

      posY += 8;

      // --- SECTION 4: TINJAUAN STRATEGIS SARTIKA AI (ELEGANT EDITORIAL CARD) ---
      if (aiAnalysis) {
        if (posY > 230) { doc.addPage(); posY = 20; }
        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('III. EVALUASI DAN REKOMENDASI KLINIS (SARTIKA AI)', 20, posY);
        posY += 4;
        drawLine(posY, [16, 185, 129]); // Emerald line representing AI insights
        posY += 8;

        // Custom minimal container/card block for AI analysis
        const lines = aiAnalysis.split('\n');
        doc.setFontSize(8);

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i].trim();
          if (!rawLine) continue;

          let blockType = 'normal';
          let bodyText = rawLine;

          if (rawLine.startsWith('### ')) {
            blockType = 'h3';
            bodyText = cleanMarkdown(rawLine.replace('### ', ''));
          } else if (rawLine.startsWith('## ')) {
            blockType = 'h2';
            bodyText = cleanMarkdown(rawLine.replace('## ', ''));
          } else if (rawLine.startsWith('# ')) {
            blockType = 'h1';
            bodyText = cleanMarkdown(rawLine.replace('# ', ''));
          } else if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
            blockType = 'bullet';
            bodyText = '• ' + cleanMarkdown(rawLine.substring(2));
          } else if (/^\d+\.\s/.test(rawLine)) {
            blockType = 'numbered';
            bodyText = cleanMarkdown(rawLine);
          } else {
            bodyText = cleanMarkdown(rawLine);
          }

          // Modern minimal typography selection
          if (blockType === 'h1' || blockType === 'h2') {
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            posY += 2;
          } else if (blockType === 'h3') {
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(16, 185, 129); // Modern clean emerald header accent
            posY += 1.5;
          } else {
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105); // slate-600
          }

          const wrappedTextLines = doc.splitTextToSize(bodyText, 170);
          for (let j = 0; j < wrappedTextLines.length; j++) {
            if (posY > 270) {
              doc.addPage();
              posY = 20;
            }
            const indentX = blockType === 'bullet' ? 24 : 20;
            doc.text(wrappedTextLines[j], indentX, posY);
            posY += 4.5;
          }
          posY += 1.0;
        }
      }

      posY += 8;

      // --- SECTION 5: DAFTAR FEEDBACK DAN REKAPULASI PASIEN (EDITORIAL STYLE LISTING) ---
      if (posY > 230) { doc.addPage(); posY = 20; }
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('IV. REKAPITULASI RESPONS DAN ULASAN PASIEN', 20, posY);
      posY += 4;
      drawLine(posY, [15, 23, 42]);
      posY += 8;

      const itemsToPrint = filteredSurveys.slice(0, 15);
      if (itemsToPrint.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Tidak ada data saran ulasan yang memenuhi filter pencarian.', 20, posY);
      } else {
        itemsToPrint.forEach((survey) => {
          const starsCalc = (Object.values(survey.ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);
          const feedbackMsg = survey.feedback ? `"${survey.feedback}"` : '"Tidak menyertakan masukan tertulis tambahan."';
          
          const cleanCommentStr = cleanMarkdown(feedbackMsg);
          const wrappedCommentLines = doc.splitTextToSize(cleanCommentStr, 163);

          // Calculate height for spacing
          const itemHeight = 10 + (wrappedCommentLines.length * 4.2) + 5;

          if (posY + itemHeight > 270) {
            doc.addPage();
            posY = 20;
          }

          // Modern minimalist layout: No surrounding frame/background card. Only white space and elegant separating rule.
          // Left-side indicator bar representing Sentiment rating (Thin elegant vertical bar on the extreme left margin)
          let barFillColor: [number, number, number] = [100, 116, 139]; // default netral
          if (survey.sentiment === 'positif') barFillColor = [16, 185, 129]; // emerald
          else if (survey.sentiment === 'negatif') barFillColor = [225, 29, 72]; // rose
          
          doc.setFillColor(barFillColor[0], barFillColor[1], barFillColor[2]);
          doc.rect(20, posY + 1, 0.6, itemHeight - 5, 'F'); // ultra-thin 0.6mm sentinel bar

          // Respondent basic metadata details
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          const patientName = survey.name || 'ANONIM';
          doc.text(patientName, 23, posY + 4.5);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          const patientSub = `Kec. ${survey.kecamatan}  |  Usia: ${survey.ageRange} Th  |  JK: ${survey.gender === 'Laki-laki' ? 'L' : 'P'}`;
          doc.text(patientSub, 23 + doc.getTextWidth(patientName) + 3.5, posY + 4.5);

          // Rating display
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`SAMPEL: ${starsCalc} / 5.0 ★`, 190, posY + 4.5, { align: 'right' });

          // Fine detail ratings row
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          const subScores = `Layanan: [ Dr: ${survey.ratings.dokter} | Pr: ${survey.ratings.perawat} | Dftr: ${survey.ratings.pendaftaran} | Fas: ${survey.ratings.fasilitas} | Aptk: ${survey.ratings.farmasi} | Tggu: ${survey.ratings.waktuTunggu} ]`;
          doc.text(subScores, 23, posY + 8.2);

          // Review comment paragraphs
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105); // slate-600

          let commentYVal = posY + 13;
          wrappedCommentLines.forEach((tLine: string) => {
            doc.text(tLine, 23, commentYVal);
            commentYVal += 4.2;
          });

          posY += itemHeight;

          // Understated thin separator between items
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.15);
          doc.line(23, posY - 1.5, 190, posY - 1.5);
          posY += 2;
        });
      }
    }

    // --- FOOTER STAMPING LOOP (PAGE X OF Y) ON EVERY PAGE ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer separating line
      doc.setDrawColor(241, 245, 249); // ultra light slate
      doc.setLineWidth(0.2);
      doc.line(20, 280, 190, 280);
      
      // Footer text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Laporan Resmi Survei IKM • Klinik Sartika Lamongan', 20, 285);
      doc.text(`Halaman ${i} dari ${totalPages}`, 190, 285, { align: 'right' });
    }

    // Save report PDF
    doc.save(`Laporan-IKM-KlinikSartika-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // If user is locked out, render Security Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto" id="passcode-gate-screen">
        <div className="bg-white rounded-none border-t-8 border-indigo-900 shadow-xl p-6 sm:p-8 mt-10">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-900 rounded-none flex items-center justify-center mx-auto mb-3 border-2 border-indigo-900">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight">MANAJEMEN SARTIKA</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">KATA SANDI ADMINISTRATOR</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-widest font-mono">
                SANDI ADMINISTRATOR KLINIK
              </label>
              <input
                type="password"
                placeholder="PROSES_OTENTIKASI..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-none text-slate-900 text-sm focus:outline-hidden focus:border-indigo-900 font-mono text-center tracking-widest"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-none flex items-start gap-2 text-xs text-rose-700 font-extrabold uppercase tracking-tight">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-900 text-white rounded-none text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-indigo-850 transition duration-150 cursor-pointer"
            >
              MASUK TERMINAL ANALITIK
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-admin-view">
      
      {/* Change Password Modal Overlay */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="change-password-modal">
          <div className="bg-white border-t-8 border-indigo-900 shadow-2xl p-6 sm:p-8 max-w-md w-full rounded-none">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-150">
              <Lock className="w-5 h-5 text-indigo-900 shrink-0" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">Ubah Kata Sandi Admin</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-widest font-mono">
                  Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="MINIMAL 4 KARAKTER..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-none text-slate-900 text-sm focus:outline-hidden focus:border-indigo-900 font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-widest font-mono">
                  Konfirmasi Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="ULANGI SANDI BARU..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-none text-slate-900 text-sm focus:outline-hidden focus:border-indigo-900 font-mono tracking-widest text-center"
                />
              </div>

              {passwordChangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold uppercase tracking-wide flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold uppercase tracking-wide flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordChangeError('');
                    setPasswordChangeSuccess('');
                  }}
                  className="px-4 py-2.5 border-2 border-slate-200 hover:border-slate-400 text-slate-600 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-slate-900 text-white rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Simpan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change logo & favicon modal */}
      {isChangingBranding && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="change-branding-modal">
          <div className="bg-white border-t-8 border-indigo-900 shadow-2xl p-6 sm:p-8 max-w-lg w-full rounded-none">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-150">
              <Image className="w-5 h-5 text-indigo-900 shrink-0" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">Ubah Logo & Favicon</h3>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-6">
              
              {/* Logo Section */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">
                  Logo Aplikasi (Maks 512 KB, Disarankan Persegi)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-3 border-2 border-dashed border-slate-200">
                  <div className="col-span-1 flex flex-col items-center justify-center bg-slate-50 p-2 border border-slate-200 h-20 w-20 mx-auto">
                    {logoBase64 ? (
                      <img 
                        src={logoBase64} 
                        alt="Preview Logo" 
                        className="max-h-16 max-w-16 object-contain animate-fade-in"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center font-mono font-bold leading-tight">Default Logo</span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-indigo-900 file:rounded-none file:text-xs file:font-black file:uppercase file:bg-transparent file:text-indigo-900 hover:file:bg-indigo-900 hover:file:text-white file:cursor-pointer transition w-full" 
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Format yang didukung: PNG, JPG, WEBP, atau SVG.</p>
                  </div>
                </div>
              </div>

              {/* Favicon Section */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">
                  Favicon Browser (Maks 512 KB, Rasio 1:1)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-3 border-2 border-dashed border-slate-200">
                  <div className="col-span-1 flex flex-col items-center justify-center bg-slate-50 p-2 border border-slate-200 h-16 w-16 mx-auto">
                    {faviconBase64 ? (
                      <img 
                        src={faviconBase64} 
                        alt="Preview Favicon" 
                        className="h-8 w-8 object-contain animate-fade-in"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center font-mono font-bold leading-tight">Default Icon</span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'favicon')}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-indigo-900 file:rounded-none file:text-xs file:font-black file:uppercase file:bg-transparent file:text-indigo-900 hover:file:bg-indigo-900 hover:file:text-white file:cursor-pointer transition w-full" 
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Ikon kecil yang ditampilkan pada tab browser web Anda.</p>
                  </div>
                </div>
              </div>

              {brandingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold uppercase tracking-wide flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brandingError}</span>
                </div>
              )}

              {brandingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold uppercase tracking-wide flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{brandingSuccess}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetBranding}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Setel Ulang Default
                </button>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingBranding(false);
                      setBrandingError('');
                      setBrandingSuccess('');
                    }}
                    className="px-4 py-2.5 border-2 border-slate-200 hover:border-slate-400 text-slate-600 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-900 hover:bg-slate-900 text-white rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Simpan Branding
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Quick Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-900 text-white p-6 rounded-none border-b-4 border-emerald-500 gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-indigo-950 border border-indigo-800 px-3 py-1 font-mono rounded-none">
            MODE ADMINISTRASI: AKTIF
          </span>
          <h2 className="text-xl font-display font-black text-white m-0 uppercase tracking-tight mt-2.5">E-KEPUASAN KLINIK SARTIKA</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setIsChangingBranding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-950 border-2 border-indigo-800 hover:border-emerald-500 text-indigo-200 hover:text-white rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <Image className="w-3.5 h-3.5" />
            <span>Logo & Favicon</span>
          </button>
          <button
            onClick={() => setIsChangingPassword(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-950 border-2 border-indigo-800 hover:border-emerald-500 text-indigo-200 hover:text-white rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Ubah Sandi</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-emerald-500 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Unduh Laporan PDF</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-950 border-2 border-indigo-800 hover:border-emerald-500 text-indigo-200 hover:text-white rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>

      {totalSurveys === 0 ? (
        <div className="bg-white border-4 border-dashed border-slate-200 p-12 text-center rounded-none max-w-xl mx-auto my-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">BELUM ADA DATA SURVEI</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
            Database saat ini kosong. Silakan beralih ke menu pengisian survei untuk mengirimkan formulir respons baru, atau klik tombol di bawah untuk memuat data percontohan (demo).
          </p>
          {onSeedData && (
            <button
              onClick={onSeedData}
              className="mt-6 px-6 py-3 bg-indigo-900 border-2 border-indigo-900 hover:bg-white hover:text-indigo-900 text-white rounded-none text-xs font-black uppercase tracking-widest transition duration-150 cursor-pointer shadow-sm select-none"
            >
              Muat Data Percontohan (Demo)
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Key Aggregate Bento Layout Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Out of 100 IKM Metric */}
            <div className="bg-white border-t-4 border-indigo-900 rounded-none p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">INDEKS KEPUASAN (IKM)</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-4xl font-display font-black text-slate-900 tracking-tight">{ikmValue}</span>
                  <span className="text-slate-400 text-xs font-bold font-mono">/ 100.0</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1.5 border rounded-none block text-center ${qualitative.color}`}>
                  MUTU UNIT: {qualitative.label}
                </span>
              </div>
            </div>

            {/* Average Rating and Submissions */}
            <div className="bg-white border-t-4 border-indigo-900 rounded-none p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">SKOR INTERNAL RATA-RATA</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-4xl font-display font-black text-slate-900 tracking-tight">{overallRating}</span>
                  <span className="text-slate-400 text-xs font-bold font-mono">/ 5.00 BINTANG</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{totalSurveys} RESPONS TERDATA</span>
              </div>
            </div>

            {/* Sentiment breakdown widget */}
            <div className="bg-white border-t-4 border-indigo-900 rounded-none p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block">KECENDERUNGAN OPINI TEKS</span>
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <div className="bg-slate-50 border-2 border-slate-100 p-2 text-center rounded-none">
                    <span className="text-[8px] text-emerald-600 font-bold block uppercase">POS</span>
                    <span className="text-lg font-black text-slate-800 mt-1 block">{sentimentCounts.positif}</span>
                  </div>
                  <div className="bg-slate-50 border-2 border-slate-100 p-2 text-center rounded-none">
                    <span className="text-[8px] text-amber-600 font-bold block uppercase">NET</span>
                    <span className="text-lg font-black text-slate-800 mt-1 block">{sentimentCounts.netral}</span>
                  </div>
                  <div className="bg-slate-50 border-2 border-slate-100 p-2 text-center rounded-none">
                    <span className="text-[8px] text-rose-600 font-bold block uppercase">NEG</span>
                    <span className="text-lg font-black text-slate-800 mt-1 block">{sentimentCounts.negatif}</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 uppercase font-mono tracking-widest text-center">
                ANALISIS TEKS AUTOMATIK INDIKATIF
              </p>
            </div>

          </div>

          {/* Sector Ratings charts & tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* SVG Visual Bar chart of score per sector */}
            <div className="bg-white border-l-8 border-indigo-900 p-6 rounded-none shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 leading-tight">INDEKS PER SEKTOR LAYANAN KLINIK</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Grafik nilai agregat skor skala 1 sampai 5</p>
              
              <div className="space-y-4">
                {CATEGORY_SPECS.map((spec) => {
                  const score = averages[spec.key];
                  const percentage = (score / 5) * 100;
                  return (
                    <div key={spec.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-slate-700 font-bold uppercase">
                        <span>{spec.title}</span>
                        <span className="font-mono font-black text-indigo-900 bg-slate-50 px-2 py-0.5 border border-slate-200">
                          {score.toFixed(2)} ★ ({(score*20).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-100 rounded-none overflow-hidden relative border border-slate-200 shadow-inner">
                        <div 
                          className={`h-full rounded-none transition-all duration-1000 ${
                            score >= 4.0 
                              ? 'bg-emerald-500' 
                              : score >= 3.0 
                                ? 'bg-indigo-600' 
                                : 'bg-rose-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Age & Demographics stats inside Lamongan */}
            <div className="bg-white border-l-8 border-emerald-500 p-6 rounded-none shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 leading-tight">DISTRIBUSI PASIEN PER WILAYAH</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Pemetaan respon berdasarkan kecamatan domisili</p>

                <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
                  {subdistrictsWithData.map((subdist) => {
                    const count = surveys.filter(s => s.kecamatan === subdist).length;
                    const percent = (count / totalSurveys) * 100;
                    return (
                      <div key={subdist} className="bg-slate-50 border-2 border-slate-100 p-2.5 rounded-none flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-indigo-900"></span>
                          <span className="font-black text-slate-700 uppercase">KEC. {subdist}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[10px]">{percent.toFixed(0)}%</span>
                          <span className="px-2.5 py-1 bg-indigo-900 text-white font-mono font-black rounded-none text-[9px]">
                            {count} PASIEN
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">
                DOMISILI TERAKTIF: <span className="font-extrabold text-indigo-900">{subdistrictsWithData[0] || 'N/A'}</span>
              </div>
            </div>

          </div>

          {/* Gemini AI Mutu Consultant Panel */}
          <div className="bg-indigo-950 border-l-8 border-emerald-500 rounded-none p-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-none mt-1 shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
                    ASISTEN AI MUTU KLINIK SARTIKA
                    <span className="bg-emerald-600 text-slate-950 font-mono text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-none">GEMINI 3.5 FLASH</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed font-sans">
                    Modul audit asisten AI cerdas untuk menganalisis data bintang survei kepuasan, mengidentifikasi bottlenecks pendaftaran & farmasi, serta merancang blueprint solusi taktis 30 hari.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateAiAnalysis}
                disabled={isAiLoading}
                className={`px-5 py-3.5 rounded-none font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 select-none shrink-0 transition-all cursor-pointer ${
                  isAiLoading
                    ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-800 cursor-not-allowed'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-98'
                }`}
                id="generate-ai-analysis-btn"
              >
                <RefreshCw className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'ANALISIS_PROSES...' : 'FORMULASIKAN TINJAUAN MUTU AI'}</span>
              </button>
            </div>

            {/* AI Loading Status cards */}
            {isAiLoading && (
              <div className="mt-6 p-5 bg-slate-950 border-l-2 border-emerald-500 space-y-3 font-mono text-[11px] text-emerald-400 rounded-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-emerald-500 animate-ping"></span>
                  <p className="font-bold uppercase tracking-widest">Memulai pemrosesan umpan balik asisten cerdas...</p>
                </div>
                <div className="space-y-1.5 pl-4 uppercase">
                  <p className={`flex items-center gap-1.5 ${aiLoadStep >= 0 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>[{aiLoadStep >= 0 ? '✔' : ' '}]</span> Memindai respons masuk ({surveys.length} sampel)...
                  </p>
                  <p className={`flex items-center gap-1.5 ${aiLoadStep >= 1 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>[{aiLoadStep >= 1 ? '✔' : ' '}]</span> Mengekstraksi isu pendaftaran & pelayanan...
                  </p>
                  <p className={`flex items-center gap-1.5 ${aiLoadStep >= 2 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>[{aiLoadStep >= 2 ? '✔' : ' '}]</span> Strukturisasi matriks IKM wilayah...
                  </p>
                  <p className={`flex items-center gap-1.5 ${aiLoadStep >= 3 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>[{aiLoadStep >= 3 ? '✔' : ' '}]</span> Menyusun draft solusi strategis...
                  </p>
                </div>
              </div>
            )}

            {/* AI Summary result render */}
            {aiAnalysis && (
              <div className="mt-6 p-6 bg-slate-950 rounded-none border-2 border-indigo-900 text-sm overflow-hidden prose prose-invert max-w-none shadow-inner" id="ai-report-output">
                <div className="flex justify-between items-center pb-4 border-b border-indigo-900 mb-4 flex-wrap gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#10b981] bg-[#10b981]/10 px-3 py-1 border border-[#10b981]/25 rounded-none">
                    LAPORAN RESMI KUALITAS UNIT PELAYANAN - SARTIKA AI
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">SELESAI DIANALISIS</span>
                </div>
                
                {/* Clean inline markdown rendering parser */}
                <div className="space-y-4 font-sans text-slate-200 leading-relaxed max-h-[450px] overflow-y-auto pr-1 select-text">
                  {aiAnalysis.split('\n').map((line, index) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={index} className="text-sm sm:text-base font-black text-emerald-400 pt-3 mt-4 first:pt-0 first:mt-0 uppercase tracking-wider flex items-center gap-1.5">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={index} className="text-base sm:text-lg font-black text-white pt-4 border-b border-indigo-900 pb-1 mt-6 uppercase tracking-widest">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <div key={index} className="flex items-start gap-2 pl-2">
                          <span className="text-emerald-500 mt-1.5 shrink-0">■</span>
                          <span className="text-xs sm:text-sm">{line.replace('- ', '')}</span>
                        </div>
                      );
                    }
                    if (line.trim().startsWith('1. ') || line.trim().startsWith('2. ') || line.trim().startsWith('3. ') || line.trim().startsWith('4. ')) {
                      return <p key={index} className="font-extrabold text-xs sm:text-sm text-emerald-100 pl-2 mt-2 uppercase">{line.trim()}</p>;
                    }
                    return line.trim() ? <p key={index} className="text-xs sm:text-sm text-slate-300 leading-relaxed">{line}</p> : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Feedback list tables & details stream */}
          <div className="bg-white border-t-4 border-indigo-900 rounded-none p-5 shadow-sm">
            
            {/* Table Filters header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">REKAPITULASI RESPONS PASIEN</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Daftar {filteredSurveys.length} dari {surveys.length} entri sesuai kriteria</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
                {/* Keyword Search field */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Alat penelusur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 border-2 border-slate-200 rounded-none text-xs text-slate-800 focus:outline-hidden focus:border-indigo-900 w-full sm:w-44 font-bold"
                  />
                </div>

                {/* Sentiment filter */}
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="px-2.5 py-2 border-2 border-slate-200 rounded-none text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:border-indigo-900"
                >
                  <option value="semua">SENTIMEN: SEMUA</option>
                  <option value="positif">HANYA POSITIF</option>
                  <option value="netral">HANYA NETRAL</option>
                  <option value="negatif">HANYA NEGATIF</option>
                </select>

                <button
                  type="button"
                  onClick={onClearSurveys}
                  className="flex items-center gap-1.5 px-3 py-2 border-2 border-rose-300 text-rose-700 hover:bg-rose-50 rounded-none text-xs transition font-black uppercase tracking-wider"
                  title="Kosongkan Semua"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SETEL ULANG DATA</span>
                </button>
              </div>

            </div>

            {/* List entries layout */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredSurveys.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 italic uppercase font-mono tracking-widest">
                  TIDAK ADA DATA REKAP YANG COCOK DENGAN FILTER.
                </div>
              ) : (
                filteredSurveys.map((survey) => {
                  const starsAvg = Object.values(survey.ratings).reduce((a, b) => a + b, 0) / 6;
                  return (
                    <div key={survey.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 pr-1" id={`feed-entry-${survey.id}`}>
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-indigo-50 border-2 border-indigo-900 rounded-none hidden sm:flex items-center justify-center text-indigo-900 shrink-0 font-display font-black text-sm uppercase">
                        {survey.name && survey.name !== 'Anonim' ? survey.name.substring(0, 2) : 'AN'}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start flex-wrap gap-1">
                          <div>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                              {survey.name || 'ANONIM'}
                            </span>
                            <span className="text-[9px] text-slate-500 ml-2 font-mono uppercase font-semibold">
                              (DOMISILI: KEC. {survey.kecamatan} • {survey.ageRange} TAHUN • {survey.gender.toUpperCase()})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(survey.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Stars snapshot */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[10px]">
                          <span className="font-mono bg-indigo-900 text-white px-2 py-0.5 rounded-none font-black uppercase text-[9px] tracking-wider">
                            RATA-RATA: {starsAvg.toFixed(1)} / 5
                          </span>
                          <p className="text-slate-600 flex flex-wrap gap-x-2.5 font-bold text-[9px] uppercase font-mono bg-slate-50 border border-slate-200 px-2 py-0.5">
                            <span>DAFTAR: {survey.ratings.pendaftaran}★</span>
                            <span>DOKTER: {survey.ratings.dokter}★</span>
                            <span>PERAWAT: {survey.ratings.perawat}★</span>
                            <span>FASILITAS: {survey.ratings.fasilitas}★</span>
                            <span>MEDIS: {survey.ratings.farmasi}★</span>
                            <span>ANTRE: {survey.ratings.waktuTunggu}★</span>
                          </p>
                        </div>

                        <p className="text-xs text-slate-700 mt-2.5 bg-slate-50 border-l-4 border-indigo-900 px-3 py-2.5 rounded-none italic leading-relaxed font-sans">
                          "{survey.feedback || 'TIDAK MEMBERI PESAN TAMBAHAN.'}"
                        </p>
                      </div>

                      {/* Explicit Action Column */}
                      <button
                        onClick={() => onDeleteSurvey(survey.id)}
                        className="text-slate-300 hover:text-rose-600 hover:bg-slate-50 p-2 rounded-none transition h-fit shrink-0 self-center"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </>
      )}

    </div>
  );
}
