import React, { useState, useEffect } from 'react';
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
import { StaffData } from './types';
import { Input } from './components/Input';
import { fetchGoogleSheetData, saveToGoogleSheet } from './utils/api';
import { Search, Save, User, LogOut, Download, AlertCircle, CheckCircle2, Database, Loader2, X } from 'lucide-react';

const SHEET_URL_KEY = 'sk_sri_aman_sheet_url';
// URL Apps Script anda
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwUEynctnLs0FtwcCSYqfSIyDbHONbFaqJYXbBD5CYwf_7jsxUheQr8O7yAjAKDDZOpyA/exec';

const App: React.FC = () => {
  const [allStaff, setAllStaff] = useState<StaffData[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffData | null>(null);
  const [icInput, setIcInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Sheet Configuration State
  const [sheetUrl, setSheetUrl] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Initialize: Load Sheet URL config and Initial Data
  useEffect(() => {
    // 1. Muat data awal (sebagai backup pantas)
    setAllStaff(parseCSV(INITIAL_CSV_DATA));

    // 2. Tentukan URL (Local storage atau Default)
    const storedUrl = localStorage.getItem(SHEET_URL_KEY);
    const targetUrl = storedUrl || DEFAULT_SHEET_URL;

    setSheetUrl(targetUrl);

    // 3. Sambung terus ke Google Sheet
    if (targetUrl) {
      loadSheetData(targetUrl);
    }
  }, []);

  const loadSheetData = async (url: string) => {
    setIsConnecting(true);
    setConnectionError('');
    try {
      const data = await fetchGoogleSheetData(url);
      if (data && data.length > 0) {
        setAllStaff(data);
        setIsConnected(true);
      } else {
        throw new Error("Data kosong.");
      }
    } catch (err) {
      console.error(err);
      setConnectionError('Gagal menyambung ke Google Sheet. Sila semak sambungan internet.');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveConfig = () => {
    if (!sheetUrl) return;
    localStorage.setItem(SHEET_URL_KEY, sheetUrl);
    loadSheetData(sheetUrl);
    setIsConfigOpen(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = icInput.replace(/[^0-9]/g, ''); 
    
    const found = allStaff.find(s => {
      const dbIc = s.NO_KAD_PENGENALAN?.replace(/[^0-9]/g, '');
      return dbIc === normalizedInput;
    });

    if (found) {
      setCurrentUser({ ...found });
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

  const handleSave = async () => {
    if (!currentUser) return;
    setSaveStatus('saving');

    if (isConnected && sheetUrl) {
      // 1. Save to Google Sheet
      const success = await saveToGoogleSheet(sheetUrl, currentUser);
      
      if (success) {
        // Update local state to reflect change
        setAllStaff(prev => prev.map(s => s.BIL === currentUser.BIL ? currentUser : s));
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        alert("Gagal menyimpan ke Google Sheet. Sila semak sambungan internet atau tetapan skrip.");
      }
    } else {
      // 2. Fallback: Cannot save permanently
      setSaveStatus('idle');
      alert("AMARAN: Data TIDAK disimpan ke pangkalan data kerana tiada sambungan Google Sheet. Sila 'Download CSV' untuk simpanan manual, atau setkan Google Sheet URL.");
      
      // We still update local memory so they can download the CSV
      setAllStaff(prev => prev.map(s => s.BIL === currentUser.BIL ? currentUser : s));
      setHasUnsavedChanges(false);
    }
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

  const handleDisconnect = () => {
      if(window.confirm("Putuskan sambungan dari Google Sheet? Data akan kembali kepada asal.")) {
          localStorage.removeItem(SHEET_URL_KEY);
          setSheetUrl('');
          setIsConnected(false);
          setAllStaff(parseCSV(INITIAL_CSV_DATA));
          setIsConfigOpen(false);
      }
  }

  // --- RENDER HELPERS ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative">
        {/* Config Button (Login Screen) */}
        <button 
            onClick={() => setIsConfigOpen(true)}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-full transition-colors"
            title="Tetapan Database"
        >
            <Database className="w-6 h-6" />
        </button>

        <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-8 border border-slate-200 relative">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isConnected ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SK SRI AMAN</h1>
            <p className="text-slate-500 text-sm mt-2">Sistem Kemaskini Maklumat Staf</p>
            {isConnected && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                    <Database className="w-3 h-3" />
                    <span>Bersambung ke Spreadsheet</span>
                </div>
            )}
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
          </form>
        </div>

        {/* Config Modal */}
        {isConfigOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Sambungan Spreadsheet
                        </h3>
                        <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4">
                        URL Web App telah dipratetapkan. Anda boleh menukarnya jika perlu.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Google Apps Script Web App URL</label>
                            <input 
                                type="url" 
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/..."
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                        {connectionError && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{connectionError}</span>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            {isConnected && (
                                <button 
                                    type="button"
                                    onClick={handleDisconnect}
                                    className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                                >
                                    Putuskan
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={handleSaveConfig}
                                disabled={isConnecting || !sheetUrl}
                                className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan & Sambung'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
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
              <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">{currentUser.JAWATAN}</p>
                  {isConnected ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Online: Google Sheet"></span>
                  ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" title="Offline: Local Mode"></span>
                  )}
              </div>
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
             <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200 animate-in fade-in slide-in-from-bottom-2">
               <CheckCircle2 className="w-4 h-4" /> Disimpan ke Spreadsheet!
             </span>
          )}
           {saveStatus === 'error' && (
             <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full border border-red-200">
               <AlertCircle className="w-4 h-4" /> Gagal Simpan
             </span>
          )}
        </div>

        {!isConnected && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 text-sm text-yellow-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">Mod Luar Talian</p>
                    <p>Anda belum menyambungkan Google Sheet. Perubahan yang anda buat TIDAK akan disimpan jika anda reload laman ini. Sila 'Download CSV' selepas mengemaskini, atau sambungkan database di skrin Log Masuk.</p>
                </div>
            </div>
        )}

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
                  onClick={() => {
                      if (isConnected) {
                         // Revert to sheet data
                         loadSheetData(sheetUrl);
                      } else {
                         // Revert to static CSV
                         setAllStaff(parseCSV(INITIAL_CSV_DATA));
                      }
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-lg shadow-md transition-all active:scale-95"
                >
                  {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                  ) : (
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
