
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { processExcelFiles } from './services/excelService';
import { ProcessingState, HistoryItem, Platform } from './types';
import { ACCEPTED_FILE_TYPES } from './constants';

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';

// Decorative Components
const HoaMai: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 50L50 20C50 20 60 35 75 30C75 30 65 45 75 60C75 60 60 60 50 80C50 80 40 60 25 60C25 60 35 45 25 30C25 30 40 35 50 20Z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2"/>
    <circle cx="50" cy="50" r="8" fill="#B45309"/>
  </svg>
);

const HoaDao: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 50L50 15C50 15 65 30 80 25C80 25 70 45 80 65C80 65 60 60 50 85C50 85 40 60 20 65C20 65 30 45 20 25C20 25 35 30 50 15Z" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2"/>
    <circle cx="50" cy="50" r="8" fill="#BE123C"/>
  </svg>
);

const Lantern: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" style={{ transformOrigin: 'top center' }}>
    <path d="M50 0V10M50 10C30 10 15 25 15 55C15 85 30 100 50 100C70 100 85 85 85 55C85 25 70 10 50 10Z" fill="#DC2626" stroke="#FCD34D" strokeWidth="2"/>
    <path d="M50 10V100" stroke="#B91C1C" strokeWidth="1"/>
    <path d="M15 55H85" stroke="#B91C1C" strokeWidth="1" strokeOpacity="0.5"/>
    <path d="M50 100V120" stroke="#FCD34D" strokeWidth="2"/>
    <rect x="45" y="100" width="10" height="5" fill="#FCD34D"/>
    <rect x="45" y="5" width="10" height="5" fill="#FCD34D"/>
    <path d="M50 120L40 140M50 120L60 140" stroke="#DC2626" strokeWidth="2"/>
  </svg>
);

