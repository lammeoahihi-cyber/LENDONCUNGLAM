import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { processExcelFiles } from './services/excelService';
import { ProcessingState, HistoryItem, Platform } from './types';
import { ACCEPTED_FILE_TYPES } from './constants';

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';

// Hiệu ứng 1: Bong bóng nước sủi bọt từ đáy lên
const BubbleEffect = () => {
  const bubbles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 14 + 6,
    duration: `${6 + Math.random() * 8}s`,
    delay: `${Math.random() * 5}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-slate-950">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute bottom-[-20px] rounded-full bg-white/10 border border-white/30 backdrop-blur-[1px]"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animation: `rise ${b.duration} linear infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
};

// Hiệu ứng 2: Đàn cá bơi lội tự do ngang màn hình
const FishEffect = () => {
  const fishList = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    top: `${15 + Math.random() * 65}%`,
    size: Math.random() * 35 + 25,
    duration: `${15 + Math.random() * 15}s`,
    delay: `${Math.random() * 10}s`,
    direction: Math.random() > 0.5 ? 'left-to-right' : 'right-to-left'
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {fishList.map(f => (
        <div
          key={f.id}
          className="absolute opacity-30 text-cyan-300"
          style={{
            top: f.top,
            width: f.size,
            height: f.size / 2,
            animation: `${f.direction} ${f.duration} linear infinite`,
            animationDelay: f.delay,
          }}
        >
          <svg viewBox="0 0 100 50" fill="currentColor" style={{ transform: f.direction === 'right-to-left' ? 'scaleX(-1)' : 'none' }}>
            <path d="M10,25 C30,10 70,10 90,25 C70,40 30,40 10,25 M90,25 L100,15 L95,25 L100,35 Z" />
            <circle cx="30" cy="22" r="3" fill="rgba(0,0,0,0.6)" />
          </svg>
        </div>
      ))}
    </div>
  );
};

// Hiệu ứng 3: Hào quang nước lấp lánh theo chuột
const OceanCursorGlow = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);

  return (
    <div 
      className="pointer-events-none fixed z-[9999] transition-all duration-300 ease-out mix-blend-screen hidden lg:block"
      style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
    >
      <div className="w-6 h-6 bg-cyan-300/40 rounded-full blur-[2px] animate-ping"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-30"></div>
    </div>
  );
};

