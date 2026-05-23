import React from 'react';
import { 
  Building, UserCheck, Stethoscope, HeartHandshake, Building2, Pill, Clock, 
  Trash2, ShieldCheck, RefreshCw, Sparkles, LogOut, CheckCircle2, Search, Filter, AlertTriangle, ChevronRight, User,
  FileDown
} from 'lucide-react';
import { SurveyResponse } from '../types';
import { CATEGORY_SPECS } from '../data';
import { jsPDF } from 'jspdf';

interface AdminDashboardProps {
  surveys: SurveyResponse[];
  onClearSurveys: () => void;
  onDeleteSurvey: (id: string) => void;
  onSeedData?: () => void;
}

export default function AdminDashboard({ surveys, onClearSurveys, onDeleteSurvey, onSeedData }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSentiment, setSelectedSentiment] = React.useState<string>('semua');
  const [selectedSubdistrict, setSelectedSubdistrict] = React.useState<string>('semua');

  // AI State
  const [aiAnalysis, setAiAnalysis] = React.useState<string>('');
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiLoadStep, setAiLoadStep] = React.useState(0);

  // Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sartika123') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Sandi Klinik salah!');
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

  // High Fidelity PDF Generator using jsPDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let posY = 20;

    // Helper to draw horizontal line
    const drawLine = (y: number, color: [number, number, number] = [226, 232, 240]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
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

    // --- PAGE 1 HEADER: KOP SURAT ---
    // Deep Indigo Header Bar
    doc.setFillColor(30, 27, 75); // Indigo-900
    doc.rect(15, posY, 180, 26, 'F');

    // Accent Line at the bottom of header bar
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(15, posY + 25.4, 180, 0.6, 'F');

    // Header Content
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('KLINIK SARTIKA LAMONGAN', 22, posY + 10);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(167, 139, 250); // violet-400
    doc.text('LAPORAN RESMI EVALUASI & SURVEY KEPUASAN PELAYANAN (IKM)', 22, posY + 17);

    // Date metadata Print (Right-aligned inside header)
    doc.setTextColor(224, 242, 254);
    doc.setFontSize(7.5);
    const currentDateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Dicetak: ${currentDateStr}`, 190, posY + 10, { align: 'right' });

    posY += 34;

    // --- SECTION 1: RINGKASAN METRIK UTAMA (BENTO GRID STYLE) ---
    doc.setTextColor(30, 27, 75);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('I. RINGKASAN METRIK UTAMA', 15, posY);
    posY += 4;
    drawLine(posY, [79, 70, 229]); // Indigo-600
    posY += 6;

    // Draw 3 Bento Box Grid Cards
    const boxY = posY;
    const boxHeight = 28;
    const boxWidth = 56;
    const boxGap = 6;

    // Bento 1: IKM VALUE
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.rect(15, boxY, boxWidth, boxHeight, 'DF');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('INDEKS KEPUASAN (IKM)', 19, boxY + 6);
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text(`${ikmValue}`, 19, boxY + 15);
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.text(`/ 100.0 (${qualitative.label})`, 19, boxY + 22);

    // Bento 2: RATING BINTANG
    doc.setFillColor(248, 250, 252);
    doc.rect(15 + boxWidth + boxGap, boxY, boxWidth, boxHeight, 'DF');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('RATA-RATA BINTANG', 15 + boxWidth + boxGap + 4, boxY + 6);
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text(`${overallRating} / 5.00`, 15 + boxWidth + boxGap + 4, boxY + 15);
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Sampel: ${totalSurveys} Responden`, 15 + boxWidth + boxGap + 4, boxY + 22);

    // Bento 3: OPINI SENTIMEN
    doc.setFillColor(248, 250, 252);
    doc.rect(15 + (boxWidth * 2) + (boxGap * 2), boxY, boxWidth, boxHeight, 'DF');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('KECENDERUNGAN SENTIMEN', 15 + (boxWidth * 2) + (boxGap * 2) + 4, boxY + 6);
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // Positif Green
    doc.text(`Positif: ${sentimentCounts.positif} ulasan`, 15 + (boxWidth * 2) + (boxGap * 2) + 4, boxY + 12);
    doc.setTextColor(217, 119, 6); // Netral Orange
    doc.text(`Netral: ${sentimentCounts.netral} ulasan`, 15 + (boxWidth * 2) + (boxGap * 2) + 4, boxY + 18);
    doc.setTextColor(225, 29, 72); // Negatif Rose
    doc.text(`Negatif: ${sentimentCounts.negatif} ulasan`, 15 + (boxWidth * 2) + (boxGap * 2) + 4, boxY + 24);

    posY += boxHeight + 12;

    // --- SECTION 2: SKOR DETAIL PER SEKTOR (PRECISION GRAPHICS) ---
    doc.setTextColor(30, 27, 75);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('II. VALUE INDEKS PER SEKTOR LAYANAN', 15, posY);
    posY += 4;
    drawLine(posY, [79, 70, 229]);
    posY += 8;

    CATEGORY_SPECS.forEach((spec) => {
      const score = averages[spec.key];
      
      // Sektor Name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(spec.title.toUpperCase(), 15, posY + 3);

      // Score Text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 27, 75);
      doc.text(`${score.toFixed(2)} / 5.00`, 75, posY + 3);

      // Progress bar background sleeve
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(112, posY, 83, 3.5, 'F');
      
      // Colored Progress bar fill representation
      const percentage = (score / 5);
      const fillWidth = percentage * 83;
      if (score >= 4.2) {
        doc.setFillColor(16, 185, 129); // emerald-500
      } else if (score >= 3.0) {
        doc.setFillColor(79, 70, 229); // indigo-600
      } else {
        doc.setFillColor(239, 68, 68); // red-500
      }
      doc.rect(112, posY, fillWidth, 3.5, 'F');

      posY += 7.2;
    });

    posY += 8;

    // --- SECTION 3: DISTRIBUSI WILAYAH DOMISILI (GRID ALIGNMENT) ---
    if (posY > 235) { doc.addPage(); posY = 20; }
    doc.setTextColor(30, 27, 75);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('III. DISTRIBUSI WILAYAH DOMISILI', 15, posY);
    posY += 4;
    drawLine(posY, [79, 70, 229]);
    posY += 8;

    const subdistList = subdistrictsWithData.filter(sub => sub.trim().length > 0);
    if (subdistList.length === 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Tidak ada data penandaan wilayah.', 15, posY);
      posY += 6;
    } else {
      let isCol2 = false;
      let startY = posY;
      doc.setFontSize(8.5);

      subdistList.forEach((subdist, idx) => {
        const count = surveys.filter(s => s.kecamatan === subdist).length;
        const percent = ((count / totalSurveys) * 100).toFixed(0);
        
        const colX = isCol2 ? 110 : 15;
        const curY = isCol2 ? startY + (Math.floor(idx / 2) * 6.5) : posY;

        if (curY > 265) {
          doc.addPage();
          posY = 20;
          startY = 20;
        }

        // Title and Value aligned perfectly
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(`KEC. ${subdist.toUpperCase()}`, colX, curY);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${count} Responden (${percent}%)`, colX + 50, curY);

        if (!isCol2) {
          posY += 6.5;
        }
        isCol2 = !isCol2;
      });

      if (isCol2) {
        posY += 6.5;
      }
    }

    posY += 8;

    // --- SECTION 4: TINJAUAN MUTU OLEH SARTIKA AI (ELEGANT BULLETS & TEXT WRAPPING) ---
    if (aiAnalysis) {
      if (posY > 230) { doc.addPage(); posY = 20; }
      doc.setTextColor(30, 27, 75);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('IV. TINJAUAN MUTU STRATEGIS SARTIKA AI', 15, posY);
      posY += 4;
      drawLine(posY, [16, 185, 129]); // Emerald-500 Accent
      posY += 8;

      const lines = aiAnalysis.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        let level = 'normal';
        let textToPrint = rawLine;

        if (rawLine.startsWith('### ')) {
          level = 'h3';
          textToPrint = '✦  ' + cleanMarkdown(rawLine.replace('### ', '')).toUpperCase();
        } else if (rawLine.startsWith('## ')) {
          level = 'h2';
          textToPrint = '■  ' + cleanMarkdown(rawLine.replace('## ', '')).toUpperCase();
        } else if (rawLine.startsWith('# ')) {
          level = 'h1';
          textToPrint = cleanMarkdown(rawLine.replace('# ', '')).toUpperCase();
        } else if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
          level = 'bullet';
          textToPrint = '•  ' + cleanMarkdown(rawLine.substring(2));
        } else if (/^\d+\.\s/.test(rawLine)) {
          level = 'numbered';
          textToPrint = cleanMarkdown(rawLine);
        } else {
          textToPrint = cleanMarkdown(rawLine);
        }

        // Typography styling
        if (level === 'h1' || level === 'h2') {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(30, 27, 75);
          posY += 3;
        } else if (level === 'h3') {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(16, 185, 129);
          posY += 2;
        } else {
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
        }

        // Core wrapping
        const printableWidth = level === 'bullet' ? 175 : 180;
        const wrappedLines = doc.splitTextToSize(textToPrint, printableWidth);
        for (let j = 0; j < wrappedLines.length; j++) {
          if (posY > 270) {
            doc.addPage();
            posY = 20;
          }
          const textX = level === 'bullet' ? 20 : 15;
          doc.text(wrappedLines[j], textX, posY);
          posY += 4.5;
        }

        posY += 1.2; // vertical gap
      }
    }

    posY += 8;

    // --- SECTION 5: DAFTAR MASUKAN & SARAN PASIEN (BEAUTIFULLY STYLED FEEDBACK CARDS) ---
    if (posY > 230) { doc.addPage(); posY = 20; }
    doc.setTextColor(30, 27, 75);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('V. REKAPITULASI RESPONS DAN SARAN PASIEN', 15, posY);
    posY += 4;
    drawLine(posY, [79, 70, 229]);
    posY += 8;

    const printSurveys = filteredSurveys.slice(0, 15);
    if (printSurveys.length === 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Tidak ada ulasan pasien yang cocok dengan filter aktif.', 15, posY);
    } else {
      printSurveys.forEach((survey) => {
        const starsAvg = (Object.values(survey.ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);
        const commentsText = survey.feedback ? `"${survey.feedback}"` : '"Tidak memberi ulasan tertulis."';
        
        // Wrap feedback comment text inside card
        const cleanComment = cleanMarkdown(commentsText);
        const wrappedComment = doc.splitTextToSize(cleanComment, 168);
        const cardHeight = 12 + (wrappedComment.length * 4.2) + 6; // text rows + info rows + card clearance

        if (posY + cardHeight > 270) {
          doc.addPage();
          posY = 20;
        }

        // Draw Card Surrounding Box with soft gray fill and light border
        doc.setFillColor(248, 250, 252); // slate-100/50
        doc.setDrawColor(226, 232, 240); // slate-200 border
        doc.setLineWidth(0.35);
        doc.rect(15, posY, 180, cardHeight, 'DF');

        // Draw Left vertical colored indicator bar representing Sentiment rating
        // 'positif' -> emerald, 'negatif' -> rose-600, 'netral' -> indigo-600
        let sentimentColor: [number, number, number] = [79, 70, 229]; // Indigo
        if (survey.sentiment === 'positif') sentimentColor = [16, 185, 129];
        else if (survey.sentiment === 'negatif') sentimentColor = [225, 29, 72];
        doc.setFillColor(sentimentColor[0], sentimentColor[1], sentimentColor[2]);
        doc.rect(15, posY, 1.8, cardHeight, 'F');

        // Card Metadata Title block
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42); // slate-900
        const nameTag = survey.name || 'ANONIM';
        doc.text(nameTag, 20, posY + 5.5);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // slate-500
        const detailsTag = `Kec. ${survey.kecamatan}  |  Usia: ${survey.ageRange} Th  |  JK: ${survey.gender === 'Laki-laki' ? 'L' : 'P'}`;
        doc.text(detailsTag, 20 + doc.getTextWidth(nameTag) + 4, posY + 5.5);

        // Right-aligned Stars summary
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text(`★ REKAP: ${starsAvg} / 5.0`, 190, posY + 5.5, { align: 'right' });

        // Service snapshot subtext
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const ratingsSnapshot = `Pelayanan: [ Pendaftaran: ${survey.ratings.pendaftaran}★ | Dokter: ${survey.ratings.dokter}★ | Perawat: ${survey.ratings.perawat}★ | Fasilitas: ${survey.ratings.fasilitas}★ | Farmasi: ${survey.ratings.farmasi}★ | Tunggu: ${survey.ratings.waktuTunggu}★ ]`;
        doc.text(ratingsSnapshot, 20, posY + 10);

        // Thin separator inside card
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(20, posY + 11.5, 190, posY + 11.5);

        // Comment block printout
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        
        let commentLineY = posY + 15.5;
        wrappedComment.forEach((line: string) => {
          doc.text(line, 20, commentLineY);
          commentLineY += 4.2;
        });

        posY += cardHeight + 4; // block container gap
      });
    }

    // --- FOOTER STAMPING LOOP (PAGE X OF Y) ON EVERY PAGE ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer separating line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(15, 282, 195, 282);
      
      // Footer text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('Laporan Resmi IKM • Klinik Sartika Lamongan', 15, 287);
      doc.text(`Halaman ${i} dari ${totalPages}`, 195, 287, { align: 'right' });
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
      
      {/* Admin Quick Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-900 text-white p-6 rounded-none border-b-4 border-emerald-500 gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-indigo-950 border border-indigo-800 px-3 py-1 font-mono rounded-none">
            MODE ADMINISTRASI: AKTIF
          </span>
          <h2 className="text-xl font-display font-black text-white m-0 uppercase tracking-tight mt-2.5">E-KEPUASAN ANALYTICAL TERMINAL</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
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
