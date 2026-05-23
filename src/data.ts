import { SurveyResponse, CategorySpec } from './types';

export const KECAMATAN_LAMONGAN = [
  'Babalan',
  'Babat',
  'Bluluk',
  'Brondong',
  'Deket',
  'Glagah',
  'Kalitengah',
  'Karangbinangun',
  'Karanggeneng',
  'Kedungpring',
  'Kembangbahu',
  'Lamongan Kota',
  'Laren',
  'Maduran',
  'Mantup',
  'Modo',
  'Ngimbang',
  'Paciran',
  'Pucuk',
  'Sambeng',
  'Sarirejo',
  'Sekaran',
  'Solokuro',
  'Sugio',
  'Sukodadi',
  'Sukorame',
  'Tikung'
];

export const CATEGORY_SPECS: CategorySpec[] = [
  {
    key: 'pendaftaran',
    title: 'Pendaftaran & Administrasi',
    description: 'Kemudahan pendaftaran, kejelasan alur pelayanan, serta keramahan petugas admisi.',
    iconName: 'UserCheck'
  },
  {
    key: 'dokter',
    title: 'Pelayanan Medis (Dokter)',
    description: 'Kejelasan penjelasan dokter, keramahan, ketelitian pemeriksaan, dan keahlian medis.',
    iconName: 'Stethoscope'
  },
  {
    key: 'perawat',
    title: 'Pelayanan Keperawatan & Kebidanan',
    description: 'Kecepatan respon perawat/bidan, keramahan, dan ketelitian tindakan perawatan.',
    iconName: 'HeartHandshake'
  },
  {
    key: 'fasilitas',
    title: 'Sarana & Prasarana Klinik',
    description: 'Kebersihan toilet/ruang tunggu, kesejukan ruangan, kenyamanan tempat duduk, dan ketersediaan air bersih.',
    iconName: 'Building2'
  },
  {
    key: 'farmasi',
    title: 'Pelayanan Farmasi / Apotek',
    description: 'Kecepatan penyiapan obat, keramahan apoteker, dan kejelasan informasi cara minum obat.',
    iconName: 'Pills'
  },
  {
    key: 'waktuTunggu',
    title: 'Efisiensi Waktu Tunggu',
    description: 'Ketepatan jadwal mulai pelayanan dan durasi tunggu dari daftar hingga diperiksa.',
    iconName: 'Clock'
  }
];

export const INITIAL_SURVEYS: SurveyResponse[] = [
  {
    id: 's1',
    timestamp: '2026-05-20T08:30:00Z',
    name: 'Retno Wahyuni',
    ageRange: '26-35',
    gender: 'Perempuan',
    kecamatan: 'Lamongan Kota',
    ratings: {
      pendaftaran: 5,
      dokter: 5,
      perawat: 5,
      fasilitas: 4,
      farmasi: 5,
      waktuTunggu: 4
    },
    feedback: 'Pelayanan dokter sangat memuaskan dan ramah sekali. Penjelasan tentang penyakit sangat mudah dipahami.',
    sentiment: 'positif'
  },
  {
    id: 's2',
    timestamp: '2026-05-20T10:15:00Z',
    name: 'Sutrisno',
    ageRange: '46-55',
    gender: 'Laki-laki',
    kecamatan: 'Babat',
    ratings: {
      pendaftaran: 4,
      dokter: 4,
      perawat: 4,
      fasilitas: 3,
      farmasi: 3,
      waktuTunggu: 2
    },
    feedback: 'Waktu tunggu di bagian farmasi mohon dipercepat, antrean obat cukup padat di siang hari.',
    sentiment: 'netral'
  },
  {
    id: 's3',
    timestamp: '2026-05-21T09:05:00Z',
    name: 'Anonim',
    ageRange: '18-25',
    gender: 'Perempuan',
    kecamatan: 'Sukodadi',
    ratings: {
      pendaftaran: 5,
      dokter: 5,
      perawat: 5,
      fasilitas: 5,
      farmasi: 4,
      waktuTunggu: 5
    },
    feedback: 'Klinik Sartika Lamongan luar biasa bersih dan adem ruang tunggunya. Perawatnya sigap membantu nenek saya yang pakai kursi roda.',
    sentiment: 'positif'
  },
  {
    id: 's4',
    timestamp: '2026-05-21T14:40:00Z',
    name: 'Hadi Wijaya',
    ageRange: '36-45',
    gender: 'Laki-laki',
    kecamatan: 'Paciran',
    ratings: {
      pendaftaran: 3,
      dokter: 5,
      perawat: 4,
      fasilitas: 4,
      farmasi: 4,
      waktuTunggu: 3
    },
    feedback: 'Dokternya teliti periksa anak saya yang sedang demam. Pendaftaran online kalau bisa diadakan biar tidak antre datang langsung.',
    sentiment: 'positif'
  },
  {
    id: 's5',
    timestamp: '2026-05-22T08:12:00Z',
    name: 'Aminah',
    ageRange: '>55',
    gender: 'Perempuan',
    kecamatan: 'Mantup',
    ratings: {
      pendaftaran: 4,
      dokter: 4,
      perawat: 4,
      fasilitas: 4,
      farmasi: 4,
      waktuTunggu: 4
    },
    feedback: 'Alhamdulillah pelayanannya bagus dan sopan-sopan petugasnya. Obatnya manjur.',
    sentiment: 'positif'
  },
  {
    id: 's6',
    timestamp: '2026-05-22T11:55:00Z',
    name: 'Dwi Cahyo',
    ageRange: '18-25',
    gender: 'Laki-laki',
    kecamatan: 'Deket',
    ratings: {
      pendaftaran: 2,
      dokter: 4,
      perawat: 3,
      fasilitas: 4,
      farmasi: 5,
      waktuTunggu: 2
    },
    feedback: 'Petugas pendaftaran judes sekali wajahnya, tidak ramah menyambut pasien baru. Tapi farmasi obatnya sangat cepat.',
    sentiment: 'negatif'
  },
  {
    id: 's7',
    timestamp: '2026-05-22T15:20:00Z',
    name: 'Lilis Setyowati',
    ageRange: '26-35',
    gender: 'Perempuan',
    kecamatan: 'Tikung',
    ratings: {
      pendaftaran: 4,
      dokter: 5,
      perawat: 5,
      fasilitas: 5,
      farmasi: 4,
      waktuTunggu: 4
    },
    feedback: 'Suka sekali dengan kebersihan klinik Sartika. Bidan andalannya sabar dan melayani dengan segenap hati.',
    sentiment: 'positif'
  },
  {
    id: 's8',
    timestamp: '2026-05-23T07:45:00Z',
    name: 'Anonim',
    ageRange: '36-45',
    gender: 'Laki-laki',
    kecamatan: 'Solokuro',
    ratings: {
      pendaftaran: 3,
      dokter: 4,
      perawat: 4,
      fasilitas: 5,
      farmasi: 3,
      waktuTunggu: 3
    },
    feedback: 'Secara umum cukup memuaskan, hanya toilet dekat musholla agak bau, mohon sering dibersihkan oleh petugas kebersihan.',
    sentiment: 'netral'
  }
];
