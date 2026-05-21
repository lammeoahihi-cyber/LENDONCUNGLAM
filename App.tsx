import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { processExcelFiles } from './services/excelService';
import { ProcessingState, HistoryItem, Platform } from './types';
import { ACCEPTED_FILE_TYPES } from './constants';

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';

// 1. Rừng Tảo Creepvine (Đặc trưng Subnautica với cụm hạt vàng phát sáng)
const Creepvine: React.FC<{ className?: string, style?: any }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 60 200" fill="none" stroke="currentColor">
    {/* Thân tảo */}
    <path d="M30,200 Q50,150 30,100 T30,0" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
    <path d="M30,200 Q20,130 40,80 T20,20" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
    {/* Hạt phát sáng (Seed Clusters) */}
    <circle cx="42" cy="120" r="7" fill="#fde047" stroke="none" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 10px #eab308)' }} />
    <circle cx="38" cy="105" r="5" fill="#fde047" stroke="none" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 8px #eab308)' }} />
    <circle cx="15" cy="60" r="8" fill="#fde047" stroke="none" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 12px #eab308)', animationDelay: '0.5s' }} />
    <circle cx="22" cy="72" r="4" fill="#fde047" stroke="none" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 8px #eab308)' }} />
    <circle cx="45" cy="30" r="6" fill="#fde047" stroke="none" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 10px #eab308)', animationDelay: '1s' }} />
  </svg>
);

// 2. Nấm sứa phát sáng (Jellyshroom) / San hô tím
const AlienFlora: React.FC<{ className?: string, style?: any }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" stroke="none">
    {/* Thân */}
    <path d="M45,100 C45,70 40,50 50,40 C60,50 55,70 55,100 Z" fill="#6b21a8" />
    {/* Tán nấm phát sáng */}
    <path d="M20,45 C20,10 80,10 80,45 C90,45 90,55 80,55 C70,60 30,60 20,55 C10,55 10,45 20,45 Z" fill="#d946ef" style={{ filter: 'drop-shadow(0 0 15px #c026d3)' }} className="animate-pulse" />
    {/* Chấm quang học */}
    <circle cx="40" cy="35" r="3" fill="#fdf4ff" />
    <circle cx="60" cy="30" r="2.5" fill="#fdf4ff" />
    <circle cx="50" cy="25" r="4" fill="#fdf4ff" />
  </svg>
);

