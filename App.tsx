import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { processExcelFiles } from './services/excelService';
import { ProcessingState, HistoryItem, Platform } from './types';
import { ACCEPTED_FILE_TYPES } from './constants';
import * as XLSX from 'xlsx';
import {
  Sparkle,
  Star,
  FallingSparkles,
  BubbleSVG,
  StarfishSVG,
  JellyfishSVG,
  RisingBubbles,
  SwimmingFish,
  Couplet
} from './components/Decorations';

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';
const FEEDBACK_STORAGE_KEY = 'len_don_feedback_history_v1';

interface NoticeItem {
  id: number;
  date: string;
  title: string;
  desc: string;
}

interface FeedbackItem {
  id: string;
  name: string;
  content: string;
  timestamp: number;
}

const DEFAULT_NOTICES: NoticeItem[] = [
  { id: 1, date: "25/05", title: "Gom đơn Shopee Sale", desc: "Chốt danh sách và gộp file đối soát đợt 1." },
  { id: 2, date: "28/05", title: "Thanh toán công nợ", desc: "Kiểm tra ví và thanh toán cho bên nhà cung cấp." },
  { id: 3, date: "01/06", title: "Nhập kho hàng hè mới", desc: "Kiểm đếm số lượng áo thun và váy hoa nhí vừa về." },
];

// 1. Hiệu ứng Giao diện Tết: Mưa hoa xuân phát quang
const BioluminescentFlowersTet = () => {
  const flowers = Array.from({ length: 30 }).map((_, i) => {
    const isMai = Math.random() > 0.5;
    return {
      id: i, left: `${Math.random() * 100}%`,
      animationDuration: `${7 + Math.random() * 6}s`, animationDelay: `${Math.random() * 5}s`,
      color: isMai ? '#FDE047' : '#FBCFE8', centerColor: isMai ? '#EA580C' : '#BE185D',
      size: Math.random() * 15 + 15, pulseDuration: `${2 + Math.random() * 2}s`
    };
  });
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {flowers.map(f => (
        <div key={f.id} className="absolute -top-10 opacity-90" style={{ left: f.left, width: f.size, height: f.size, animation: `fall ${f.animationDuration} linear infinite, pulseBreath ${f.pulseDuration} ease-in-out infinite alternate`, animationDelay: `${f.animationDelay}, 0s` }}>
          <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(234,179,8,0.4))' }}>
            <path d="M50,15 C60,0 80,15 70,35 C85,25 100,45 80,60 C90,80 65,95 50,75 C35,95 10,80 20,60 C0,45 15,25 30,35 C20,15 40,0 50,15 Z" fill={f.color}/><circle cx="50" cy="48" r="12" fill={f.centerColor}/>
          </svg>
        </div>
      ))}
    </div>
  );
};

// 2. Hiệu ứng Giao diện Biển: Bào tử phát quang sinh học
const BioluminescenceSpores = () => {
  const spores = Array.from({ length: 30 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, bottom: `${Math.random() * 100}%`,
    size: Math.random() * 5 + 3, duration: `${3 + Math.random() * 4}s`, delay: `${Math.random() * 3}s`,
    color: Math.random() > 0.5 ? '#22d3ee' : '#c026d3',
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen">
      {spores.map(c => (
        <div key={c.id} className="absolute rounded-full" style={{ left: c.left, bottom: c.bottom, width: c.size, height: c.size, backgroundColor: c.color, boxShadow: `0 0 ${c.size * 3}px ${c.size}px ${c.color}`, animation: `float-glow ${c.duration} ease-in-out infinite alternate, pulseBreath 2s ease-in-out infinite alternate`, animationDelay: c.delay }} />
      ))}
    </div>
  );
};

// 3. Hiệu ứng Giao diện Biển: Màn nước sóng sánh nhòe 3D
const WaterDistortionOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[1] mix-blend-overlay" style={{ animation: 'water-wave 8s ease-in-out infinite alternate', background: 'linear-gradient(180deg, rgba(34,211,238,0.03) 0%, rgba(30,58,138,0.03) 100%)' }} />
);