// Tấm bảng đá đại dương đung đưa (Thay cho câu đối)
const OceanPlaque: React.FC<{ text: string, position: 'left' | 'right' }> = ({ text, position }) => {
  const words = text.split(' ');
  return (
    <div 
      className={`fixed top-1/4 hidden xl:flex flex-col items-center z-20 animate-float ${position === 'left' ? 'left-8' : 'right-8'}`}
      style={{ animationDelay: position === 'left' ? '0s' : '2s' }}
    >
      <div className="bg-gradient-to-b from-blue-950/70 to-cyan-900/70 backdrop-blur-md text-cyan-200 py-8 px-5 rounded-[30px] border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(34,211,238,0.2)] flex flex-col gap-4 items-center justify-center min-w-[70px]">
        <div className="absolute inset-1.5 border border-dashed border-cyan-400/20 rounded-[24px] pointer-events-none"></div>
        {words.map((word, i) => (
          <span key={i} className="font-sans text-xl lg:text-2xl font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {word}
          </span>
        ))}
      </div>
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
    setState({ status: 'processing', message: `Đang gộp đơn ${activePlatform.toUpperCase()} dưới đáy biển...` });
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
    if (confirm('Xóa toàn bộ lịch sử đơn dưới biển?')) setHistory([]);
  };

  return (
    <Layout>
      <BubbleEffect />
      <FishEffect />
      <OceanCursorGlow />
      <OceanPlaque text="Sóng dữ không ngã lòng" position="left" />
      <OceanPlaque text="Biển khơi lộc tràn trề" position="right" />

      <div className="flex flex-col gap-10 relative z-10 text-white">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-950/60 backdrop-blur-sm text-cyan-300 px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-bounce-slow">
            <span className="animate-pulse">🌊</span> PHIÊN BẢN ĐẠI DƯƠNG CÓ ĐƠN <span className="animate-pulse">🌊</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mt-4 text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-sky-200 to-blue-500 drop-shadow-lg" style={{textShadow: '0 4px 20px rgba(34, 211, 238, 0.3)'}}>
            LÊN ĐƠN THÔI
          </h1>
        </div>

        {/* Platform Tabs */}
        <div className="flex justify-center">
          <div className="bg-blue-950/40 backdrop-blur-md p-2 rounded-2xl border border-cyan-500/30 shadow-2xl flex gap-2">
            <button 
              onClick={() => { setActivePlatform('shopee'); reset(); }}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border duration-300 ${
                activePlatform === 'shopee' 
                  ? 'bg-gradient-to-r from-orange-500/80 to-red-500/80 text-white border-orange-400 shadow-lg shadow-orange-500/20 scale-105' 
                  : 'bg-transparent text-cyan-200 border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              SHOPEE
            </button>
            <button 
              onClick={() => { setActivePlatform('tiktok'); reset(); }}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border Triển khai duration-300 ${
                activePlatform === 'tiktok' 
                  ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105' 
                  : 'bg-transparent text-cyan-200 border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              TIKTOK
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Nhật ký kiểu kính mờ trong suốt dưới nước */}
            <div className="bg-blue-950/40 backdrop-blur-md p-7 rounded-3xl border border-cyan-500/20 shadow-2xl space-y-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <h2 className="text-lg font-bold text-cyan-300 tracking-wide font-sans">NHẬT KÝ BIỂN KHƠI</h2>
                {history.length > 0 && <button onClick={clearHistory} className="text-xs font-bold text-cyan-400 hover:text-cyan-200 uppercase tracking-wider">Xóa</button>}
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl opacity-30 animate-pulse">🫧</span>
                    <p className="text-cyan-400 text-xs mt-2 font-medium">Chưa có lịch sử đơn</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-blue-900/20 border border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${
                        item.platform === 'shopee' 
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {item.platform === 'shopee' ? 'S' : 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-cyan-100 truncate text-sm">{item.filename}</p>
                        <div className="flex justify-between items-center mt-1 text-cyan-400 text-xs font-medium">
                          <span>{item.type === 'upload' ? 'Thả xuống' : 'Thu hoạch'}</span>
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
            <div className="bg-blue-950/40 backdrop-blur-md p-2 rounded-[2.5rem] border-2 border-cyan-500/30 shadow-2xl overflow-hidden relative">
              <div className="p-8 relative z-10">
                {files.length < MAX_FILES && !processedFileUrl && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 group relative overflow-hidden ${
                      activePlatform === 'shopee' 
                        ? 'border-orange-500/40 bg-orange-950/10 hover:bg-orange-950/20 hover:border-orange-400' 
                        : 'border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/20 hover:border-cyan-400'
                    }`}
                    style={{ animation: 'float 4s ease-in-out infinite' }}
                  >
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300 bg-blue-900/40 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10">
                       <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                       </svg>
                    </div>
                    <p className="text-2xl font-black text-cyan-100 text-center group-hover:scale-105 transition-transform">
                      Thả file {activePlatform === 'shopee' ? 'Shopee' : 'Tiktok'} vào lòng biển
                    </p>
                    <p className="mt-2 text-cyan-300 font-medium text-sm">hoặc nhấp để chọn file từ máy</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                      <h3 className="text-xs font-black text-cyan-300 uppercase tracking-widest">Danh sách File dưới nước ({files.length})</h3>
                      {!processedFileUrl && <button onClick={reset} className="text-xs text-red-400 font-bold hover:bg-red-950/30 px-3 py-1 rounded-full transition-colors">Thả xích / Hủy</button>}
                    </div>
                    {files.map((f, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-900/30 p-4 rounded-xl border border-cyan-500/10 group hover:border-cyan-400 transition-colors animate-fade-in">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-950 p-2 rounded-lg text-cyan-400 border border-cyan-500/20 shadow-sm">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                           </div>
                           <span className="text-sm font-bold text-cyan-100 truncate max-w-[200px]">{f.name}</span>
                        </div>
                        {!processedFileUrl && <button onClick={() => removeFile(index)} className="text-cyan-400 hover:text-red-400 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                 {state.status === 'idle' && files.length > 0 && (
                    <button 
                      onClick={(e) => {
                        if (typeof (window as any).confetti === 'function') {
                          (window as any).confetti({
                            particleCount: 150,
                            spread: 80,
                            origin: { y: 0.6 },
                            colors: ['#22d3ee', '#0ea5e9', '#38bdf8'] // Pháo giấy đổi thành màu nước biển
                          });
                        }
                        handleProcess();
                      }}
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden group ${
                        activePlatform === 'shopee' 
                          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white' 
                          : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-cyan-500/20'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2 tracking-wider">
                        🐠 XỬ LÝ ĐƠN NGAY
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    </button>
                  )}

                  {state.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-12 gap-5 bg-blue-900/20 rounded-3xl border border-cyan-500/20 shadow-inner">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                      </div>
                      <p className="font-bold text-cyan-300 uppercase tracking-widest text-sm animate-pulse">{state.message}</p>
                    </div>
                  )}

                  {state.status === 'success' && processedFileUrl && (
                    <div className="space-y-5 animate-slide-up">
                      <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-500/30 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-br from-cyan-400 to-blue-600 text-white p-3 rounded-full z-10 animate-bounce-slow">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="z-10">
                          <p className="font-black text-cyan-300 text-lg">Thu hoạch đơn thành công!</p>
                          <p className="text-cyan-100 text-sm">{state.message}</p>
                        </div>
                      </div>
                      <a href={processedFileUrl} download={`KET_QUA_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center gap-4 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-6 rounded-2xl font-black text-xl shadow-2xl hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.01] transition-all border border-cyan-300/30">
                        <svg className="w-7 h-7 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        TẢI FILE KẾT QUẢ VỀ MÁY
                      </a>
                      <button onClick={reset} className="w-full text-cyan-400 font-bold hover:text-cyan-200 uppercase tracking-widest text-xs py-2 transition-colors">Làm lượt mới dưới biển</button>
                    </div>
                  )}

                  {state.status === 'error' && (
                    <div className="bg-red-950/30 border border-red-500/30 p-6 rounded-2xl flex items-center gap-5 text-red-200 animate-shake shadow-lg">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-bold">{state.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Khai báo CSS keyframes cho chủ đề Đại Dương */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:4px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#22d3ee;border-radius:10px;}
        
        /* Animations */
        .animate-spin-slow { animation: spin 12s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 
          0%, 100% { transform: translateY(-3%); } 
          50% { transform: translateY(0); } 
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        /* Bong bóng sủi từ đáy lên */
        @keyframes rise {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-115vh) scale(1.2); opacity: 0; }
        }

        /* Đàn cá bơi ngang màn hình */
        @keyframes left-to-right {
          0% { transform: translateX(-20vw); }
          100% { transform: translateX(120vw); }
        }
        @keyframes right-to-left {
          0% { transform: translateX(120vw); }
          100% { transform: translateX(-20vw); }
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
