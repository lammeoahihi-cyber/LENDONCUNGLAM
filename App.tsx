import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

// ==========================================
// CẤU HÌNH KIỂU DỮ LIỆU TOÀN CỤC TRONG FILE
// ==========================================
type Platform = 'shopee' | 'tiktok';
interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
}
interface HistoryItem {
  id: string;
  type: 'upload' | 'download';
  filename: string;
  timestamp: number;
  platform: Platform;
}
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

const MAX_FILES = 5;
const STORAGE_KEY = 'len_don_cung_lam_history_v2';

// ==========================================
// ĐÃ ĐỒNG BỘ CHUẨN ĐƯỜNG THẲNG API KEY SUPABASE CỦA BẠN
// ==========================================
const SUPABASE_URL = "https://pfwcfbsobsitfocjcfxg.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwY3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2NmYnNvYnNpdGZvY2pjZnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI5MjczeTksImV4cCI6MjA0ODUwMzM5fQ.aYskbWpE7ZxwoujAjEMfbUN1X1EQP1DK9QuhjW1zIyQ";

// Bộ kết nối REST API Fetch độc lập cho Supabase
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

const DEFAULT_NOTICES: NoticeItem[] = [
  { id: 1, date: "25/05", title: "Gom đơn Shopee Sale", desc: "Chốt danh sách và gộp file đối soát đợt 1." },
  { id: 2, date: "28/05", title: "Thanh toán công nợ", desc: "Kiểm tra ví và thanh toán cho bên nhà cung cấp." },
  { id: 3, date: "01/06", title: "Nhập kho hàng hè mới", desc: "Kiểm đếm số lượng áo thun và váy hoa nhí vừa về." },
];

// ==========================================
// TÍCH HỢP TOÀN BỘ LINH HỒN ĐỒ HỌA ĐÁY BIỂN & CÁC ICON TRANG TRÍ NỘI BỘ
// ==========================================
const Sparkle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
);

const BubbleSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" fill="rgba(255,255,255,0.1)" />
    <circle cx="35" cy="35" r="10" fill="rgba(255,255,255,0.4)" />
  </svg>
);

const StarfishSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6h6.4l-5 4 2 6-6-4-6 4 2-6-5-4h6.4z" /></svg>
);

const JellyfishSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor">
    <path d="M20,50 C20,20 80,20 80,50 C80,55 20,55 20,50 Z" />
    <path d="M30,50 Q35,80 32,95 M42,50 Q45,75 48,95 M58,50 Q55,75 52,95 M70,50 Q65,80 68,95" stroke="currentColor" strokeWidth="3" fill="none" />
  </svg>
);

const RisingBubbles = () => {
  const items = Array.from({ length: 15 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, size: Math.random() * 15 + 5, delay: `${Math.random() * 4}s`, duration: `${6 + Math.random() * 4}s`
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map(b => (
        <div key={b.id} className="absolute bottom-[-20px] rounded-full bg-cyan-400/10 border border-cyan-300/30 animate-[rise_10s_infinite_linear]" style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay, animationDuration: b.duration }} />
      ))}
    </div>
  );
};

const Couplet = ({ text, position, theme }: { text: string; position: 'left' | 'right'; theme: string }) => (
  <div className={`fixed top-1/4 ${position === 'left' ? 'left-4' : 'right-4'} z-20 hidden xl:block w-12 p-3 text-center font-black rounded-full border-2 border-dashed ${theme === 'ocean' ? 'bg-slate-950/40 border-cyan-500/30 text-cyan-200' : 'bg-white border-yellow-400 text-amber-900'}`}>
    {text.split('').map((char, i) => <div key={i} className="my-1 text-base">{char}</div>)}
  </div>
);

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

const WaterDistortionOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[1] mix-blend-overlay" style={{ animation: 'water-wave 8s ease-in-out infinite alternate', background: 'linear-gradient(180deg, rgba(34,211,238,0.03) 0%, rgba(30,58,138,0.03) 100%)' }} />
);

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
          <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,15 C60,0 80,15 70,35 C85,25 100,45 80,60 C90,80 65,95 50,75 C35,95 10,80 20,60 C0,45 15,25 30,35 C20,15 40,0 50,15 Z" fill={f.color}/><circle cx="50" cy="48" r="12" fill={f.centerColor}/></svg>
        </div>
      ))}
    </div>
  );
};

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