// 4. Hiệu ứng Chung: Bọt khí phụt từ con trỏ chuột
const ClickBubbleBurst = () => {
  const [bursts, setBursts] = useState<Array<{ id: number, x: number, y: number }>>([]);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setBursts(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 900);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {bursts.map(b => (
        <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const size = Math.random() * 8 + 4; const angle = (i * 60 * Math.PI) / 180; const distance = Math.random() * 35 + 15;
            const tx = Math.cos(angle) * distance; const ty = Math.sin(angle) * distance - 40;
            return (
              <div key={i} className="absolute rounded-full bg-white/20 border border-white/60" style={{ width: size, height: size, transform: 'translate(-50%, -50%)', animation: 'bubble-burst-action 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards', style: { '--tx': `${tx}px`, '--ty': `${ty}px` } as any }} />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// 5. Hiệu ứng Chung: "Bão Bong Bóng Ăn Mừng"
const SuccessBubbleBlast: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const [particles, setParticles] = useState<Array<{ id: number, left: string, size: number, delay: string, duration: string }>>([]);
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 75 }).map((_, i) => ({
        id: Date.now() + i, left: `${15 + Math.random() * 70}%`, size: Math.random() * 22 + 8, delay: `${Math.random() * 0.8}s`, duration: `${1.5 + Math.random() * 2}s`
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 3500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);
  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute bottom-[-50px] rounded-full bg-cyan-200/20 border-2 border-white/60 backdrop-blur-[0.5px]" style={{ left: p.left, width: p.size, height: p.size, animation: `rise ${p.duration} cubic-bezier(0.2, 0.6, 0.4, 1) forwards`, animationDelay: p.delay, boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5), 0 0 15px rgba(34,211,238,0.3)' }} />
      ))}
    </div>
  );
};

