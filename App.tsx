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

// ==========================================
// ĐỊA CHỈ VÀ MÃ KHÓA SUPABASE ĐƯỢC ĐỒNG BỘ CHUẨN TRÊN MỘT DÒNG DUY NHẤT
// ==========================================
const SUPABASE_URL = "https://pfwcfbsobsitfocjcfxg.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2NmaHNvYnNqdGZwY2pjZnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTI2MjcsImV4cCI6MjA5NjU2ODYyN30.aYskBWpE7ZxwoujAjEMfbUN1X1EQP1DK9QuhjW1zIyQ";

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

// Bộ kết nối REST API Fetch độc lập cho Supabase không dùng npm ngoài
const sFetchGet = async () => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/feedbacks?select=*&order=timestamp.desc`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) { return []; }
};

const sFetchPost = async (payload: any) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/feedbacks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) { return false; }
};

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
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fbName, setFbName] = useState('');
  const [fbContent, setFbContent] = useState('');

  const refreshFeedbacks = async () => {
    const data = await sFetchGet();
    if (data && data.length > 0) setFeedbacks(data);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error('Failed to parse history', e); }
    }
    refreshFeedbacks();
    const interval = setInterval(refreshFeedbacks, 12000);
    return () => clearInterval(interval);
  }, []);

  // Đọc danh sách sản phẩm mẫu cố định từ file excel gốc của bạn
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
      
      // ĐỔI TÊN FILE ĐẦU RA TIẾNG VIỆT CHUẨN ĐÚNG YÊU CẦU CỦA BẠN
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
            isOcean ? 'bg-slate-950 border-cyan-500/40 shadow-cyan-950/60 text-cyan-100 backdrop-blur-md' : 'bg-white border-yellow-300 shadow-yellow-100/50 text-amber-900'
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
                    isOcean ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
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

      {/* GIỮ NGUYÊN COMPONENT LAYOUT GỐC CỦA BẠN ĐỂ HIỂN THỊ CHÂN TRANG FOOTER */}
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
                {isOcean ? ( <> <span className="text-cyan-400 animate-pulse">🫧</span> Phiên Bản ĐÁY BIỂN <span className="text-cyan-400 animate-pulse">🫧</span> </> ) : ( <> <span className="text-yellow-600 animate-pulse">✨</span> Phiên Bản CÓ ĐƠN <span className="text-yellow-600 animate-pulse">✨
