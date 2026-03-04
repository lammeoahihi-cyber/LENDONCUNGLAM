
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { processExcelFiles } from './services/excelService';
import { ProcessingState, HistoryItem, Platform } from './types';
import { ACCEPTED_FILE_TYPES } from './constants';

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';

// Decorative Components
const Sparkle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C50 0 55 40 100 50C100 50 55 60 50 100C50 100 45 60 0 50C0 50 45 40 50 0Z" fill="url(#sparkle-grad)"/>
    <defs>
      <radialGradient id="sparkle-grad" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.5" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

const Star: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10L61 39H92L67 58L76 87L50 70L24 87L33 58L8 39H39L50 10Z" fill="url(#star-grad)"/>
    <defs>
      <linearGradient id="star-grad" x1="50" y1="10" x2="50" y2="87" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

const FallingSparkles = () => {
  // Generate random sparkles
  const sparkles = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${5 + Math.random() * 8}s`,
    animationDelay: `${Math.random() * 5}s`,
    type: Math.random() > 0.5 ? 'sparkle' : 'star',
    size: Math.random() * 15 + 10 // 10px to 25px
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {sparkles.map(p => (
        <div 
          key={p.id}
          className="absolute -top-10 opacity-60 mix-blend-screen"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `fall ${p.animationDuration} linear infinite`,
            animationDelay: p.animationDelay
          }}
        >
          {p.type === 'sparkle' ? <Sparkle className="w-full h-full animate-pulse" /> : <Star className="w-full h-full animate-spin-slow" />}
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
      <FallingSparkles />
      
      {/* Background Decorations */}
      <div className="fixed top-20 left-4 w-32 h-32 opacity-40 pointer-events-none hidden lg:block animate-pulse mix-blend-screen">
        <Sparkle className="w-full h-full drop-shadow-2xl text-yellow-300" />
      </div>
      <div className="fixed top-24 right-10 w-24 h-24 opacity-50 pointer-events-none hidden lg:block animate-pulse mix-blend-screen" style={{ animationDelay: '1s' }}>
        <Star className="w-full h-full drop-shadow-2xl" />
      </div>
      <div className="fixed bottom-10 left-10 w-40 h-40 opacity-30 pointer-events-none z-0 animate-float mix-blend-screen">
         <Sparkle className="w-full h-full" />
      </div>
      <div className="fixed bottom-20 right-5 w-28 h-28 opacity-40 pointer-events-none z-0 animate-float mix-blend-screen" style={{ animationDelay: '1.5s' }}>
         <Star className="w-full h-full" />
      </div>

      <div className="flex flex-col gap-10 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border border-yellow-300 shadow-md shadow-yellow-200/50 animate-bounce-slow">
            <span className="text-yellow-600 animate-pulse">✨</span> Phiên Bản CÓ ĐƠN <span className="text-yellow-600 animate-pulse">✨</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none font-tet-title mt-4 text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 via-yellow-300 to-amber-600 animate-shimmer drop-shadow-lg" style={{textShadow: '0 4px 20px rgba(251, 191, 36, 0.4)'}}>
            LÊN ĐƠN THÔI
          </h1>
        </div>

        {/* Platform Tabs */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-2 rounded-2xl border-2 border-yellow-300 shadow-inner flex gap-2">
            <button 
              onClick={() => { setActivePlatform('shopee'); reset(); }}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-lg shadow-orange-300/50 scale-105' : 'bg-white text-orange-800 border-transparent hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'}`}
            >
              SHOPEE
            </button>
            <button 
              onClick={() => { setActivePlatform('tiktok'); reset(); }}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'tiktok' ? 'bg-gradient-to-r from-slate-900 to-black text-white border-slate-700 shadow-lg shadow-slate-400/50 scale-105' : 'bg-white text-slate-800 border-transparent hover:bg-slate-50 hover:border-slate-200 hover:text-black'}`}
            >
              TIKTOK
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* History Card */}
            <div className="bg-white p-7 rounded-3xl border-2 border-yellow-200 shadow-xl shadow-yellow-100/50 space-y-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between border-b border-yellow-100 pb-3">
                <h2 className="text-lg font-bold text-yellow-800 font-tet-title">Nhật ký</h2>
                {history.length > 0 && <button onClick={clearHistory} className="text-xs font-bold text-yellow-600 hover:text-yellow-800 uppercase tracking-wider">Xóa</button>}
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl opacity-30 animate-pulse">✨</span>
                    <p className="text-yellow-600 text-xs mt-2 font-medium">Chưa có lịch sử</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${item.platform === 'shopee' ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 border-orange-300' : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-600'}`}>
                        {item.platform === 'shopee' ? 'S' : 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-yellow-900 truncate text-sm">{item.filename}</p>
                        <div className="flex justify-between items-center mt-1 text-yellow-600 text-xs font-medium">
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
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-[2.5rem] border-4 border-yellow-300 shadow-2xl shadow-yellow-200/50 overflow-hidden relative">
              {/* Corner Decorations */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-transparent opacity-20 rounded-br-full mix-blend-multiply"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-400 to-transparent opacity-20 rounded-tl-full mix-blend-multiply"></div>

              <div className="p-8 relative z-10">
                {files.length < MAX_FILES && !processedFileUrl && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 group relative overflow-hidden ${activePlatform === 'shopee' ? 'border-orange-300 bg-orange-50/50 hover:bg-orange-100 hover:border-orange-500 hover:shadow-inner' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-500 hover:shadow-inner'}`}
                  >
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300 shadow-xl ${activePlatform === 'shopee' ? 'bg-gradient-to-br from-white to-orange-50 text-orange-500 shadow-orange-200/50' : 'bg-gradient-to-br from-white to-slate-100 text-slate-800 shadow-slate-200/50'}`}>
                       {activePlatform === 'shopee' ? <Sparkle className="w-12 h-12 animate-pulse" /> : <svg className="w-10 h-10 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                    </div>
                    <p className="text-2xl font-black text-yellow-900 text-center font-tet-title group-hover:scale-105 transition-transform">
                      Thả file {activePlatform === 'shopee' ? 'Shopee' : 'Tiktok'} vào đây
                    </p>
                    <p className="mt-2 text-yellow-600 font-medium">hoặc nhấn để chọn file</p>
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
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden group ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:via-amber-400 hover:to-yellow-400 text-white shadow-yellow-300/50' : 'bg-gradient-to-r from-slate-800 to-black text-white shadow-slate-400/50'}`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkle className="w-6 h-6 animate-pulse" />
                        XỬ LÝ ĐƠN NGAY
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    </button>
                  )}

                  {state.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-12 gap-5 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl border-2 border-yellow-200 shadow-inner">
                      <div className="relative">
                         <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 rounded-full animate-pulse"></div>
                         <Star className="w-16 h-16 animate-spin-slow text-yellow-500 relative z-10" />
                      </div>
                      <p className="font-bold text-yellow-800 uppercase tracking-widest text-sm animate-pulse">{state.message}</p>
                    </div>
                  )}

                  {state.status === 'success' && processedFileUrl && (
                    <div className="space-y-5 animate-slide-up">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 opacity-20 pointer-events-none mix-blend-multiply">
                           <Sparkle className="w-32 h-32 translate-x-10 -translate-y-10 animate-pulse text-green-300" />
                        </div>
                        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-3 rounded-full shadow-lg shadow-green-200 z-10 animate-bounce-slow"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <div className="z-10">
                          <p className="font-black text-green-800 text-lg">Hoàn tất xuất sắc!</p>
                          <p className="text-green-700 text-sm">{state.message}</p>
                        </div>
                      </div>
                      <a href={processedFileUrl} download={`KET_QUA_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center gap-4 w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-yellow-200/50 hover:from-yellow-400 hover:to-amber-500 hover:scale-[1.02] transition-all border-2 border-yellow-300/50">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        TẢI FILE KẾT QUẢ
                      </a>
                      <button onClick={reset} className="w-full text-yellow-600 font-bold hover:text-yellow-800 uppercase tracking-widest text-xs py-2 transition-colors">Làm lượt mới</button>
                    </div>
                  )}

                  {state.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-center gap-5 text-red-800 animate-shake shadow-sm">
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