// 6. ĐÀN CÁ CŨ NÂNG CẤP
const InteractiveSwimmingFish = () => {
  const [fishes, setFishes] = useState(() => 
    Array.from({ length: 7 }).map((_, i) => ({
      id: i, top: `${20 + Math.random() * 55}%`,
      size: i % 3 === 0 ? Math.random() * 20 + 65 : Math.random() * 10 + 40,
      duration: `${16 + Math.random() * 10}s`, delay: `${Math.random() * 6}s`,
      direction: Math.random() > 0.5 ? 'swimLTR' : 'swimRTL', isScared: false, 
    }))
  );
  const handleFishClick = (id: number) => {
    setFishes(prev => prev.map(f => f.id === id ? { ...f, isScared: true } : f));
    setTimeout(() => { setFishes(prev => prev.map(f => f.id === id ? { ...f, isScared: false } : f)); }, 2000);
  };
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {fishes.map(f => (
        <div key={f.id} onClick={() => handleFishClick(f.id)} className={`absolute cursor-pointer pointer-events-auto select-none transition-all duration-300 ${f.isScared ? 'animate-[fishWiggle_0.1s_infinite]' : 'animate-[fishWiggle_0.6s_ease-in-out_infinite]'}`} style={{ top: f.top, width: f.size, height: f.size / 2, animationName: f.direction, animationDuration: f.isScared ? `${parseFloat(f.duration) / 4}s` : f.duration, animationDelay: f.isScared ? '0s' : f.delay, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }}>
          <svg viewBox="0 0 100 50" fill="currentColor" style={{ transform: f.direction === 'swimLTR' ? 'scaleX(-1)' : 'none' }} className="w-full h-full text-cyan-500 drop-shadow-[0_4px_12px_rgba(6,182,212,0.4)]">
            <path d="M10,25 C30,10 70,10 90,25 C70,40 30,40 10,25 M90,25 L100,15 L95,25 L100,35 Z" /><circle cx="30" cy="22" r="3" fill="rgba(0,0,0,0.5)" />
          </svg>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'ocean' | 'tet'>(() => {
    const saved = localStorage.getItem('theme_preference');
    return (saved === 'tet' || saved === 'ocean') ? saved : 'ocean';
  });

  const toggleTheme = () => { setTheme(prev => prev === 'ocean' ? 'tet' : 'ocean'); };

  useEffect(() => {
    localStorage.setItem('theme_preference', theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const [activePlatform, setActivePlatform] = useState<Platform>('shopee');
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<ProcessingState>({ status: 'idle', message: '' });
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCelebrationBubbles, setShowCelebrationBubbles] = useState(false);

  const [productList, setProductList] = useState<string[]>([]);
  const [randomProduct, setRandomProduct] = useState<string>('');
  const [notices, setNotices] = useState<NoticeItem[]>(DEFAULT_NOTICES);

  // STATE DÀNH CHO MỤC GÓP Ý
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fbName, setFbName] = useState('');
  const [fbContent, setFbContent] = useState('');

  // Đọc danh sách sản phẩm mẫu cố định
  useEffect(() => {
    const loadDefaultProducts = async () => {
      try {
        const response = await fetch('/products.xlsx');
        if (!response.ok) return;
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let foundProductNames: string[] = [];
        if (jsonData.length > 0) {
          let productColIndex = -1;
          for (let r = 0; r < Math.min(jsonData.length, 5); r++) {
            const row = jsonData[r];
            if (Array.isArray(row)) {
              productColIndex = row.findIndex(cell => 
                typeof cell === 'string' && 
                (cell.toLowerCase().includes('tên sản phẩm') || cell.toLowerCase().includes('product name') || cell.toLowerCase().includes('tên mặt hàng'))
              );
              if (productColIndex !== -1) {
                for (let i = r + 1; i < jsonData.length; i++) {
                  const pName = jsonData[i]?.[productColIndex];
                  if (pName && typeof pName === 'string' && pName.trim() !== '') {
                    foundProductNames.push(pName.trim());
                  }
                }
                break;
              }
            }
          }
        }
        if (foundProductNames.length > 0) {
          setProductList(Array.from(new Set(foundProductNames)));
        }
      } catch (err) { console.error("Lỗi đọc file Excel:", err); }
    };
    loadDefaultProducts();
  }, []);

  // Tự động đọc file note thông báo
  useEffect(() => {
    const loadNoticesFromTxt = async () => {
      try {
        const response = await fetch('/notices.txt');
        if (!response.ok) return;
        const textData = await response.text();
        const lines = textData.split('\n');
        const parsedNotices: NoticeItem[] = [];
        
        lines.forEach((line, index) => {
          if (line.trim() === '' || !line.includes('|')) return;
          const parts = line.split('|');
          if (parts.length >= 2) {
            parsedNotices.push({
              id: index,
              date: parts[0]?.trim() || "00/00",
              title: parts[1]?.trim() || "Thông báo",
              desc: parts[2]?.trim() || ""
            });
          }
        });

        if (parsedNotices.length > 0) {
          setNotices(parsedNotices);
        }
      } catch (err) { console.error("Sử dụng dữ liệu thông báo mặc định."); }
    };
    loadNoticesFromTxt();
  }, []);

  // Đọc lịch sử xử lý file và danh sách góp ý từ LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error('Failed to parse history', e); }
    }
    
    const savedFeedbacks = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (savedFeedbacks) {
      try { setFeedbacks(JSON.parse(savedFeedbacks)); } catch (e) { console.error('Failed to parse feedbacks', e); }
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacks)); }, [feedbacks]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
  };

  // LOGIC XỬ LÝ KHI NGƯỜI DÙNG BẤM GỬI GÓP Ý
  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbContent.trim()) return;

    const newFeedback: FeedbackItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: fbName.trim(),
      content: fbContent.trim(),
      timestamp: Date.now()
    };

    setFeedbacks(prev => [newFeedback, ...prev]);
    setFbContent(''); // Gửi xong xóa trắng ô nội dung, giữ lại tên cho tiện lần sau
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(event.target.value ? event.target.files || [] : []);
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
    if (files.length <= 1) { setProcessedFileUrl(null); setState({ status: 'idle', message: '' }); }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setState({ status: 'processing', message: `Đang xử lý đơn ${activePlatform.toUpperCase()}...` });
    setShowCelebrationBubbles(false);
    try {
      const blob = await processExcelFiles(files, activePlatform);
      const url = URL.createObjectURL(blob);
      setProcessedFileUrl(url);
      setState({ status: 'success', message: `Gộp đơn ${activePlatform.toUpperCase()} thành công!` });
      setShowCelebrationBubbles(true);
      
      addToHistory({ 
        type: 'download', filename: `Kết Quả_${activePlatform.toUpperCase()}_${new Date().getTime()}.xlsx`, 
        count: files.length, platform: activePlatform
      });
    } catch (error: any) {
      setState({ status: 'error', message: error.message || 'Lỗi xử lý file.' });
    }
  };

  const handlePickRandomProduct = () => {
    if (productList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * productList.length);
    setRandomProduct(productList[randomIndex]);
    if (typeof (window as any).confetti === 'function') {
      (window as any).confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: isOcean ? ['#22d3ee', '#34d399'] : ['#fde047', '#ff0000'] });
    }
  };

  const reset = () => { setFiles([]); setState({ status: 'idle', message: '' }); setProcessedFileUrl(null); setShowCelebrationBubbles(false); };
  const clearHistory = () => { if (confirm('Xóa toàn bộ lịch sử?')) setHistory([]); };

  const isOcean = theme === 'ocean';

  return (
    <div className="w-full relative">
      
      {/* ====================================================================
          BẢNG THÔNG BÁO QUAN TRỌNG: TUYỆT ĐỐI KHÍT VIỀN TRÊN, LĂN CHUỘT LÀ CUỐN MẤT
          ==================================================================== */}
      {notices.length > 0 && (
        <div className="absolute top-0 right-0 z-[999] hidden md:block animate-slide-up">
          <div className={`pb-5 px-5 pt-0 rounded-bl-3xl border-b-2 border-l-2 border-t-0 transition-all duration-500 shadow-2xl w-[320px] lg:w-[355px] space-y-4 ${
            isOcean ? 'bg-slate-950 border-cyan-500/40 shadow-cyan-950/60 text-cyan-100' : 'bg-white border-yellow-300 shadow-yellow-100/50 text-amber-900'
          }`}>
            
            <div className={`flex items-center gap-2 border-b pb-3 pt-3.5 -mx-5 px-5 rounded-tl-none ${isOcean ? 'border-cyan-500/30 bg-slate-900' : 'border-yellow-200 bg-yellow-50/60'}`}>
              <span className={`text-sm ${isOcean ? 'text-cyan-404 animate-pulse' : 'text-red-500'}`}>{isOcean ? '📟' : '📢'}</span>
              <h2 className={`text-xs font-black font-tet-title tracking-wider uppercase ${isOcean ? 'text-cyan-300' : 'text-yellow-805'}`}>
                Thông báo quan trọng
              </h2>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {notices.map(notice => (
                <div 
                  key={notice.id} 
                  className={`p-3 rounded-xl border flex gap-3 hover:scale-[1.02] transition-transform ${
                    isOcean ? 'bg-slate-900/60 border-cyan-500/10 hover:border-cyan-500/30' : 'bg-gradient-to-r from-red-50/50 to-white border-red-100 hover:border-red-300'
                  }`}
                >
                  <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs border ${
                    isOcean ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 text-white'
                  }`}>
                    {notice.date}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-black truncate ${isOcean ? 'text-cyan-100' : 'text-red-950'}`}>{notice.title}</p>
                    <p className="text-[11px] opacity-85 leading-normal mt-1 line-clamp-3 text-justify pr-1">{notice.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Layout theme={theme} toggleTheme={toggleTheme}>
        <div className="px-4 py-6 pt-10">
          <ClickBubbleBurst />
          <SuccessBubbleBlast trigger={showCelebrationBubbles} />

          {isOcean ? (
            <>
              <RisingBubbles />
              <InteractiveSwimmingFish />
              <BioluminescenceSpores />
              <WaterDistortionOverlay />
            </>
          ) : (
            <>
              <BioluminescentFlowersTet />
            </>
          )}
          
          <Couplet text="Đơn thưa, lòng không nản" position="left" theme={theme} />
          <Couplet text="Chí vững, lộc ắt về" position="right" theme={theme} />
          
          {/* Absolute floating decorations */}
          {isOcean ? (
            <>
              <div className="fixed top-24 left-10 w-24 h-28 opacity-45 pointer-events-none hidden lg:block animate-float z-0" style={{ animationDelay: '0.5s' }}>
                <JellyfishSVG className="w-full h-full" />
              </div>
              <div className="fixed bottom-12 right-20 w-28 h-32 opacity-35 pointer-events-none hidden lg:block z-0 animate-float" style={{ animationDelay: '2.5s' }}>
                <JellyfishSVG className="w-full h-full" />
              </div>
              <div className="fixed bottom-10 left-12 w-20 h-20 opacity-30 pointer-events-none hidden lg:block z-0 animate-sway">
                <StarfishSVG className="w-full h-full" />
              </div>
            </>
          ) : (
            <>
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
          </>
          )}

          {/* KHU VỰC TRUNG TÂM */}
          <div className="flex flex-col gap-10 relative z-10 max-w-6xl mx-auto">
            <div className="text-center space-y-2 flex flex-col items-center">
              <button 
                onClick={toggleTheme}
                className={`mb-4 px-5 py-2 rounded-full font-bold text-xs tracking-wider uppercase transition-all border shadow-md hover:scale-105 active:scale-95 ${
                  isOcean ? 'bg-slate-900 text-cyan-300 border-cyan-500/30' : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                }`}
              >
                {isOcean ? '☀️ CHUYỂN SANG CHẾ ĐỘ TẾT' : '🌊 CHUYỂN SANG CHẾ ĐỘ BIỂN'}
              </button>

              <div className={`inline-flex items-center gap-2 px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border shadow-lg transition-all duration-500 ${isOcean ? 'bg-slate-900/60 text-cyan-200 border-cyan-500/40 shadow-cyan-950/40' : 'bg-gradient-to-r from-yellow-105 via-yellow-100 to-amber-100 text-yellow-805 border-yellow-355 shadow-yellow-200/50'}`}>
                {isOcean ? ( <> <span className="text-cyan-400 animate-pulse">🫧</span> Phiên Bản ĐÁY BIỂN <span className="text-cyan-400 animate-pulse">🫧</span> </> ) : ( <> <span className="text-yellow-600 animate-pulse">✨</span> Phiên Bản CÓ ĐƠN <span className="text-yellow-600 animate-pulse">✨</span> </> )}
              </div>
              <h1 className={`text-5xl md:text-7xl font-black tracking-tight leading-none font-tet-title mt-4 text-transparent bg-clip-text bg-gradient-to-br animate-shimmer drop-shadow-lg transition-all duration-500 ${isOcean ? 'from-cyan-300 via-sky-100 to-teal-400' : 'from-yellow-500 via-yellow-300 to-amber-600'}`} style={{textShadow: isOcean ? '0 4px 20px rgba(6, 182, 212, 0.4)' : '0 4px 20px rgba(251, 191, 36, 0.4)'}}>LÊN ĐƠN THÔI</h1>
            </div>

            {/* Platform Tabs */}
            <div className="flex justify-center">
              <div className={`p-2 rounded-2xl flex gap-2 border transition-all duration-500 relative overflow-hidden ${isOcean ? 'bg-slate-900/60 backdrop-blur-md border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] shadow-[inset_0_2px_8px_rgba(6,182,212,0.1)]' : 'bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-300 shadow-inner'}`}>
                {isOcean && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" style={{ animation: 'scan-neon 3s linear infinite' }}></div>}
                <button onClick={() => { setActivePlatform('shopee'); reset(); }} className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white border-orange-400 shadow-lg shadow-orange-500/35 scale-105' : (isOcean ? 'bg-slate-950/60 text-cyan-200 border-transparent hover:bg-slate-900 hover:border-cyan-500/30 hover:text-cyan-100' : 'bg-white text-orange-850 border-transparent hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600')}`}>SHOPEE</button>
                <button onClick={() => { setActivePlatform('tiktok'); reset(); }} className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'tiktok' ? (isOcean ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white border-cyan-455 shadow-lg shadow-cyan-500/35 scale-105' : 'bg-gradient-to-r from-slate-900 to-black text-white border-slate-700 shadow-lg shadow-slate-400/50 scale-105') : (isOcean ? 'bg-slate-950/60 text-cyan-200 border-transparent hover:bg-slate-900 hover:border-cyan-500/30 hover:text-cyan-100' : 'bg-white text-slate-800 border-transparent hover:bg-slate-50 hover:border-slate-200 hover:text-black')}`}>TIKTOK</button>
              </div>
            </div>

            {/* BỐ CỤC ĐƠN HÀNG TRUNG TÂM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              
              {/* CỘT TRÁI (4 CỘT): HISTORY CARD */}
              <div className="lg:col-span-4 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className={`p-7 rounded-3xl border-2 transition-all duration-500 shadow-2xl hover:-translate-y-1 space-y-4 ${isOcean ? 'bg-slate-950/50 border-cyan-500/20 shadow-cyan-950/40 text-cyan-100' : 'bg-white border-yellow-200 shadow-yellow-100/50 text-amber-900'}`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${isOcean ? 'border-cyan-500/30' : 'border-yellow-200'}`}>
                    <h2 className={`text-lg font-bold font-tet-title ${isOcean ? 'text-cyan-300' : 'text-yellow-805'}`}>Nhật ký</h2>
                    {history.length > 0 && <button onClick={clearHistory} className={`text-xs font-black uppercase tracking-wider ${isOcean ? 'text-cyan-404 hover:text-cyan-200' : 'text-yellow-600 hover:text-red-500'}`}>Xóa</button>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <div className="text-center py-8"><span className="text-4xl opacity-30 animate-pulse">{isOcean ? '🫧' : '✨'}</span><p className={`text-xs mt-2 font-medium ${isOcean ? 'text-cyan-404' : 'text-yellow-600'}`}>Chưa có lịch sử</p></div>
                    ) : (
                      history.map(item => (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border hover:border-cyan-400/60 shadow-md transition-all ${isOcean ? 'bg-gradient-to-r from-slate-900/50 to-slate-800/40 border-cyan-500/20 text-cyan-100' : 'bg-gradient-to-r from-yellow-50 to-white border-yellow-150 text-amber-900'}`}>
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${item.platform === 'shopee' ? 'bg-gradient-to-br from-orange-100 to-orange-250 text-orange-700 border-orange-300' : (isOcean ? 'bg-gradient-to-br from-cyan-900 to-cyan-750 text-white border-cyan-600' : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-600')}`}>{item.platform === 'shopee' ? 'S' : 'T'}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate text-sm ${isOcean ? 'text-cyan-200' : 'text-amber-955'}`}>{item.filename}</p>
                            <div className={`flex justify-between items-center mt-1 text-xs font-medium ${isOcean ? 'text-cyan-404' : 'text-yellow-655'}`}><span>{item.type === 'upload' ? 'Tải lên' : 'Kết quả'}</span><span>{new Date(item.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (8 CỘT): KHU VỰC THẢ FILE & "HÔM NAY BÁN GÌ?" */}
              <div className="lg:col-span-8 space-y-6 order-1 lg:order-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className={`p-2 rounded-[2.5rem] border-4 shadow-2xl overflow-hidden relative transition-all duration-500 ${isOcean ? 'bg-slate-950/50 border-cyan-500/30 shadow-cyan-950/30' : 'bg-white border-yellow-300 shadow-yellow-100/50'}`}>
                  <div className="p-8 relative z-10">
                    {files.length < MAX_FILES && !processedFileUrl && (
                      <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 group relative overflow-hidden ${activePlatform === 'shopee' ? 'border-orange-500/40 bg-orange-950/15 hover:bg-orange-950/25 hover:border-orange-400' : (isOcean ? 'border-cyan-500/40 bg-cyan-950/15 hover:bg-cyan-950/25 hover:border-cyan-400' : 'border-yellow-405 bg-yellow-50/30 hover:bg-yellow-50/60 hover:border-yellow-500')}`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300 shadow-xl ${activePlatform === 'shopee' ? 'bg-gradient-to-br from-slate-900/80 to-orange-950/50 text-orange-400 shadow-orange-900/40' : (isOcean ? 'bg-gradient-to-br from-slate-900/80 to-cyan-950/50 text-cyan-400 shadow-cyan-900/40' : 'bg-gradient-to-br from-yellow-104 via-yellow-200 to-amber-305 text-yellow-600 shadow-yellow-200/40')}`}>
                           {activePlatform === 'shopee' ? <BubbleSVG className="w-12 h-12" /> : <svg className="w-10 h-10 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        </div>
                        <p className={`text-2xl font-black text-center font-tet-title group-hover:scale-105 transition-transform ${isOcean ? 'text-cyan-100' : 'text-amber-955'}`}>Thả file {activePlatform === 'shopee' ? 'Shopee' : 'Tiktok'} vào đây</p>
                        <p className={`mt-2 font-medium ${isOcean ? 'text-cyan-404' : 'text-yellow-655'}`}>hoặc nhấn để chọn file</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                      </div>
                    )}

                    {/* LIST FILE */}
                    {files.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <div className={`flex items-center justify-between border-b pb-2 ${isOcean ? 'border-cyan-500/30' : 'border-yellow-250'}`}>
                          <h3 className={`text-xs font-black uppercase tracking-widest ${isOcean ? 'text-cyan-300' : 'text-yellow-600'}`}>Danh sách ({files.length})</h3>
                          {!processedFileUrl && <button onClick={reset} className="text-xs text-rose-450 font-bold hover:bg-rose-950/30 px-3 py-1 rounded-full transition-colors">Hủy bỏ</button>}
                        </div>
                        {files.map((f, index) => (
                          <div key={index} className={`flex items-center justify-between p-4 rounded-xl border group transition-colors animate-fade-in ${isOcean ? 'bg-cyan-950/40 border-cyan-500/20 hover:border-cyan-400' : 'bg-yellow-50/40 border-yellow-250 hover:border-amber-400'}`}>
                            <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-lg shadow-sm border ${isOcean ? 'bg-slate-900 text-cyan-400 border-cyan-500/20' : 'bg-white text-yellow-655 border-yellow-250'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                               <span className={`text-sm font-bold truncate max-w-[200px] ${isOcean ? 'text-cyan-100' : 'text-amber-955'}`}>{f.name}</span>
                            </div>
                            {!processedFileUrl && <button onClick={() => removeFile(index)} className="text-rose-400 hover:text-rose-300 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ô QUAY SỐ SẢN PHẨM NGẪU NHIÊN CÓ SẴN (products.xlsx) */}
                    {productList.length > 0 && !processedFileUrl && (
                      <div className={`p-5 mb-8 rounded-2xl border-2 transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${isOcean ? 'bg-slate-900/60 border-cyan-500/20 text-cyan-100' : 'bg-amber-50/60 border-yellow-300 text-amber-900'}`}>
                        <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                          <p className={`text-xs font-mono font-bold uppercase tracking-widest ${isOcean ? 'text-cyan-404' : 'text-amber-600'}`}>🎲 Gợi ý mặt hàng hôm nay ({productList.length}):</p>
                          <div className={`text-sm font-bold mt-1.5 truncate p-3 rounded-xl border border-dashed min-h-[48px] flex items-center justify-center sm:justify-start ${randomProduct ? (isOcean ? 'bg-cyan-950/40 border-cyan-500/30 text-white' : 'bg-white border-yellow-400 text-red-700') : 'opacity-40 italic text-xs'}`}>{randomProduct || "Đang chờ quay số..."}</div>
                        </div>
                        <button onClick={handlePickRandomProduct} className={`px-5 py-3 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-2 flex-shrink-0 shadow-md border hover:scale-105 active:scale-95 ${isOcean ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 hover:shadow-[0_0_15px_#22d3ee]' : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border-yellow-300'}`}>Hôm nay bán gì?</button>
                      </div>
                    )}

                    {/* CONTROLS BUTTONS */}
                    <div className="flex flex-col gap-4">
                      {state.status === 'idle' && files.length > 0 && (
                        <button onClick={handleProcess} className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden group ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-orange-500/30' : (isOcean ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-cyan-500/30' : 'bg-gradient-to-r from-yellow-500 via-amber-555 to-red-600 text-white shadow-yellow-250/50')}`}><span className="relative z-10 flex items-center gap-2">XỬ LÝ ĐƠN NGAY</span><div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div></button>
                      )}
                      {state.status === 'processing' && <div className={`flex flex-col items-center justify-center py-12 gap-5 rounded-3xl border-2 shadow-inner transition-all duration-500 ${isOcean ? 'bg-gradient-to-br from-cyan-950/60 to-blue-950/60 border-cyan-500/30' : 'bg-gradient-to-br from-yellow-50 to-amber-100/60 border-yellow-335'}`}><div className="relative"><div className={`absolute inset-0 blur-2xl opacity-30 rounded-full animate-pulse ${isOcean ? 'bg-cyan-400' : 'bg-yellow-500'}`}></div><BubbleSVG className="w-16 h-16 animate-bounce text-cyan-400 relative z-10" /></div><p className="font-bold uppercase tracking-widest text-sm animate-pulse">{state.message}</p></div>}
                      {state.status === 'success' && processedFileUrl && (
                        <div className="space-y-5 animate-slide-up">
                          <div className={`border p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden shadow-sm transition-all duration-500 ${isOcean ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/40' : 'bg-gradient-to-r from-emerald-50 to-teal-100/50 border-emerald-300'}`}><div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white p-3 rounded-full shadow-lg z-10 animate-bounce-slow"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div><div><p className="font-black text-lg">Hoàn tất xuất sắc!</p><p className="text-sm opacity-80">{state.message}</p></div></div>
                          
                          {/* ĐỔI TÊN FILE DOWNLOAD ĐẦU RA TIẾNG VIỆT ĐÚNG CẤU TRÚC YÊU CẦU */}
                          <a href={processedFileUrl} download={`Kết Quả_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className={`flex items-center justify-center gap-4 w-full py-6 rounded-2xl font-black text-xl shadow-xl transition-all border-2 ${isOcean ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300/40 shadow-cyan-550/30' : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-red-600 text-white border-yellow-300/40 shadow-yellow-250/30'}`}>TẢI FILE KẾT QUẢ</a>
                          <button onClick={reset} className="w-full font-bold uppercase tracking-widest text-xs py-2 opacity-65 hover:opacity-100">Làm lượt mới</button>
                        </div>
                      )}
                      {state.status === 'error' && <div className={`border p-6 rounded-2xl flex items-center gap-5 animate-shake shadow-sm ${isOcean ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>{state.message}</div>}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ====================================================================
                MỤC MỚI NÂNG CẤP: KHU VỰC GÓP Ý NẰM Ở DƯỚI CÙNG TRANG WEB ĐÚNG YÊU CẦU
                ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full pt-6 mt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              
              {/* KHUNG NHẬP GÓP Ý (CHIẾM 5 CỘT BÊN TRÁI) */}
              <div className="lg:col-span-5">
                <form onSubmit={handleSendFeedback} className={`p-6 rounded-3xl border-2 shadow-xl space-y-4 transition-all duration-500 ${
                  isOcean ? 'bg-slate-950/40 border-cyan-500/30 text-cyan-100 shadow-cyan-950/20' : 'bg-white border-yellow-300 shadow-yellow-100/40 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 border-b pb-2.5">
                    <span className="text-lg">✍️</span>
                    <h3 className={`text-base font-black font-tet-title tracking-wider uppercase ${isOcean ? 'text-cyan-300' : 'text-yellow-805'}`}>
                      Gửi góp ý của bạn
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {/* Ô NHẬP TÊN BÊN TRÊN */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${isOcean ? 'text-cyan-404' : 'text-yellow-700'}`}>Tên của bạn:</label>
                      <input 
                        type="text" 
                        required
                        value={fbName}
                        onChange={(e) => setFbName(e.target.value)}
                        placeholder="Nhập tên..." 
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition-all outline-none ${
                          isOcean ? 'bg-slate-900/80 border-cyan-500/20 text-white placeholder-cyan-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400' : 'bg-amber-50/40 border-yellow-250 text-amber-950 placeholder-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        }`}
                      />
                    </div>

                    {/* Ô NHẬP NỘI DUNG GÓP Ý BÊN DƯỚI */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${isOcean ? 'text-cyan-404' : 'text-yellow-700'}`}>Nội dung góp ý:</label>
                      <textarea 
                        required
                        rows={3}
                        value={fbContent}
                        onChange={(e) => setFbContent(e.target.value)}
                        placeholder="Bạn muốn hệ thống cải tiến thêm tính năng gì?..." 
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-none ${
                          isOcean ? 'bg-slate-900/80 border-cyan-500/20 text-white placeholder-cyan-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400' : 'bg-amber-50/40 border-yellow-250 text-amber-950 placeholder-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        }`}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className={`w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-md transform hover:scale-[1.02] active:scale-[0.98] ${
                        isOcean ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400 hover:shadow-cyan-500/20' : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border border-yellow-300 font-black'
                      }`}
                    >
                      GỬI Ý KIẾN NGAY
                    </button>
                  </div>
                </form>
              </div>

              {/* BẢNG HIỂN THỊ CÁC BÀI GÓP Ý ĐÃ GỬI (CHIẾM 7 CỘT BÊN PHẢI) */}
              <div className="lg:col-span-7">
                <div className={`p-6 rounded-3xl border-2 shadow-xl flex flex-col transition-all duration-500 h-[308px] ${
                  isOcean ? 'bg-slate-950/40 border-cyan-500/20 text-cyan-100' : 'bg-white border-yellow-200 shadow-yellow-100/30'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2.5 mb-4">
                    <h3 className={`text-base font-black font-tet-title tracking-wider uppercase ${isOcean ? 'text-cyan-300' : 'text-yellow-805'}`}>
                      Hòm thư góp ý hiển thị ({feedbacks.length})
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                    {feedbacks.length === 0 ? (
                      <div className="text-center py-14 opacity-50 italic text-sm">
                        Chưa có bài góp ý nào. Hãy là người đầu tiên để lại ý kiến nhé!
                      </div>
                    ) : (
                      feedbacks.map((fb) => (
                        <div 
                          key={fb.id} 
                          className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.01] ${
                            isOcean ? 'bg-slate-900/60 border-cyan-500/10 text-cyan-100 shadow-sm' : 'bg-gradient-to-r from-amber-50/30 to-white border-yellow-100 text-amber-950 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-center border-b border-dashed pb-1.5 mb-2 opacity-90">
                            <span className={`text-xs font-black tracking-wide ${isOcean ? 'text-cyan-300' : 'text-red-700'}`}>
                              👤 {fb.name}
                            </span>
                            <span className="text-[10px] font-mono opacity-60">
                              {new Date(fb.timestamp).toLocaleDateString('vi-VN')} {new Date(fb.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-justify whitespace-pre-wrap pl-1 font-medium">{fb.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </Layout>

      <style>{`
        /* TRIỆU TIÊU KHỐI MENU THANH ĐEN TRÊN CÙNG THEO YÊU CẦU CŨ */
        nav, header, [class*="Navbar"], [class*="Header"], .navbar-container {
          display: none !important;
          height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        body, #root, .app-container, main {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        /* Thanh cuộn nhỏ tinh gọn */
        .custom-scrollbar::-webkit-scrollbar{width:4px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#22d3ee;border-radius:10px;}
        
        .animate-spin-slow { animation: spin 12s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-sway { animation: sway 3s ease-in-out infinite alternate; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-shimmer { background-size: 200% auto; animation: shimmer 3s linear infinite; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
        @keyframes sway { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fishWiggle { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-3px) rotate(3deg); } }
        @keyframes water-wave { 0% { filter: hue-rotate(0deg) contrast(1); } 100% { filter: hue-rotate(8deg) contrast(1.03); } }
        @keyframes bubble-burst-action { 0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; } 100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.2); opacity: 0; } }
        @keyframes float-glow { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(-50px) translateX(20px); } }
        @keyframes pulseBreath { 0% { opacity: 0.3; filter: brightness(0.8); } 100% { opacity: 0.9; filter: brightness(1.3); } }
        @keyframes scan-neon { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes swimLTR { 0% { left: -150px; } 100% { left: 100%; } }
        @keyframes swimRTL { 0% { right: -150px; } 100% { right: 100%; } }
        @keyframes rise { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 15% { opacity: 0.9; } 100% { transform: translateY(-115vh) scale(1.3); opacity: 0; } }
        @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; } 10% { opacity: 0.8; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </div>
  );
};

export default App;
