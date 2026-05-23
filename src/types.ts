export interface SurveyResponse {
  id: string;
  timestamp: string;
  name?: string;
  ageRange: string;
  gender: 'Laki-laki' | 'Perempuan' | 'Tidak Menyebutkan';
  kecamatan: string;
  ratings: {
    pendaftaran: number; // Registrasi / Pendaftaran
    dokter: number;      // Pelayanan Dokter
    perawat: number;     // Pelayanan Perawat / Bidan
    fasilitas: number;   // Fasilitas & Kebersihan
    farmasi: number;     // Pelayanan Farmasi / Apotek
    waktuTunggu: number; // Waktu Tunggu
  };
  feedback: string;
  sentiment?: 'positif' | 'netral' | 'negatif';
}

export interface MetricSummary {
  averageRating: number;
  totalSurveys: number;
  percentagePositive: number;
  byCategory: {
    pendaftaran: number;
    dokter: number;
    perawat: number;
    fasilitas: number;
    farmasi: number;
    waktuTunggu: number;
  };
  byKecamatan: Record<string, number>;
  byAgeRange: Record<string, number>;
  bySentiment: {
    positif: number;
    netral: number;
    negatif: number;
  };
}

export type SurveyCategoryKey = 'pendaftaran' | 'dokter' | 'perawat' | 'fasilitas' | 'farmasi' | 'waktuTunggu';

export interface CategorySpec {
  key: SurveyCategoryKey;
  title: string;
  description: string;
  iconName: string;
}
