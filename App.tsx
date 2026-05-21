import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { processExcelFiles } from './services/excelService';
import { ProcessingState, HistoryItem, Platform } from './types';
import { ACCEPTED_FILE_TYPES } from './constants';

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';

// 1. San hô và Rong biển (Vẽ bằng SVG)
const Coral: React.FC<{ className?: string, style?: any }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M50,100 Q50,70 30,50 Q20,40 15,20 M50,100 Q50,70 70,50 Q85,35 90,15 M50,90 Q65,60 55,40 Q50,25 60,10 M48,80 Q35,65 40,45 Q45,30 35,15" />
  </svg>
);

const SeaGrass: React.FC<{ className?: string, style?: any }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 50 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
    <path d="M25,100 Q35,75 25,50 T25,0 M25,100 Q15,75 25,60 T15,20 M25,100 Q40,80 30,65 T40,30" />
  </svg>
);

// 2. Hệ sinh thái Đáy biển (Đá + San hô)
const SeaBed = () => (
  <div className="fixed bottom-0 left-0 w-full h-[35vh] pointer-events-none z-0 flex items-end justify-between overflow-hidden">
    {/* Vùng tối dưới đáy tảng đá */}
    <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-cyan-900/40 to-transparent z-0"></div>

    {/* Góc Trái: Đá, San hô hồng và Rong biển */}
    <div className="relative w-1/2 h-full flex items-end z-10">
      <SeaGrass className="absolute bottom-10 left-32 w-16 h-28 text-emerald-500/50 animate-sway-slow" style={{animationDelay: '0.5s'}} />
      <Coral className="absolute bottom-2 left-10 w-32 h-40 animate-sway text-pink-500/60 drop-shadow-md" />
      <Coral className="absolute bottom-8 left-28 w-24 h-32 animate-sway text-purple-400/60 drop-shadow-md" style={{animationDelay: '1s'}} />
      <svg className="absolute -bottom-16 -left-16 w-80 h-56 text-cyan-800/40 drop-shadow-xl" viewBox="0 0 200 200" fill="currentColor">
        <path d="M45.7,-76.4C58.9,-69.3,69.1,-55.3,77.3,-40.7C85.5,-26.1,91.8,-11,90.2,3.3C88.6,17.6,79.1,31,69.5,43.2C59.9,55.4,50.3,66.4,37.8,73.4C25.3,80.4,9.9,83.4,-4.8,80.1C-19.5,76.8,-33.4,67.2,-46.8,57.1C-60.2,47,-73,36.4,-80.7,21.8C-88.4,7.2,-91,-11.3,-84.9,-27C-78.8,-42.7,-64.1,-55.5,-49,-61.7C-33.9,-67.9,-17,-67.5,-0.6,-66.5C15.8,-65.5,31.6,-64,45.7,-76.4Z" />
      </svg>
    </div>

    {/* Góc Phải: Đá và San hô cam */}
    <div className="relative w-1/2 h-full flex items-end justify-end z-10">
      <SeaGrass className="absolute bottom-16 right-40 w-20 h-32 text-teal-500/50 animate-sway-slow" style={{animationDelay: '1.2s'}} />
      <Coral className="absolute bottom-4 right-16 w-36 h-48 animate-sway text-orange-400/60 drop-shadow-md" style={{animationDelay: '0.3s', transform: 'scaleX(-1)'}} />
      <svg className="absolute -bottom-20 -right-10 w-96 h-64 text-cyan-900/30 drop-shadow-2xl" viewBox="0 0 200 200" fill="currentColor">
        <path d="M51.8,-71.4C66.5,-61.9,77.3,-46.1,83,-28.9C88.7,-11.7,89.3,6.9,83.5,23.3C77.7,39.7,65.5,53.9,50.8,63.1C36.1,72.3,18.1,76.5,0.8,75.4C-16.5,74.3,-33,67.9,-47.5,58.3C-62,48.7,-74.5,35.9,-81.4,20.1C-88.3,4.3,-89.6,-14.5,-83.1,-30.3C-76.6,-46.1,-62.3,-58.9,-46.9,-68.2C-31.5,-77.5,-15.8,-83.3,1.1,-84.8C18,-86.3,36,-83.5,51.8,-71.4Z" />
      </svg>
    </div>
  </div>
);