const FallingPetals = () => {
  // Generate random petals
  const petals = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${8 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 5}s`,
    type: Math.random() > 0.5 ? 'dao' : 'mai',
    size: Math.random() * 10 + 10 // 10px to 20px
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map(p => (
        <div 
          key={p.id}
          className="absolute -top-10 opacity-70"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `fall ${p.animationDuration} linear infinite`,
            animationDelay: p.animationDelay
          }}
        >
          {p.type === 'dao' ? <HoaDao className="w-full h-full" /> : <HoaMai className="w-full h-full" />}
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<Platform>('shopee');
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<ProcessingState>({ status: 'idle', message: '' });
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > MAX_FILES) {
      setState({ status: 'error', message: `Tối đa ${MAX_FILES} file mỗi lần.` });
      return;
    }
    const validFiles = selectedFiles.filter(f => ACCEPTED_FILE_TYPES.includes(f.type));
    if (validFiles.length !== selectedFiles.length) {
      setState({ status: 'error', message: 'Chỉ chấp nhận file Excel (.xlsx, .xls).' });
    } else {
      setState({ status: 'idle', message: '' });
      validFiles.forEach(f => {
        addToHistory({ type: 'upload', filename: f.name, size: f.size, platform: activePlatform });
      });
    }
    setFiles(prev => [...prev, ...validFiles]);
    setProcessedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setProcessedFileUrl(null);
      setState({ status: 'idle', message: '' });
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setState({ status: 'processing', message: `Đang xử lý đơn ${activePlatform.toUpperCase()}...` });
    try {
      const blob = await processExcelFiles(files, activePlatform);
      const url = URL.createObjectURL(blob);
      setProcessedFileUrl(url);
      setState({ status: 'success', message: `Gộp đơn ${activePlatform.toUpperCase()} thành công!` });
      addToHistory({ 
        type: 'download', 
        filename: `KET_QUA_${activePlatform.toUpperCase()}_${new Date().getTime()}.xlsx`, 
        count: files.length,
        platform: activePlatform
      });
    } catch (error: any) {
      setState({ status: 'error', message: error.message || 'Lỗi xử lý file.' });
    }
  };

  const reset = () => {
    setFiles([]);
    setState({ status: 'idle', message: '' });
    setProcessedFileUrl(null);
  };

  const clearHistory = () => {
    if (confirm('Xóa toàn bộ lịch sử?')) setHistory([]);
  };

  return (
    <Layout>
      <FallingPetals />
      
      {/* Background Decorations */}
      <div className="fixed top-20 left-4 w-24 h-24 opacity-80 pointer-events-none hidden lg:block animate-sway">
        <Lantern className="w-full h-full drop-shadow-xl" />
      </div>
      <div className="fixed top-24 right-10 w-20 h-20 opacity-80 pointer-events-none hidden lg:block animate-sway" style={{ animationDelay: '1s' }}>
        <Lantern className="w-full h-full drop-shadow-xl" />
      </div>
      <div className="fixed bottom-10 left-10 w-32 h-32 opacity-60 pointer-events-none z-0 animate-float">
         <HoaMai className="w-full h-full" />
      </div>
      <div className="fixed bottom-20 right-5 w-24 h-24 opacity-60 pointer-events-none z-0 animate-float" style={{ animationDelay: '1.5s' }}>
         <HoaDao className="w-full h-full" />
      </div>

      <div className="flex flex-col gap-10 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border border-red-200 shadow-sm animate-bounce-slow">
            <span className="text-yellow-600">✨</span> Phiên bản Tết 2026 <span className="text-yellow-600">✨</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none font-tet-title mt-4 text-transparent bg-clip-text bg-gradient-to-br from-red-600 via-red-500 to-yellow-500 animate-shimmer drop-shadow-sm">
            LÊN ĐƠN CÙNG LÂM
          </h1>
          <p className="font-tet-script text-3xl md:text-4xl text-yellow-600 mt-2 transform -rotate-1">
            Cung Chúc Tân Xuân - Vạn Sự Như Ý
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex justify-center">
          <div className="bg-red-50 p-2 rounded-2xl border-2 border-red-200 shadow-inner flex gap-2">
            <button 
              onClick={() => { setActivePlatform('shopee'); reset(); }}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'shopee' ? 'bg-red-600 text-yellow-100 border-red-600 shadow-lg shadow-red-200 scale-105' : 'bg-white text-red-800 border-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-600'}`}
            >
              SHOPEE
            </button>
            <button 
              onClick={() => { setActivePlatform('tiktok'); reset(); }}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'tiktok' ? 'bg-black text-yellow-100 border-black shadow-lg shadow-slate-300 scale-105' : 'bg-white text-slate-800 border-transparent hover:bg-slate-50 hover:border-slate-200 hover:text-black'}`}
            >
              TIKTOK
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Rules Card */}
            <div className="bg-white p-7 rounded-3xl border-2 border-yellow-200 shadow-xl shadow-orange-100/50 space-y-6 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
               <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500 rounded-full opacity-10 blur-xl"></div>
              <h2 className="text-xl font-bold text-red-800 flex items-center gap-2 font-tet-title">
                Quy tắc {activePlatform.toUpperCase()}
              </h2>
              <div className="space-y-4">
                {activePlatform === 'shopee' ? (
                  <>
                    <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50/50 rounded-r-lg">
                      <p className="text-sm text-red-900">Tự động nhận diện <span className="font-bold text-red-600">Đơn 1 Kho</span> hoặc <span className="font-bold text-red-600">Đơn Đa Kho</span>.</p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50/50 rounded-r-lg">
                      <p className="text-sm text-yellow-900 font-medium">Làm sạch cột G (xóa .00). Cột I & K để trống.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-l-4 border-black pl-4 py-2 bg-slate-50/50 rounded-r-lg">
                      <p className="text-sm text-slate-900">Ánh xạ: AM→A, AO→B, AQ→C, AI→D, A→E...</p>
                    </div>
                    <div className="border-l-4 border-slate-600 pl-4 py-2 bg-slate-50/50 rounded-r-lg">
                      <p className="text-sm text-slate-900 font-bold">Lưu ý: Cột AK sẽ được chuyển sang cột L.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* History Card */}
            <div className="bg-white p-7 rounded-3xl border-2 border-red-100 shadow-xl shadow-red-50 space-y-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <h2 className="text-lg font-bold text-red-800 font-tet-title">Nhật ký</h2>
                {history.length > 0 && <button onClick={clearHistory} className="text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-wider">Xóa</button>}
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl opacity-30 animate-pulse">🧧</span>
                    <p className="text-red-300 text-xs mt-2 font-medium">Chưa có lịch sử</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 hover:border-orange-300 transition-colors">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${item.platform === 'shopee' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-800 text-white border-slate-700'}`}>
                        {item.platform === 'shopee' ? 'S' : 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-red-900 truncate text-sm">{item.filename}</p>
                        <div className="flex justify-between items-center mt-1 text-red-400 text-xs font-medium">
                          <span>{item.type === 'upload' ? 'Tải lên' : 'Kết quả'}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6 order-1 lg:order-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white p-2 rounded-[2.5rem] border-4 border-yellow-200 shadow-2xl overflow-hidden relative">
              {/* Corner Decorations */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-red-500 to-transparent opacity-10 rounded-br-full"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-yellow-500 to-transparent opacity-10 rounded-tl-full"></div>

              <div className="p-8 relative z-10">
                {files.length < MAX_FILES && !processedFileUrl && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 group relative overflow-hidden ${activePlatform === 'shopee' ? 'border-red-300 bg-red-50/30 hover:bg-red-50 hover:border-red-500' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-500'}`}
                  >
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300 shadow-lg ${activePlatform === 'shopee' ? 'bg-white text-red-500 shadow-red-100' : 'bg-white text-slate-800 shadow-slate-200'}`}>
                       {activePlatform === 'shopee' ? <HoaMai className="w-12 h-12 animate-spin-slow" /> : <svg className="w-10 h-10 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                    </div>
                    <p className="text-2xl font-black text-red-900 text-center font-tet-title group-hover:scale-105 transition-transform">
                      Thả file {activePlatform === 'shopee' ? 'Shopee' : 'Tiktok'} vào đây
                    </p>
                    <p className="mt-2 text-red-400 font-medium">hoặc nhấn để chọn file</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between border-b border-red-100 pb-2">
                      <h3 className="text-xs font-black text-red-400 uppercase tracking-widest">Danh sách ({files.length})</h3>
                      {!processedFileUrl && <button onClick={reset} className="text-xs text-red-600 font-bold hover:bg-red-50 px-3 py-1 rounded-full transition-colors">Hủy bỏ</button>}
                    </div>
                    {files.map((f, index) => (
                      <div key={index} className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-100 group hover:border-yellow-300 transition-colors animate-fade-in">
                        <div className="flex items-center gap-3">
                           <div className="bg-white p-2 rounded-lg text-red-500 shadow-sm">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                           </div>
                           <span className="text-sm font-bold text-red-900 truncate max-w-[200px]">{f.name}</span>
                        </div>
                        {!processedFileUrl && <button onClick={() => removeFile(index)} className="text-red-300 hover:text-red-600 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {state.status === 'idle' && files.length > 0 && (
                    <button 
                      onClick={handleProcess}
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden group ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-yellow-100 shadow-red-200' : 'bg-slate-900 text-white shadow-slate-300'}`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <HoaMai className="w-6 h-6 animate-spin-slow" />
                        XỬ LÝ ĐƠN NGAY
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    </button>
                  )}

                  {state.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-12 gap-5 bg-orange-50 rounded-3xl border-2 border-orange-100">
                      <div className="relative">
                         <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                         <HoaDao className="w-16 h-16 animate-spin text-red-500" />
                      </div>
                      <p className="font-bold text-red-700 uppercase tracking-widest text-sm animate-pulse">{state.message}</p>
                    </div>
                  )}

                  {state.status === 'success' && processedFileUrl && (
                    <div className="space-y-5 animate-slide-up">
                      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                           <HoaMai className="w-24 h-24 translate-x-10 -translate-y-10 animate-spin-slow" />
                        </div>
                        <div className="bg-green-600 text-white p-3 rounded-full shadow-lg shadow-green-200 z-10 animate-bounce-slow"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <div className="z-10">
                          <p className="font-black text-green-800 text-lg">Hoàn tất xuất sắc!</p>
                          <p className="text-green-700 text-sm">{state.message}</p>
                        </div>
                      </div>
                      <a href={processedFileUrl} download={`KET_QUA_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center gap-4 w-full bg-red-700 text-yellow-100 py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-red-800 hover:scale-[1.01] transition-all border-2 border-yellow-500/30">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        TẢI FILE KẾT QUẢ
                      </a>
                      <button onClick={reset} className="w-full text-red-400 font-bold hover:text-red-700 uppercase tracking-widest text-xs py-2">Làm lượt mới</button>
                    </div>
                  )}

                  {state.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-center gap-5 text-red-800 animate-shake">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-bold">{state.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:4px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#fca5a5;border-radius:10px;}
        
        /* Animations */
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-sway { animation: sway 3s ease-in-out infinite alternate; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-shimmer {
           background-size: 200% auto;
           animation: shimmer 3s linear infinite;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 
          0%, 100% { transform: translateY(-5%); } 
          50% { transform: translateY(0); } 
        }
        @keyframes sway {
          from { transform: rotate(-5deg); }
          to { transform: rotate(5deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes slideUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg) translateX(20px); opacity: 0; }
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </Layout>
  );
};

export default App;
