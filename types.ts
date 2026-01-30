export interface StaffData {
  BIL: string;
  NAMA: string;
  NO_KAD_PENGENALAN: string;
  JAWATAN: string;
  GRED: string;
  NO_GAJI: string;
  AGAMA: string;
  NO_KWSP: string;
  TARIKH_PENGESAHAN_LANTIKAN: string;
  TARIKH_PENGESAHAN_DALAM_PERKHIDMATAN: string;
  TARIKH_TARAF_BERPENCEN: string;
  TARIKH_BERSARA: string;
  SKIM_PENCEN_KWSP: string;
  UMUR_BERSARA: string;
  KUATERS_KERAJAAN: string;
  NO_TEL: string;
  ALAMAT_TERKINI: string;
  TARIKH_LANTIKAN_PERTAMA: string;
  TARIKH_KENAIKAN_PANGKAT_1: string;
  TARIKH_KENAIKAN_PANGKAT_2: string;
  TARIKH_KENAIKAN_PANGKAT_3: string;
  FASA_1: string;
  FASA_2: string;
  URUSAN_KENAIKAN_PANGKAT_MANUAL: string;
  STATUS_SEMASA_URUSAN: string;
  TARIKH_LAPOR_DIRI: string;
  TARIKH_KELUAR: string;
  [key: string]: string; // Index signature for dynamic access
}

export const CSV_HEADERS = [
  "BIL",
  "NAMA",
  "NO KAD PENGENALAN",
  "JAWATAN",
  "GRED",
  "NO GAJI",
  "AGAMA",
  "NO KWSP",
  "TARIKH PENGESAHAN LANTIKAN",
  "TARIKH PENGESAHAN DALAM PERKHIDMATAN",
  "TARIKH TARAF BERPENCEN",
  "TARIKH BERSARA",
  "SKIM PENCEN / KWSP",
  "UMUR BERSARA (TAHUN)",
  "KUATERS KERAJAAN",
  "NO TEL",
  "ALAMAT TERKINI",
  "Tarikh Lantikan Pertama\nGuru - DG5/DG9\nAKP - N1",
  "Tarikh Kenaikan Pangkat \nGuru - DG6/DG10\nAKP - N2",
  "Tarikh Kenaikan Pangkat\nGuru - DG7/DG12\nAKP - N3",
  "Tarikh Kenaikan Pangkat\nGuru - DG8/DG13\nAKP - N4",
  "Fasa 1 - Lantikan bulan Januari-Jun\n\n(Sila tandakan / jika terlibat)",
  "Fasa 2 - Lantikan bulan \nJulai - Disember \n\n(Sila tandakan / jika terlibat)",
  "Urusan Kenaikan Pangkat Manual ( Kes-kes Khas)",
  "Status Semasa Urusan Kenaikan Pangkat",
  "Tarikh Lapor Diri di \nSK Sri Aman",
  "Tarikh Keluar dari SK Sri Aman (diisi oleh Pejabat)"
];

// Mapping friendly keys to CSV indices (based on the order in CSV_HEADERS)
export const HEADER_KEY_MAP: Record<string, string> = {
  BIL: "BIL",
  NAMA: "NAMA",
  NO_KAD_PENGENALAN: "NO KAD PENGENALAN",
  JAWATAN: "JAWATAN",
  GRED: "GRED",
  NO_GAJI: "NO GAJI",
  AGAMA: "AGAMA",
  NO_KWSP: "NO KWSP",
  TARIKH_PENGESAHAN_LANTIKAN: "TARIKH PENGESAHAN LANTIKAN",
  TARIKH_PENGESAHAN_DALAM_PERKHIDMATAN: "TARIKH PENGESAHAN DALAM PERKHIDMATAN",
  TARIKH_TARAF_BERPENCEN: "TARIKH TARAF BERPENCEN",
  TARIKH_BERSARA: "TARIKH BERSARA",
  SKIM_PENCEN_KWSP: "SKIM PENCEN / KWSP",
  UMUR_BERSARA: "UMUR BERSARA (TAHUN)",
  KUATERS_KERAJAAN: "KUATERS KERAJAAN",
  NO_TEL: "NO TEL",
  ALAMAT_TERKINI: "ALAMAT TERKINI",
  TARIKH_LANTIKAN_PERTAMA: "Tarikh Lantikan Pertama\nGuru - DG5/DG9\nAKP - N1",
  TARIKH_KENAIKAN_PANGKAT_1: "Tarikh Kenaikan Pangkat \nGuru - DG6/DG10\nAKP - N2",
  TARIKH_KENAIKAN_PANGKAT_2: "Tarikh Kenaikan Pangkat\nGuru - DG7/DG12\nAKP - N3",
  TARIKH_KENAIKAN_PANGKAT_3: "Tarikh Kenaikan Pangkat\nGuru - DG8/DG13\nAKP - N4",
  FASA_1: "Fasa 1 - Lantikan bulan Januari-Jun\n\n(Sila tandakan / jika terlibat)",
  FASA_2: "Fasa 2 - Lantikan bulan \nJulai - Disember \n\n(Sila tandakan / jika terlibat)",
  URUSAN_KENAIKAN_PANGKAT_MANUAL: "Urusan Kenaikan Pangkat Manual ( Kes-kes Khas)",
  STATUS_SEMASA_URUSAN: "Status Semasa Urusan Kenaikan Pangkat",
  TARIKH_LAPOR_DIRI: "Tarikh Lapor Diri di \nSK Sri Aman",
  TARIKH_KELUAR: "Tarikh Keluar dari SK Sri Aman (diisi oleh Pejabat)"
};