// 3. Sinh vật phù du phát sáng lấp lánh (Bioluminescence)
const GlowingCreatures = () => {
  const creatures = Array.from({ length: 45 }).map((_, i) => {
    const isCyan = Math.random() > 0.5;
    const size = Math.random() * 4 + 2;
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 100}%`,
      size: size,
      duration: `${3 + Math.random() * 5}s`,
      delay: `${Math.random() * 5}s`,
      color: isCyan ? '#22d3ee' : '#34d399', // Phát sáng xanh dương hoặc xanh lá
      shadowSize: size * 3
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {creatures.map(c => (
        <div
          key={c.id}
          className="absolute rounded-full mix-blend-screen opacity-80"
          style={{
            left: c.left,
            bottom: c.bottom,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            boxShadow: `0 0 ${c.shadowSize}px ${c.size}px ${c.color}`,
            animation: `float-glow ${c.duration} ease-in-out infinite alternate`,
            animationDelay: c.delay,
          }}
        />
      ))}
    </div>
  );
};

// 4. Bong bóng sủi bọt
const BubbleEffect = () => {
  const bubbles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 10 + 6,
    duration: `${6 + Math.random() * 8}s`,
    delay: `${Math.random() * 5}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute bottom-[-20px] rounded-full bg-white/30 border border-white/60 backdrop-blur-[1px]"
          style={{ left: b.left, width: b.size, height: b.size, animation: `rise ${b.duration} linear infinite`, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
};

// 5. Đàn cá bơi trong suốt
const FishEffect = () => {
  const fishList = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    top: `${15 + Math.random() * 60}%`,
    size: Math.random() * 30 + 20,
    duration: `${20 + Math.random() * 15}s`,
    delay: `${Math.random() * 10}s`,
    direction: Math.random() > 0.5 ? 'left-to-right' : 'right-to-left'
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {fishList.map(f => (
        <div key={f.id} className="absolute opacity-20 text-cyan-600" style={{ top: f.top, width: f.size, height: f.size / 2, animation: `${f.direction} ${f.duration} linear infinite`, animationDelay: f.delay }}>
          <svg viewBox="0 0 100 50" fill="currentColor" style={{ transform: f.direction === 'right-to-left' ? 'scaleX(-1)' : 'none' }}>
            <path d="M10,25 C30,10 70,10 90,25 C70,40 30,40 10,25 M90,25 L100,15 L95,25 L100,35 Z" />
            <circle cx="30" cy="22" r="3" fill="rgba(0,0,0,0.5)" />
          </svg>
        </div>
      ))}
    </div>
  );
};

// Hào quang chuột
const OceanCursorGlow = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const updatePosition = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);
  return (
    <div className="pointer-events-none fixed z-[9999] transition-all duration-300 ease-out mix-blend-overlay hidden lg:block" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}>
      <div className="w-8 h-8 bg-white rounded-full blur-[4px] animate-ping opacity-60"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-100 rounded-full blur-3xl opacity-60"></div>
    </div>
  );
};