const InteractiveSwimmingFish = () => {
  const [fishes, setFishes] = useState(() => 
    Array.from({ length: 7 }).map((_, i) => ({
      id: i, top: `${20 + Math.random() * 55}%`, size: i % 3 === 0 ? Math.random() * 20 + 65 : Math.random() * 10 + 40, duration: `${16 + Math.random() * 10}s`, delay: `${Math.random() * 6}s`, direction: Math.random() > 0.5 ? 'swimLTR' : 'swimRTL', isScared: false, 
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
          <svg viewBox="0 0 100 50" fill="currentColor" style={{ transform: f.direction === 'swimLTR' ? 'scaleX(-1)' : 'none' }} className="w-full h-full text-cyan-500 drop-shadow-[0_4px_12px_rgba(6,182,212,0.4)]"><path d="M10,25 C30,10 70,10 90,25 C70,40 30,40 10,25 M90,25 L100,15 L95,25 L100,35 Z" /><circle cx="30" cy="22" r="3" fill="rgba(0,0,0,0.5)" /></svg>
        </div>
      ))}
    </div>
  );
};

// Hàm gộp file Excel thực tế
const realProcessExcelFiles = async (files: File[], platform: Platform): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      let combinedData: any[] = [];
      let count = 0;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          combinedData = [...combinedData, ...sheetData];
          count++;
          if (count === files.length) {
            const newWs = XLSX.utils.json_to_sheet(combinedData);
            const newWb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWb, newWs, "Kết Quả Gộp");
            const wbout = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
            resolve(new Blob([wbout], { type: "application/octet-stream" }));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (err) { reject(err); }
  });
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
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    refreshFeedbacks();
    const interval = setInterval(refreshFeedbacks, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDefaultFiles = async () => {
      try {
        const resN = await fetch('/notices.txt');
        if (resN.ok) {
          const text = await resN.text();
          const parsed: NoticeItem[] = [];
          text.split('\n').forEach((line, idx) => {
            if (!line.includes('|')) return;
            const pts = line.split('|');
            parsed.push({ id: idx, date: pts[0]?.trim(), title: pts[1]?.trim(), desc: pts[2]?.trim() });
          });
          if (parsed.length > 0) setNotices(parsed);
        }

        const resP = await fetch('/products.xlsx');
        if (resP.ok) {
          const ab = await resP.arrayBuffer();
          const workbook = XLSX.read(new Uint8Array(ab), { type: 'array' });
          const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
          let pCol = -1;
          if (json.length > 0) {
            for (let r = 0; r < Math.min(json.length, 5); r++) {
              pCol = (json[r] || []).findIndex((c: any) => typeof c === 'string' && c.toLowerCase().includes('tên sản phẩm'));
              if (pCol !== -1) {
                const names: string[] = [];
                for (let i = r + 1; i < json.length; i++) {
                  if (json[i]?.[pCol]) names.push(String(json[i][pCol]).trim());
                }
                setProductList(Array.from(new Set(names)));
                break;
              }
            }
          }
        }
      } catch (e) { console.error(e); }
    };
    loadDefaultFiles();
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbContent.trim()) return;
    const payload = { name: fbName.trim(), content: fbContent.trim(), timestamp: Date.now() };
    const success = await sFetchPost(payload);
    if (success) {
      setFbContent('');
      refreshFeedbacks();
    } else {
      const localItem: FeedbackItem = { id: Math.random().toString(), ...payload };
      setFeedbacks(prev => [localItem, ...prev]);
      setFbContent('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(event.target.value ? event.target.files || [] : []);
    if (files.length + selectedFiles.length > MAX_FILES) {
      setState({ status: 'error', message: `Tối đa ${MAX_FILES} file mỗi lần.` });
      return;
    }
    setState({ status: 'idle', message: '' });
    selectedFiles.forEach(f => addToHistory({ type: 'upload', filename: f.name, platform: activePlatform }));
    setFiles(prev => [...prev, ...selectedFiles]);
    setProcessedFileUrl(null);
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
      const blob = await realProcessExcelFiles(files, activePlatform);
      setProcessedFileUrl(URL.createObjectURL(blob));
      setState({ status: 'success', message: `Gộp đơn ${activePlatform.toUpperCase()} thành công!` });
      setShowCelebrationBubbles(true);
      addToHistory({ type: 'download', filename: `Kết Quả_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`, platform: activePlatform });
    } catch (error: any) { setState({ status: 'error', message: error.message || 'Lỗi xử lý file.' }); }
  };

  const handlePickRandomProduct = () => {
    if (productList.length === 0) return;
    setRandomProduct(productList[Math.floor(Math.random() * productList.length)]);
    if (typeof (window as any).confetti === 'function') {
      (window as any).confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: isOcean ? ['#22d3ee', '#34d399'] : ['#fde047', '#ff0000'] });
    }
  };

  const reset = () => { setFiles([]); setState({ status: 'idle', message: '' }); setProcessedFileUrl(null); setShowCelebrationBubbles(false); };
  const clearHistory = () => { if (confirm('Xóa toàn bộ lịch sử?')) setHistory([]); };

  return (
    <div className="w-full relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-x-hidden pt-4">
      
      {/* ==========================================
          BẢNG THÔNG BÁO QUAN TRỌNG: ABSOLUTE SÁT ĐỈNH (CUỘN LÀ MẤT)
          ========================================== */}
      {notices.length > 0 && (
        <div className="absolute top-0 right-0 z-[999] hidden md:block animate-slide-up">
          <div className={`pb-5 px-5 pt-0 rounded-bl-3xl border-b-2 border-l-2 border-t-0 transition-all duration-500 shadow-2xl w-[320px] lg:w-[355px] space-y-4 ${
            isOcean ? 'bg-slate-950 border-cyan-500/40 shadow-cyan-950/60 text-cyan-100 backdrop-blur-md' : 'bg-white border-yellow-300 text-amber-900'
          }`}>
            <div className={`flex items-center gap-2 border-b pb-3 pt-3.5 -mx-5 px-5 rounded-tl-none ${isOcean ? 'border-cyan-500/30 bg-slate-900' : 'border-yellow-200 bg-yellow-50/60'}`}>
              <span className="text-sm animate-pulse">{isOcean ? '📟' : '📢'}</span>
              <h2 className="text-xs font-black tracking-wider uppercase">Thông báo quan trọng</h2>
            </div>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {notices.map(notice => (
                <div key={notice.id} className={`p-3 rounded-xl border flex gap-3 hover:scale-[1.02] transition-transform ${isOcean ? 'bg-slate-900/60 border-cyan-500/10' : 'bg-gradient-to-r from-red-50/50 to-white border-red-100'}`}>
                  <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs border ${isOcean ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-gradient-to-br from-red-500 to-red-600 text-white'}`}>{notice.date}</div>
                  <div className="min-w-0 flex-1"><p className="text-xs font-black truncate">{notice.title}</p><p className="text-[11px] opacity-85 leading-normal mt-1 line-clamp-3 text-justify pr-1">{notice.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-6">
        <ClickBubbleBurst /><SuccessBubbleBlast trigger={showCelebrationBubbles} />
        {isOcean ? ( <> <RisingBubbles /> <InteractiveSwimmingFish /> <BioluminescenceSpores /> <WaterDistortionOverlay /> </> ) : ( <BioluminescentFlowersTet /> )}
        
        <Couplet text="Đơn thưa, lòng không nản" position="left" theme={theme} />
        <Couplet text="Chí vững, lộc ắt về" position="right" theme={theme} />
        
        {/* Floating decorations */}
        {isOcean ? (
          <>
            <div className="fixed top-24 left-10 w-24 h-28 opacity-45 pointer-events-none hidden lg:block animate-float z-0"><JellyfishSVG className="w-full h-full" /></div>
            <div className="fixed bottom-12 right-20 w-28 h-32 opacity-35 pointer-events-none hidden lg:block z-0 animate-float"><StarfishSVG className="w-full h-full" /></div>
          </>
        ) : (
          <>
            <div className="fixed top-20 left-4 w-32 h-32 opacity-40 pointer-events-none hidden lg:block text-yellow-300"><Sparkle className="w-full h-full drop-shadow-2xl" /></div>
            <div className="fixed top-24 right-10 w-24 h-24 opacity-50 pointer-events-none hidden lg:block animate-pulse"><Star className="w-full h-full drop-shadow-2xl" /></div>
          </>
        )}

        {/* KHU VỰC TRUNG TÂM */}
        <div className="flex flex-col gap-10 relative z-10 max-w-6xl mx-auto">
          <div className="text-center space-y-2 flex flex-col items-center">
            <button onClick={toggleTheme} className={`mb-4 px-5 py-2 rounded-full font-bold text-xs border shadow-md hover:scale-105 active:scale-95 transition-transform ${isOcean ? 'bg-slate-900 text-cyan-300 border-cyan-500/30' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>
              {isOcean ? '☀️ CHUYỂN SANG CHẾ ĐỘ TẾT' : '🌊 CHUYỂN SANG CHẾ ĐỘ BIỂN'}
            </button>
            <h1 className="text-5xl md:text-7xl font-black font-tet-title tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-100 to-teal-400">LÊN ĐƠN THÔI</h1>
          </div>

          {/* Platform Tabs */}
          <div className="flex justify-center">
            <div className="p-2 rounded-2xl flex gap-2 border bg-slate-900/60 border-cyan-500/40 shadow-xl">
              <button onClick={() => { setActivePlatform('shopee'); reset(); }} className={`px-8 py-3 rounded-xl font-bold text-lg border-2 ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-orange-500 to-red-600 border-orange-400 text-white shadow-lg' : 'text-cyan-200 border-transparent'}`}>SHOPEE</button>
              <button onClick={() => { setActivePlatform('tiktok'); reset(); }} className={`px-8 py-3 rounded-xl font-bold text-lg border-2 ${activePlatform === 'tiktok' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-lg' : 'text-cyan-200 border-transparent'}`}>TIKTOK</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* NHẬT KÝ */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-7 rounded-3xl border-2 border-cyan-500/20 bg-slate-950/50 space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
                  <h2 className="text-lg font-bold">Nhật ký</h2>
                  {history.length > 0 && <button onClick={clearHistory} className="text-xs font-black uppercase tracking-wider text-cyan-400">Xóa</button>}
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {history.length === 0 ? ( <p className="text-center text-xs opacity-40 py-6">Chưa có lịch sử</p> ) : (
                    history.map(item => (
                      <div key={item.id} className="p-3 rounded-xl border border-cyan-500/10 bg-slate-900/50 text-xs flex justify-between">
                        <span className="font-bold truncate max-w-[180px]">{item.filename}</span>
                        <span className="opacity-50">{new Date(item.timestamp).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* THẢ FILE */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-8 rounded-[2.5rem] border-4 border-cyan-500/30 bg-slate-950/50">
                {!processedFileUrl && (
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-cyan-500/30 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-950/10 transition-colors">
                    <BubbleSVG className="w-12 h-12 text-cyan-400 mb-4" />
                    <p className="text-2xl font-black">Thả file {activePlatform.toUpperCase()} vào đây</p>
                    <p className="mt-2 text-sm opacity-60">hoặc nhấn để chọn file từ thiết bị</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                  </div>
                )}

                {files.length > 0 && !processedFileUrl && (
                  <div className="space-y-4">
                    {files.map((f, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 flex justify-between text-sm">
                        <span className="font-bold truncate max-w-xs">{f.name}</span>
                        <button onClick={() => removeFile(idx)} className="text-rose-400 font-bold px-2">Xóa</button>
                      </div>
                    ))}
                    <button onClick={handleProcess} className="w-full mt-4 py-5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 rounded-2xl font-bold text-xl border border-cyan-400 shadow-xl">XỬ LÝ GỘP ĐƠN NGAY</button>
                  </div>
                )}

                {productList.length > 0 && !processedFileUrl && (
                  <div className="p-5 mt-6 rounded-2xl border-2 border-cyan-500/20 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                      <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-70">🎲 Gợi ý mặt hàng hôm nay ({productList.length}):</p>
                      <div className={`text-sm font-bold mt-1.5 truncate p-3 rounded-xl border border-dashed min-h-[48px] flex items-center justify-center sm:justify-start ${randomProduct ? 'bg-cyan-950/40 border-cyan-500/30' : 'opacity-40 italic text-xs'}`}>{randomProduct || "Đang chờ quay số..."}</div>
                    </div>
                    <button onClick={handlePickRandomProduct} className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400 text-white rounded-xl font-bold text-xs uppercase flex-shrink-0 tracking-wider">Hôm nay bán gì?</button>
                  </div>
                )}

                {state.status === 'processing' && <p className="text-center py-6 text-cyan-400 animate-pulse font-bold uppercase tracking-widest text-sm">{state.message}</p>}
                {state.status === 'success' && processedFileUrl && (
                  <div className="space-y-5 animate-slide-up">
                    <div className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-center font-bold text-emerald-400">Gộp file xuất sắc thành công tốt đẹp!</div>
                    <a href={processedFileUrl} download={`Kết Quả_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center w-full py-6 rounded-2xl font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl">TẢI FILE KẾT QUẢ ĐÃ GỘP</a>
                    <button onClick={reset} className="w-full text-center text-xs opacity-60 font-bold py-2">Làm lượt mới</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KHU VỰC GÓP Ý DƯỚI CÙNG */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full border-t border-cyan-500/10 pt-8 mt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="lg:col-span-5">
              <form onSubmit={handleSendFeedback} className={`p-6 rounded-3xl border-2 border-cyan-500/20 bg-slate-950/40 space-y-4`}>
                <h3 className="text-base font-black uppercase text-cyan-300 tracking-wider">Gửi góp ý của bạn</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold block mb-1 uppercase tracking-wider opacity-70">Tên của bạn:</label>
                    <input type="text" required value={fbName} onChange={(e) => setFbName(e.target.value)} placeholder="Nhập tên..." className="w-full px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 outline-none text-sm font-bold text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1 uppercase tracking-wider opacity-70">Nội dung góp ý:</label>
                    <textarea required rows={3} value={fbContent} onChange={(e) => setFbContent(e.target.value)} placeholder="Góp ý tính năng cải tiến..." className="w-full px-4 py-3 rounded-xl border border-cyan-500/20 bg-slate-900/80 outline-none text-sm resize-none text-white" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-xs tracking-widest uppercase">Gửi ý kiến ngay</button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-7">
              <div className={`p-6 rounded-3xl border-2 border-cyan-500/20 bg-slate-950/40 flex flex-col h-[302px]`}>
                <h3 className="text-base font-black uppercase text-cyan-300 tracking-wider border-b border-cyan-500/20 pb-3 mb-3">Hòm thư góp ý công khai ({feedbacks.length})</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {feedbacks.length === 0 ? ( <p className="text-center py-12 opacity-40 italic text-sm">Chưa có bài góp ý nào.</p> ) : (
                    feedbacks.map(fb => (
                      <div key={fb.id} className="p-3.5 rounded-2xl border border-cyan-500/10 bg-slate-900/40 text-xs">
                        <div className="flex justify-between border-b border-dashed border-cyan-500/20 pb-1 mb-2 opacity-80 font-bold">
                          <span className="text-cyan-300">👤 {fb.name}</span>
                          <span className="opacity-50">{new Date(fb.timestamp).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap text-left font-medium">{fb.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zeyada&family=Ruthie&display=swap');
        [class*="Couplet"], .fixed.w-12.text-center {
          font-family: 'Zeyada', 'Ruthie', cursive !important;
          font-size: 26px !important;
          line-height: 1.2 !important;
          letter-spacing: 2px !important;
        }
        .custom-scrollbar::-webkit-scrollbar{width:4px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#22d3ee;border-radius:10px;}
        .animate-spin-slow { animation: spin 12s linear infinite; }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes rise { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 10% { opacity: 0.8; } 100% { transform: translateY(-105vh) scale(1.2); opacity: 0; } }
        @keyframes fall { 0% { transform: translateY(-5vh) rotate(0deg); opacity: 0; } 10% { opacity: 0.7; } 100% { transform: translateY(105vh) rotate(360deg); opacity: 0; } }
        @keyframes fishWiggle { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-3px) rotate(3deg); } }
        @keyframes swimLTR { 0% { left: -100px; } 100% { left: 100%; } }
        @keyframes swimRTL { 0% { right: -100px; transform: scaleX(-1); } 100% { right: 100%; transform: scaleX(-1); } }
        @keyframes water-wave { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(8deg); } }
        @keyframes pulseBreath { 0% { opacity: 0.3; } 100% { opacity: 0.8; } }
      `}</style>
    </div>
  );
};

export default App;