// Hệ sinh thái đáy biển 4546B
const SubnauticaSeaBed = () => (
  <div className="fixed bottom-0 left-0 w-full h-[40vh] pointer-events-none z-0 flex items-end justify-between overflow-hidden">
    {/* Tảng đá ngầm tối màu */}
    <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-slate-950 via-indigo-950/80 to-transparent z-0"></div>

    {/* Rừng tảo bên trái */}
    <div className="relative w-1/2 h-full flex items-end z-10">
      <Creepvine className="absolute -bottom-10 left-10 w-24 h-64 text-green-500 animate-sway-slow" />
      <Creepvine className="absolute -bottom-5 left-24 w-16 h-48 text-green-600 animate-sway" style={{ animationDelay: '1.2s' }} />
      <AlienFlora className="absolute bottom-5 left-40 w-28 h-32 animate-float" />
      <svg className="absolute -bottom-10 -left-10 w-64 h-40 text-slate-900 drop-shadow-2xl" viewBox="0 0 200 200" fill="currentColor">
        <path d="M45.7,-76.4C58.9,-69.3,69.1,-55.3,77.3,-40.7C85.5,-26.1,91.8,-11,90.2,3.3C88.6,17.6,79.1,31,69.5,43.2C59.9,55.4,50.3,66.4,37.8,73.4C25.3,80.4,9.9,83.4,-4.8,80.1C-19.5,76.8,-33.4,67.2,-46.8,57.1C-60.2,47,-73,36.4,-80.7,21.8C-88.4,7.2,-91,-11.3,-84.9,-27C-78.8,-42.7,-64.1,-55.5,-49,-61.7C-33.9,-67.9,-17,-67.5,-0.6,-66.5C15.8,-65.5,31.6,-64,45.7,-76.4Z" />
      </svg>
    </div>

    {/* Nấm sứa bên phải */}
    <div className="relative w-1/2 h-full flex items-end justify-end z-10">
      <AlienFlora className="absolute bottom-10 right-20 w-40 h-48 animate-float" style={{ animationDelay: '0.5s', transform: 'scaleX(-1)' }} />
      <Creepvine className="absolute -bottom-12 right-48 w-20 h-56 text-emerald-700 animate-sway-slow" style={{ animationDelay: '2s' }} />
      <svg className="absolute -bottom-16 -right-10 w-80 h-56 text-indigo-950 drop-shadow-2xl" viewBox="0 0 200 200" fill="currentColor">
        <path d="M51.8,-71.4C66.5,-61.9,77.3,-46.1,83,-28.9C88.7,-11.7,89.3,6.9,83.5,23.3C77.7,39.7,65.5,53.9,50.8,63.1C36.1,72.3,18.1,76.5,0.8,75.4C-16.5,74.3,-33,67.9,-47.5,58.3C-62,48.7,-74.5,35.9,-81.4,20.1C-88.3,4.3,-89.6,-14.5,-83.1,-30.3C-76.6,-46.1,-62.3,-58.9,-46.9,-68.2C-31.5,-77.5,-15.8,-83.3,1.1,-84.8C18,-86.3,36,-83.5,51.8,-71.4Z" />
      </svg>
    </div>
  </div>
);

// 3. Đàn cá Peeper / Sinh vật ngoài hành tinh bơi lội
const PeeperSchool = () => {
  const fishList = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    top: `${15 + Math.random() * 60}%`,
    size: Math.random() * 35 + 25,
    duration: `${12 + Math.random() * 10}s`,
    delay: `${Math.random() * 8}s`,
    direction: Math.random() > 0.5 ? 'left-to-right' : 'right-to-left'
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {fishList.map(f => (
        <div key={f.id} className="absolute opacity-80" style={{ top: f.top, width: f.size, height: f.size / 1.5, animation: `${f.direction} ${f.duration} linear infinite`, animationDelay: f.delay }}>
          <svg viewBox="0 0 100 60" fill="none" style={{ transform: f.direction === 'right-to-left' ? 'scaleX(-1)' : 'none' }}>
            {/* Vây cá */}
            <path d="M30,30 L10,10 L15,30 L10,50 Z" fill="#0284c7" />
            <path d="M50,15 L70,5 L65,25 Z" fill="#38bdf8" />
            <path d="M50,45 L70,55 L65,35 Z" fill="#38bdf8" />
            {/* Thân cá */}
            <path d="M20,30 C30,10 70,10 90,30 C70,50 30,50 20,30 Z" fill="#0ea5e9" />
            {/* Mắt to đặc trưng của Peeper */}
            <circle cx="70" cy="30" r="12" fill="#fde047" />
            <circle cx="73" cy="30" r="8" fill="#1e40af" />
          </svg>
        </div>
      ))}
    </div>
  );
};

