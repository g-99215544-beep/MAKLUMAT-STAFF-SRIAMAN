import React, { useState, useEffect, useMemo } from 'react';
import { parseCSV, exportToCSV } from './utils/csvHelper';
import { 
  INITIAL_CSV_DATA, 
  OPTIONS_JAWATAN, 
  OPTIONS_AGAMA, 
  OPTIONS_SKIM_PENCEN, 
  OPTIONS_KUATERS, 
  OPTIONS_URUSAN_MANUAL, 
  OPTIONS_STATUS_URUSAN 
} from './constants';
import { StaffData, CSV_HEADERS, HEADER_KEY_MAP } from './types';
import { Input } from './components/Input';
import { Search, Save, User, LogOut, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [allStaff, setAllStaff] = useState<StaffData[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffData | null>(null);
  const [icInput, setIcInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Initialize Data
  useEffect(() => {
    // In a real app, this might fetch from an API
    // Here we load from the constant, simulating the spreadsheet
    const data = parseCSV(INITIAL_CSV_DATA);
    setAllStaff(data);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = icInput.replace(/[^0-9]/g, ''); // strip hyphens for loose check if needed, but currently checking exact match or flexible
    
    // Find user by IC (allow with or without dashes if user types differently, though CSV has dashes)
    const found = allStaff.find(s => {
      const dbIc = s.NO_KAD_PENGENALAN?.replace(/[^0-9]/g, '');
      return dbIc === normalizedInput;
    });

    if (found) {
      setCurrentUser(found);
      setLoginError('');
      setIcInput('');
    } else {
      setLoginError('No Kad Pengenalan tidak dijumpai.');
    }
  };

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Anda mempunyai perubahan yang belum disimpan. Adakah anda pasti mahu log keluar?")) {
        return;
      }
    }
    setCurrentUser(null);
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
  };

  const handleChange = (key: string, value: string) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? ({ ...prev, [key]: value }) : null);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    if (!currentUser) return;
    setSaveStatus('saving');
    
    // Simulate API delay
    setTimeout(() => {
      setAllStaff(prev => prev.map(s => s.BIL === currentUser.BIL ? currentUser : s));
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Reset saved status message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 600);
  };

  const handleDownloadCSV = () => {
    const csvString = exportToCSV(allStaff);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sk_sri_aman_staff_updated.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SK SRI AMAN</h1>
            <p className="text-slate-500 text-sm mt-2">Sistem Kemaskini Maklumat Staf</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                No. Kad Pengenalan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={icInput}
                  onChange={(e) => setIcInput(e.target.value)}
                  placeholder="Contoh: 840110-07-5583"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  autoFocus
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              </div>
              {loginError && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Log Masuk
            </button>
            <p className="text-xs text-center text-slate-400 mt-4">
              Sila masukkan No. K/P dengan atau tanpa sengkang.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-[150px] sm:max-w-md">
                {currentUser.NAMA}
              </h2>
              <p className="text-xs text-slate-500">{currentUser.JAWATAN} - {currentUser.GRED}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button
              onClick={handleDownloadCSV}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download Full Spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Muat Turun CSV</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Kemaskini Maklumat</h1>
          {saveStatus === 'saved' && (
             <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
               <CheckCircle2 className="w-4 h-4" /> Disimpan!
             </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Section 1: Personal Info */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Maklumat Peribadi & Hubungan</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Nama Penuh" 
                value={currentUser.NAMA} 
                onChange={(e) => handleChange('NAMA', e.target.value)}
                disabled // Name usually isn't editable by user directly for consistency
              />
              <Input 
                label="No. Kad Pengenalan" 
                value={currentUser.NO_KAD_PENGENALAN} 
                onChange={(e) => handleChange('NO_KAD_PENGENALAN', e.target.value)}
                disabled // ID is the key, usually locked
              />
              <Input 
                label="Agama" 
                value={currentUser.AGAMA} 
                onChange={(e) => handleChange('AGAMA', e.target.value)}
                options={OPTIONS_AGAMA}
              />
              <Input 
                label="No. Telefon" 
                value={currentUser.NO_TEL} 
                onChange={(e) => handleChange('NO_TEL', e.target.value)}
              />
              <div className="md:col-span-2">
                <Input 
                  label="Alamat Terkini" 
                  value={currentUser.ALAMAT_TERKINI} 
                  onChange={(e) => handleChange('ALAMAT_TERKINI', e.target.value)}
                  textarea
                />
              </div>
               <Input 
                label="Kuarters Kerajaan" 
                value={currentUser.KUATERS_KERAJAAN} 
                onChange={(e) => handleChange('KUATERS_KERAJAAN', e.target.value)}
                options={OPTIONS_KUATERS}
              />
            </div>
          </section>

          {/* Section 2: Service Info */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Maklumat Perkhidmatan</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2">
                <Input 
                    label="Jawatan" 
                    value={currentUser.JAWATAN} 
                    onChange={(e) => handleChange('JAWATAN', e.target.value)}
                    options={OPTIONS_JAWATAN}
                />
              </div>
              <Input 
                label="Gred" 
                value={currentUser.GRED} 
                onChange={(e) => handleChange('GRED', e.target.value)}
              />
              <Input 
                label="No. Gaji" 
                value={currentUser.NO_GAJI} 
                onChange={(e) => handleChange('NO_GAJI', e.target.value)}
              />
              <Input 
                label="No. KWSP" 
                value={currentUser.NO_KWSP} 
                onChange={(e) => handleChange('NO_KWSP', e.target.value)}
              />
               <Input 
                label="Skim Pencen / KWSP" 
                value={currentUser.SKIM_PENCEN_KWSP} 
                onChange={(e) => handleChange('SKIM_PENCEN_KWSP', e.target.value)}
                options={OPTIONS_SKIM_PENCEN}
              />
            </div>
          </section>

          {/* Section 3: Important Dates */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Tarikh-Tarikh Penting</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Input 
                label="Tarikh Lantikan Pertama" 
                value={currentUser.TARIKH_LANTIKAN_PERTAMA} 
                onChange={(e) => handleChange('TARIKH_LANTIKAN_PERTAMA', e.target.value)}
              />
              <Input 
                label="Tarikh Pengesahan Lantikan" 
                value={currentUser.TARIKH_PENGESAHAN_LANTIKAN} 
                onChange={(e) => handleChange('TARIKH_PENGESAHAN_LANTIKAN', e.target.value)}
              />
               <Input 
                label="Tarikh Pengesahan Dlm Perkhidmatan" 
                value={currentUser.TARIKH_PENGESAHAN_DALAM_PERKHIDMATAN} 
                onChange={(e) => handleChange('TARIKH_PENGESAHAN_DALAM_PERKHIDMATAN', e.target.value)}
              />
               <Input 
                label="Tarikh Taraf Berpencen" 
                value={currentUser.TARIKH_TARAF_BERPENCEN} 
                onChange={(e) => handleChange('TARIKH_TARAF_BERPENCEN', e.target.value)}
              />
               <Input 
                label="Tarikh Bersara" 
                value={currentUser.TARIKH_BERSARA} 
                onChange={(e) => handleChange('TARIKH_BERSARA', e.target.value)}
              />
               <Input 
                label="Umur Bersara" 
                value={currentUser.UMUR_BERSARA} 
                onChange={(e) => handleChange('UMUR_BERSARA', e.target.value)}
              />
            </div>
          </section>

           {/* Section 4: Promotions & Status */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Kenaikan Pangkat & Status</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Kenaikan Pangkat 1 (DG6/DG10/N2)" 
                value={currentUser.TARIKH_KENAIKAN_PANGKAT_1} 
                onChange={(e) => handleChange('TARIKH_KENAIKAN_PANGKAT_1', e.target.value)}
              />
               <Input 
                label="Kenaikan Pangkat 2 (DG7/DG12/N3)" 
                value={currentUser.TARIKH_KENAIKAN_PANGKAT_2} 
                onChange={(e) => handleChange('TARIKH_KENAIKAN_PANGKAT_2', e.target.value)}
              />
               <Input 
                label="Kenaikan Pangkat 3 (DG8/DG13/N4)" 
                value={currentUser.TARIKH_KENAIKAN_PANGKAT_3} 
                onChange={(e) => handleChange('TARIKH_KENAIKAN_PANGKAT_3', e.target.value)}
              />
              <div className="hidden md:block"></div>

               <Input 
                label="Fasa 1 (Jan-Jun)" 
                value={currentUser.FASA_1} 
                onChange={(e) => handleChange('FASA_1', e.target.value)}
                placeholder="Tanda / jika terlibat"
              />
              <Input 
                label="Fasa 2 (Jul-Dis)" 
                value={currentUser.FASA_2} 
                onChange={(e) => handleChange('FASA_2', e.target.value)}
                placeholder="Tanda / jika terlibat"
              />
              
              <div className="md:col-span-2">
                 <Input 
                  label="Urusan Kenaikan Pangkat Manual (Kes Khas)" 
                  value={currentUser.URUSAN_KENAIKAN_PANGKAT_MANUAL} 
                  onChange={(e) => handleChange('URUSAN_KENAIKAN_PANGKAT_MANUAL', e.target.value)}
                  options={OPTIONS_URUSAN_MANUAL}
                />
              </div>
              <div className="md:col-span-2">
                 <Input 
                  label="Status Semasa Urusan Kenaikan Pangkat" 
                  value={currentUser.STATUS_SEMASA_URUSAN} 
                  onChange={(e) => handleChange('STATUS_SEMASA_URUSAN', e.target.value)}
                  options={OPTIONS_STATUS_URUSAN}
                />
              </div>
            </div>
          </section>

           {/* Section 5: School Movement */}
           <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Pergerakan Sekolah</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Tarikh Lapor Diri SK Sri Aman" 
                value={currentUser.TARIKH_LAPOR_DIRI} 
                onChange={(e) => handleChange('TARIKH_LAPOR_DIRI', e.target.value)}
              />
              <Input 
                label="Tarikh Keluar (Pejabat Sahaja)" 
                value={currentUser.TARIKH_KELUAR} 
                onChange={(e) => handleChange('TARIKH_KELUAR', e.target.value)}
                disabled
              />
            </div>
          </section>

        </div>
      </main>

      {/* Floating Action Button for Mobile / Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-slate-500 hidden sm:inline">
                {hasUnsavedChanges ? "Anda mempunyai perubahan yang belum disimpan." : "Semua perubahan telah disimpan."}
            </span>
            <div className="flex gap-4 ml-auto sm:ml-0 w-full sm:w-auto">
                 <button
                  onClick={() => setAllStaff(parseCSV(INITIAL_CSV_DATA))} // Basic Reset
                  className="flex-1 sm:flex-none px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-lg shadow-md transition-all active:scale-95"
                >
                  {saveStatus === 'saving' ? 'Menyimpan...' : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;