// Bảng đá đại dương
const OceanPlaque: React.FC<{ text: string, position: 'left' | 'right' }> = ({ text, position }) => {
  const words = text.split(' ');
  return (
    <div className={`fixed top-[15%] hidden xl:flex flex-col items-center z-20 animate-float ${position === 'left' ? 'left-8' : 'right-8'}`} style={{ animationDelay: position === 'left' ? '0s' : '2s' }}>
      <div className="bg-white/10 backdrop-blur-lg text-cyan-900 py-10 px-5 rounded-[2.5rem] border border-cyan-100/40 shadow-[0_15px_30px_rgba(34,211,238,0.2)] flex flex-col gap-5 items-center justify-center min-w-[75px]">
        <div className="absolute inset-1.5 border-2 border-cyan-500/10 rounded-[20px] pointer-events-none shadow-[inset_0_0_10px_rgba(255,255,255,0.4)]"></div>
        {words.map((word, i) => (
          <span key={i} className="font-sans text-2xl lg:text-3xl font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">{word}</span>
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
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error('Failed to parse', e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prev => [{ ...item, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }, ...prev].slice(0, 50));
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
      validFiles.forEach(f => addToHistory({ type: 'upload', filename: f.name, size: f.size, platform: activePlatform }));
    }
    setFiles(prev => [...prev, ...validFiles]);
    setProcessedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) { setProcessedFileUrl(null); setState({ status: 'idle', message: '' }); }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setState({ status: 'processing', message: `Đang xử lý ${activePlatform.toUpperCase()} qua làn nước...` });
    try {
      const blob = await processExcelFiles(files, activePlatform);
      const url = URL.createObjectURL(blob);
      setProcessedFileUrl(url);
      setState({ status: 'success', message: `Xử lý ${activePlatform.toUpperCase()} xong!` });
      addToHistory({ type: 'download', filename: `KET_QUA_${activePlatform.toUpperCase()}_${new Date().getTime()}.xlsx`, count: files.length, platform: activePlatform });
    } catch (error: any) {
      setState({ status: 'error', message: error.message || 'Lỗi xử lý file.' });
    }
  };

  const reset = () => { setFiles([]); setState({ status: 'idle', message: '' }); setProcessedFileUrl(null); };
  const clearHistory = () => { if (confirm('Xóa sạch lịch sử đơn?')) setHistory([]); };

  return (
    // XÓA ẢNH NỀN CŨ - Chỉ dùng CSS Gradient cho nước biển trong vắt
    <Layout className="bg-gradient-to-b from-cyan-200 via-sky-100 to-cyan-400 min-h-screen relative overflow-hidden">
      <GlowingCreatures />
      <SeaBed />
      <BubbleEffect />
      <FishEffect />
      <OceanCursorGlow />
      <OceanPlaque text="Sóng dữ không ngã lòng" position="left" />
      <OceanPlaque text="Biển khơi lộc tràn trề" position="right" />

      <div className="flex flex-col gap-10 relative z-10 text-cyan-950 pt-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-sm text-cyan-900 px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border border-white/60 shadow-md animate-bounce-slow">
            <span className="animate-pulse">🌊</span> PHIÊN BẢN CÓ ĐƠN CLEAR WATER <span className="animate-pulse">🌊</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mt-4 text-transparent bg-clip-text bg-gradient-to-br from-cyan-900 via-cyan-600 to-sky-700 drop-shadow-md" style={{textShadow: '0 4px 15px rgba(255,255,255,0.8)'}}>
            LÊN ĐƠN THÔI
          </h1>
        </div>

        {/* Platform Tabs Section */}
        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-3xl border border-cyan-100/40 shadow-[0_20px_40px_rgba(34,211,238,0.2)] flex gap-2">
            <button 
              onClick={() => { setActivePlatform('shopee'); reset(); }}
              className={`px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 ${
                activePlatform === 'shopee' 
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white border border-orange-300 shadow-[0_10px_20px_rgba(249,115,22,0.3)] scale-105' 
                  : 'bg-transparent text-cyan-900 border-transparent hover:bg-white/20 hover:text-cyan-950'
              }`}
            >
              SHOPEE
            </button>
            <button 
              onClick={() => { setActivePlatform('tiktok'); reset(); }}
              className={`px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 ${
                activePlatform === 'tiktok' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-cyan-300 shadow-[0_10px_20px_rgba(34,211,238,0.3)] scale-105' 
                  : 'bg-transparent text-cyan-900 border-transparent hover:bg-white/20 hover:text-cyan-950'
              }`}
            >
              TIKTOK
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 lg:px-10">
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Nhật ký */}
            <div className="bg-white/10 backdrop-blur-md p-7 rounded-3xl border border-cyan-100/40 shadow-[0_15px_30px_rgba(34,211,238,0.2)] space-y-4 transition-transform hover:-translate-y-1 duration-300 relative">
              <div className="absolute inset-1.5 border border-cyan-200/10 rounded-[20px] pointer-events-none shadow-[inset_0_0_10px_rgba(255,255,255,0.4)]"></div>
              <div className="flex items-center justify-between border-b border-cyan-100/30 pb-3 relative z-10">
                <h2 className="text-lg font-bold text-cyan-950 tracking-wide font-sans">NHẬT KÝ BIỂN KHƠI</h2>
                {history.length > 0 && <button onClick={clearHistory} className="text-xs font-bold text-cyan-800 hover:text-cyan-950 uppercase tracking-wider">Xóa</button>}
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
                {history.length === 0 ? (
                  <div className="text-center py-8 opacity-60">
                    <span className="text-4xl">🫧</span>
                    <p className="text-cyan-900 text-xs mt-2 font-medium">Chưa có đơn</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-cyan-100/20 border border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${
                        item.platform === 'shopee' ? 'bg-orange-500/30 text-orange-950 border-orange-500/40' : 'bg-cyan-500/30 text-cyan-950 border-cyan-500/40'
                      }`}>
                        {item.platform === 'shopee' ? 'S' : 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-cyan-950 truncate text-sm">{item.filename}</p>
                        <div className="flex justify-between items-center mt-1 text-cyan-800 text-xs font-medium">
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
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-[2.5rem] border border-cyan-100/40 shadow-[0_20px_40px_rgba(34,211,238,0.2)] overflow-hidden relative">
              <div className="absolute inset-2 border-2 border-cyan-200/10 rounded-[35px] pointer-events-none shadow-[inset_0_0_15px_rgba(255,255,255,0.4)]"></div>
              <div className="p-8 relative z-10">
                {files.length < MAX_FILES && !processedFileUrl && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-4 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 group relative overflow-hidden ${
                      activePlatform === 'shopee' 
                        ? 'border-orange-300/60 bg-orange-100/30 hover:bg-orange-100/50 hover:border-orange-400' 
                        : 'border-cyan-300/60 bg-cyan-100/30 hover:bg-cyan-100/50 hover:border-cyan-400'
                    }`}
                    style={{ animation: 'float 4s ease-in-out infinite' }}
                  >
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300 bg-white/40 border border-cyan-200/50 text-cyan-900 shadow-xl shadow-cyan-500/10">
                       <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                       </svg>
                    </div>
                    <p className="text-2xl font-black text-cyan-950 text-center group-hover:scale-105 transition-transform">
                      Thả file {activePlatform === 'shopee' ? 'Shopee' : 'Tiktok'} xuống nước
                    </p>
                    <p className="mt-2 text-cyan-800 font-medium text-sm">hoặc nhấp chuột để chọn</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between border-b border-cyan-200/30 pb-2">
                      <h3 className="text-xs font-black text-cyan-900 uppercase tracking-widest">Danh sách ({files.length})</h3>
                      {!processedFileUrl && <button onClick={reset} className="text-xs text-red-600 font-bold hover:bg-red-100/30 px-3 py-1 rounded-full transition-colors">Hủy / Thả xích</button>}
                    </div>
                    {files.map((f, index) => (
                      <div key={index} className="flex items-center justify-between bg-cyan-100/30 p-4 rounded-xl border border-cyan-500/10 group hover:border-cyan-400 transition-colors animate-fade-in relative">
                        <div className="flex items-center gap-3 relative z-10">
                           <div className="bg-white/40 p-2 rounded-lg text-cyan-900 border border-cyan-200/50 shadow-sm">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                           </div>
                           <span className="text-sm font-bold text-cyan-950 truncate max-w-[200px]">{f.name}</span>
                        </div>
                        {!processedFileUrl && <button onClick={() => removeFile(index)} className="text-cyan-600 hover:text-red-400 p-2 relative z-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
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
                            colors: ['#38bdf8', '#fb7185', '#22d3ee']
                          });
                        }
                        handleProcess();
                      }}
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden group ${
                        activePlatform === 'shopee' 
                          ? 'bg-gradient-to-r from-orange-400 via-orange-300 to-amber-400 text-orange-950 border border-orange-300' 
                          : 'bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400 text-white shadow-cyan-500/20'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2 tracking-wider">
                        🐠 XỬ LÝ ĐƠN NGAY
                      </span>
                      <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    </button>
                  )}

                  {state.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-12 gap-5 bg-white/20 rounded-3xl border border-cyan-100/30 shadow-inner">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-full border-4 border-cyan-200 border-t-cyan-500 animate-spin"></div>
                      </div>
                      <p className="font-bold text-cyan-900 uppercase tracking-widest text-sm animate-pulse">{state.message}</p>
                    </div>
                  )}

                  {state.status === 'success' && processedFileUrl && (
                    <div className="space-y-5 animate-slide-up relative z-10">
                      <div className="bg-gradient-to-r from-cyan-100 via-white to-sky-100 border border-cyan-200 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden shadow-xl">
                        <div className="absolute inset-1.5 border border-cyan-200/20 rounded-[15px] pointer-events-none shadow-[inset_0_0_10px_rgba(255,255,255,0.4)]"></div>
                        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white p-3 rounded-full z-10 animate-bounce-slow shadow-lg shadow-cyan-200/50">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="z-10">
                          <p className="font-black text-cyan-950 text-lg">Thu hoạch thành công!</p>
                          <p className="text-cyan-900 text-sm">{state.message}</p>
                        </div>
                      </div>
                      <a href={processedFileUrl} download={`KET_QUA_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center gap-4 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-6 rounded-2xl font-black text-xl shadow-2xl hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.01] transition-all border border-cyan-300/30 shadow-cyan-500/20">
                        <svg className="w-7 h-7 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        TẢI FILE KẾT QUẢ VỀ MÁY
                      </a>
                      <button onClick={reset} className="w-full text-cyan-800 font-bold hover:text-cyan-950 uppercase tracking-widest text-xs py-2 transition-colors">Làm lượt mới</button>
                    </div>
                  )}

                  {state.status === 'error' && (
                    <div className="bg-red-100/50 backdrop-blur-sm border border-red-300/60 p-6 rounded-2xl flex items-center gap-5 text-red-950 animate-shake shadow-lg relative z-10">
                       <div className="absolute inset-1 border border-red-200 rounded-[15px]"></div>
                      <svg className="w-6 h-6 text-red-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-bold relative z-10">{state.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Khai báo CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:4px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#fb923c;border-radius:10px;}
        
        .animate-spin-slow { animation: spin 15s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-sway { animation: sway 4s ease-in-out infinite alternate; transform-origin: bottom center; }
        .animate-sway-slow { animation: sway 6s ease-in-out infinite alternate; transform-origin: bottom center; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 
          0%, 100% { transform: translateY(-3%); } 
          50% { transform: translateY(0); } 
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @keyframes rise {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(1.1); opacity: 0; }
        }

        @keyframes float-glow {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0.9; }
        }

        @keyframes sway {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }

        @keyframes left-to-right {
          0% { transform: translateX(-20vw); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
        @keyframes right-to-left {
          0% { transform: translateX(120vw); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateX(-20vw); opacity: 0; }
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