// 4. Bào tử phát quang sinh học (Bioluminescent Spores)
const Bioluminescence = () => {
  const spores = Array.from({ length: 50 }).map((_, i) => {
    const size = Math.random() * 5 + 2;
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 100}%`,
      size: size,
      duration: `${3 + Math.random() * 5}s`,
      delay: `${Math.random() * 5}s`,
      color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7', // Xanh cyan hoặc tím
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {spores.map(c => (
        <div
          key={c.id}
          className="absolute rounded-full mix-blend-screen opacity-90"
          style={{
            left: c.left, bottom: c.bottom, width: c.size, height: c.size,
            backgroundColor: c.color,
            boxShadow: `0 0 ${c.size * 3}px ${c.size}px ${c.color}`,
            animation: `float-glow ${c.duration} ease-in-out infinite alternate`,
            animationDelay: c.delay,
          }}
        />
      ))}
    </div>
  );
};

// 5. Ánh sáng chiếu từ mặt nước xuống (God Rays)
const GodRays = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay">
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[150%] bg-gradient-to-b from-cyan-100/30 to-transparent -rotate-[30deg] blur-3xl transform origin-top-left animate-pulse-slow"></div>
    <div className="absolute top-[-10%] right-[10%] w-[40%] h-[150%] bg-gradient-to-b from-teal-100/20 to-transparent -rotate-[15deg] blur-2xl transform origin-top animate-pulse" style={{animationDuration: '5s'}}></div>
  </div>
);

// Hào quang chuột công nghệ cao (Alterra Scanner)
const AlterraScannerGlow = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const updatePosition = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);
  return (
    <div className="pointer-events-none fixed z-[9999] transition-all duration-100 ease-out hidden lg:block" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}>
      <div className="w-10 h-10 border-2 border-cyan-400 rounded-full animate-ping opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_15px_#22d3ee]"></div>
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
      setState({ status: 'error', message: `Quá tải bộ nhớ PDA! Tối đa ${MAX_FILES} file.` });
      return;
    }
    const validFiles = selectedFiles.filter(f => ACCEPTED_FILE_TYPES.includes(f.type));
    if (validFiles.length !== selectedFiles.length) {
      setState({ status: 'error', message: 'Hệ thống chỉ nhận file Excel (.xlsx, .xls).' });
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
    setState({ status: 'processing', message: `Hệ thống PDA đang quét dữ liệu ${activePlatform.toUpperCase()}...` });
    try {
      const blob = await processExcelFiles(files, activePlatform);
      const url = URL.createObjectURL(blob);
      setProcessedFileUrl(url);
      setState({ status: 'success', message: `Phân tích ${activePlatform.toUpperCase()} hoàn tất!` });
      addToHistory({ type: 'download', filename: `DATA_${activePlatform.toUpperCase()}_${new Date().getTime()}.xlsx`, count: files.length, platform: activePlatform });
    } catch (error: any) {
      setState({ status: 'error', message: error.message || 'Lỗi quét dữ liệu.' });
    }
  };

  const reset = () => { setFiles([]); setState({ status: 'idle', message: '' }); setProcessedFileUrl(null); };
  const clearHistory = () => { if (confirm('Xóa bộ nhớ lưu trữ PDA?')) setHistory([]); };

  return (
    // Nền chuyển sâu thẳm: Từ Cyan rực rỡ mặt nước xuống Indigo dưới đáy (Chuẩn màu Safe Shallows)
    <Layout className="bg-gradient-to-b from-teal-400 via-cyan-800 to-indigo-950 min-h-screen relative overflow-hidden font-sans">
      <GodRays />
      <Bioluminescence />
      <SubnauticaSeaBed />
      <PeeperSchool />
      <AlterraScannerGlow />

      <div className="flex flex-col gap-10 relative z-10 text-cyan-50 pt-10 px-4 max-w-7xl mx-auto">
        {/* Header viễn tưởng */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 bg-slate-900/80 backdrop-blur-md text-cyan-400 px-6 py-2 rounded-sm border-l-4 border-r-4 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-[0.2em] text-xs uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            ALTERRA CORPORATION DATABANK
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mt-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] uppercase" style={{fontFamily: 'monospace'}}>
            LÊN ĐƠN THÔI
          </h1>
        </div>

        {/* Tab chuyển đổi phong cách màn hình PDA */}
        <div className="flex justify-center">
          <div className="bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-lg border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex gap-2">
            <button 
              onClick={() => { setActivePlatform('shopee'); reset(); }}
              className={`px-8 py-3 rounded-md font-bold text-lg transition-all duration-300 tracking-wider ${
                activePlatform === 'shopee' 
                  ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.6)]' 
                  : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              SHOPEE
            </button>
            <button 
              onClick={() => { setActivePlatform('tiktok'); reset(); }}
              className={`px-8 py-3 rounded-md font-bold text-lg transition-all duration-300 tracking-wider ${
                activePlatform === 'tiktok' 
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.6)]' 
                  : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              TIKTOK
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Box Lịch sử - Dark UI */}
            <div className="bg-slate-950/70 backdrop-blur-xl p-7 rounded-xl border border-cyan-900/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              {/* Viền scan chạy quanh box */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-scan"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-cyan-500 tracking-widest uppercase flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  NHẬT KÝ PDA
                </h2>
                {history.length > 0 && <button onClick={clearHistory} className="text-xs font-bold text-slate-500 hover:text-red-400 uppercase tracking-wider">PURGE</button>}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar mt-4">
                {history.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <svg className="w-12 h-12 mx-auto text-slate-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    <p className="text-slate-500 text-xs tracking-widest uppercase">DATABANK EMPTY</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-900/50 border border-slate-800 hover:border-cyan-700/50 rounded-lg transition-colors">
                      <div className={`mt-0.5 w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-sm border ${
                        item.platform === 'shopee' ? 'bg-orange-950/50 text-orange-400 border-orange-700' : 'bg-cyan-950/50 text-cyan-400 border-cyan-700'
                      }`}>
                        {item.platform === 'shopee' ? 'SHP' : 'TIK'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-cyan-100 truncate text-sm">{item.filename}</p>
                        <div className="flex justify-between items-center mt-1 text-slate-500 text-xs font-mono">
                          <span className="uppercase text-[10px]">{item.type === 'upload' ? '> UPLOADED' : '> EXTRACTED'}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false})}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6 order-1 lg:order-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {/* Khu vực Dropzone - Giao diện công nghệ sinh tồn */}
            <div className="bg-slate-950/70 backdrop-blur-xl p-2 rounded-xl border border-cyan-900/50 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative">
              <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              
              <div className="p-6 relative z-10">
                {files.length < MAX_FILES && !processedFileUrl && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 bg-slate-900/40 relative overflow-hidden group ${
                      activePlatform === 'shopee' 
                        ? 'border-orange-700 hover:border-orange-400 hover:bg-orange-950/30' 
                        : 'border-cyan-700 hover:border-cyan-400 hover:bg-cyan-950/30'
                    }`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }} /* Cắt vát góc kiểu viễn tưởng */
                  >
                    <div className="w-20 h-20 flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300 bg-slate-800 border border-slate-600 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-md">
                       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                       </svg>
                    </div>
                    <p className="text-xl font-mono text-cyan-50 text-center tracking-wide uppercase">
                      TẢI DỮ LIỆU {activePlatform === 'shopee' ? 'SHOPEE' : 'TIKTOK'}
                    </p>
                    <p className="mt-2 text-slate-500 font-mono text-xs tracking-widest uppercase">Click để mở kho lưu trữ</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-mono text-cyan-500 tracking-widest">FILES ĐÃ CHỌN ({files.length})</h3>
                      {!processedFileUrl && <button onClick={reset} className="text-xs text-red-500 font-mono hover:text-red-300 uppercase tracking-widest">ABORT</button>}
                    </div>
                    {files.map((f, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-900/60 p-3 border border-slate-700 hover:border-cyan-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="bg-slate-800 p-1.5 rounded-sm text-cyan-400 border border-slate-700">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                           </div>
                           <span className="text-sm font-mono text-cyan-100 truncate max-w-[200px]">{f.name}</span>
                        </div>
                        {!processedFileUrl && <button onClick={() => removeFile(index)} className="text-slate-500 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
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
                            particleCount: 100,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#22d3ee', '#fde047', '#a855f7'], // Cyan, Vàng, Tím
                            shapes: ['square']
                          });
                        }
                        handleProcess();
                      }}
                      className={`w-full py-4 font-mono font-bold text-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 relative overflow-hidden group uppercase tracking-widest ${
                        activePlatform === 'shopee' 
                          ? 'bg-orange-600 hover:bg-orange-500 text-white border-b-4 border-orange-800' 
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white border-b-4 border-cyan-800'
                      }`}
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        INITIATE FUSION
                      </span>
                      {/* Hiệu ứng quét lướt của máy */}
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  )}

                  {state.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-10 gap-5 bg-slate-900/50 border border-cyan-900 shadow-inner">
                      <div className="relative flex items-center justify-center">
                         {/* Radar viễn tưởng */}
                         <div className="w-16 h-16 rounded-full border border-cyan-700 absolute"></div>
                         <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin"></div>
                         <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                      </div>
                      <p className="font-mono text-cyan-400 tracking-[0.2em] text-xs uppercase animate-pulse">{state.message}</p>
                    </div>
                  )}

                  {state.status === 'success' && processedFileUrl && (
                    <div className="space-y-4 animate-slide-up relative z-10">
                      <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-sm flex items-center gap-4 relative overflow-hidden">
                        <div className="bg-emerald-500 text-slate-900 p-2 rounded-sm z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="z-10 font-mono">
                          <p className="font-bold text-emerald-400 text-base tracking-widest uppercase">FUSION COMPLETE</p>
                          <p className="text-emerald-200/70 text-xs">{state.message}</p>
                        </div>
                      </div>
                      <a href={processedFileUrl} download={`DATA_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center gap-3 w-full bg-slate-800 text-cyan-400 py-4 font-mono font-bold text-lg hover:bg-slate-700 hover:text-white transition-all border border-cyan-700 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] tracking-widest" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                        <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        DOWNLOAD DATA
                      </a>
                      <button onClick={reset} className="w-full text-slate-500 font-mono hover:text-cyan-400 uppercase tracking-[0.2em] text-xs py-2 transition-colors">>> RESTART SEQUENCE</button>
                    </div>
                  )}

                  {state.status === 'error' && (
                    <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-sm flex items-center gap-4 text-red-400 animate-shake shadow-lg font-mono text-sm tracking-wide">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>SYSTEM ERROR: {state.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Khai báo CSS - Subnautica Theme */}
      <style>{`
        /* Scrollbar phong cách công nghệ */
        .custom-scrollbar::-webkit-scrollbar{width:6px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:rgba(15, 23, 42, 0.5);}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#0891b2; border-radius:0px;}
        
        .animate-spin-slow { animation: spin 15s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; opacity: 0; transform: translateY(10px); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-sway { animation: sway 4s ease-in-out infinite alternate; transform-origin: bottom center; }
        .animate-sway-slow { animation: sway 7s ease-in-out infinite alternate; transform-origin: bottom center; }
        .animate-scan { animation: scan 3s linear infinite; }
        .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite alternate; }

        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(400px); }
        }

        @keyframes pulseSlow {
          0% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @keyframes float-glow {
          0% { transform: translateY(0) scale(1); opacity: 0.2; }
          100% { transform: translateY(-40px) scale(1.3); opacity: 0.8; }
        }

        @keyframes sway {
          0% { transform: rotate(-5deg); }
          100% { transform: rotate(5deg); }
        }

        @keyframes left-to-right {
          0% { transform: translateX(-20vw) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(120vw) translateY(-10vh); opacity: 0; }
        }
        @keyframes right-to-left {
          0% { transform: translateX(120vw) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(-20vw) translateY(-5vh); opacity: 0; }
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
          40%, 60% { transform: translate3d(2px, 0, 0); }
        }
      `}</style>
    </Layout>
  );
};

export default App;
