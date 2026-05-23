import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry headers
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WAKING UP: GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiClient();

// API endpoint for analyzing survey responses using Gemini 3.5 Flash
app.post("/api/analyze", async (req, res) => {
  try {
    const { surveys } = req.body;
    if (!surveys || !Array.isArray(surveys)) {
      return res.status(400).json({ error: "Missing or invalid surveys data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        analysis: "### Mode Simulasi (Kunci API Gemini Belum Dikonfigurasi)\n\n" +
          "Untuk mengaktifkan ringkasan AI interaktif ini, silakan pasang kunci API `GEMINI_API_KEY` di panel **Settings > Secrets**.\n\n" +
          "**Analisis Tingkat Tinggi Otomatis (Simulasi):**\n" +
          "- **Kekuatan Utama:** Pelayanan Medis / Kompetensi Dokter mendapatkan skor tertinggi. Pasien sangat mengapresiasi kejelasan penjelasan dokter.\n" +
          "- **Area Perbaikan Kritis:** Waktu tunggu pelayanan dan administrasi pendaftaran secara offline perlu dioptimalkan.\n" +
          "- **Saran Sistem:** Terapkan sistem reservasi berbasis antrean online WhatsApp untuk wilayah Lamongan agar penumpukan pasien di ruang tunggu berkurang."
      });
    }

    // Format the database records compactly for the prompt
    const formattedSurveys = surveys.map((s: any) => ({
      usia: s.ageRange,
      gender: s.gender,
      kecamatan: s.kecamatan,
      ratings: s.ratings,
      saran: s.feedback,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Anda adalah Konsultan Manajemen Mutu Rumah Sakit dan Klinik berpengalaman di Jawa Timur, Indonesia. 
Analisis data survei kepuasan pasien berikut untuk "Klinik Sartika Lamongan" (Klinik Pratama/Utama yang menyediakan rawat jalan, pelayanan umum, kebidanan, apotek, dan pendaftaran).

Berikut adalah data umpan balik nyata dari pasien terenkripsi:
${JSON.stringify(formattedSurveys, null, 2)}

Tugas Anda adalah memformulasikan Ringkasan Laporan Mutu Pelayanan Eksekutif dalam Bahasa Indonesia yang formal, taktis, berwibawa, dan sangat rinci. Format keluaran harus berupa Markdown terstruktur yang rapi dengan bagian-bagian berikut:

### 🌟 Executive Overview & Nilai IKM
(Sebutkan ringkasan singkat kinerja Klinik Sartika Lamongan saat ini berdasarkan agregat rating. Hubungkan dengan demografi daerah kabupaten Lamongan jika relevan).

### 💪 Kekuatan Utama Pelayanan (Kelebihan)
(Ulik area pelayanan mana saja yang memiliki performa bintang 5, didukung oleh bukti komentar spesifik atau skor rata-rata).

### ⚠️ Titik Kritis Perbaikan (Kelemahan & Botol Leher)
(Analisis keluhan pasien secara mendalam. Misal masalah waktu tunggu, keramahan petugas pendaftaran, sarana kebersihan, atau farmasi obat. Berikan analisis akar masalah/Root Cause Analysis sederhana).

### 📋 Rencana Aksi Pembenahan Mutu (30-Day Action Plan)
Berikan langkah konkret jangka pendek yang taktis, terukur dan relevan untuk wilayah Lamongan (misal integrasi WhatsApp pendaftaran online, evaluasi keramahan front-office dengan SOP Salam-Sapa-Senyum, optimalisasi operasional apotek). Pisahkan atas divisi:
1. **Front Office & Admisi (Pendaftaran)**
2. **Pelayanan Medis & Keperawatan**
3. **Farmasi & Logistik Obat**
4. **Fasilitas & Sanitasi Umum**

Pastikan bahasa Anda sopan, membangkitkan semangat peningkatan mutu klinis, dan profesional.`
        }
      ],
      config: {
        temperature: 0.7,
      },
    });

    const analysisText = response.text || "Gagal menghasilkan analisis.";
    res.json({ analysis: analysisText });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "Internal server error occurred" });
  }
});

// Serve frontend build output or run Vite dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[E-Kepuasan Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
