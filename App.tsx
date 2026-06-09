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
// THÔNG TIN API SUPABASE CHUẨN XÁC CỦA BẠN
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

  // ĐÃ SỬA LỖI ĐỌC FILE: THÊM { header: 1 } ĐỂ KHÔNG BỊ CRASH TRẮNG TRANG WEB GỐC
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
      
      {/* BẢNG THÔNG BÁO QUAN TRỌNG ABSOLUTE SÁT ĐỈNH (CUỘN CHUỘT LÀ KÉO MẤT) */}
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
                <div key={notice.id} className={`p-3 rounded-xl border flex gap-3 hover:scale-[1.02] transition-transform ${isOcean ? 'bg-slate-900/60 border-cyan-500/10 hover:border-cyan-500/30' : 'bg-gradient-to-r from-red-50/50 to-white border-red-100'}`}>
                  <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs border ${isOcean ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-gradient-to-br from-red-500 to-red-600 text-white'}`}>{notice.date}</div>
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

      {/* GIỮ NGUYÊN COMPONENT LAYOUT GỐC ĐỂ KHÔNG LỖI CHÂN TRANG */}
      <Layout theme={theme} toggleTheme={toggleTheme}>
        <div className="px-4 py-6 pt-10">
          <ClickBubbleBurst /><SuccessBubbleBlast trigger={showCelebrationBubbles} />
          {isOcean ? ( <> <RisingBubbles /> <InteractiveSwimmingFish /> <BioluminescenceSpores /> <WaterDistortionOverlay /> </> ) : ( <BioluminescentFlowersTet /> )}
          
          <Couplet text="Đơn thưa, lòng không nản" position="left" theme={theme} />
          <Couplet text="Chí vững, lộc ắt về" position="right" theme={theme} />
          
          {/* Absolute floating decorations */}
          {isOcean ? (
            <>
              <div className="fixed top-24 left-10 w-24 h-28 opacity-45 pointer-events-none hidden lg:block animate-float z-0" style={{ animationDelay: '0.5s' }}><JellyfishSVG className="w-full h-full" /></div>
              <div className="fixed bottom-12 right-20 w-28 h-32 opacity-35 pointer-events-none hidden lg:block z-0 animate-float" style={{ animationDelay: '2.5s' }}><JellyfishSVG className="w-full h-full" /></div>
              <div className="fixed bottom-10 left-12 w-20 h-20 opacity-30 pointer-events-none hidden lg:block z-0 animate-sway"><StarfishSVG className="w-full h-full" /></div>
            </>
          ) : (
            <>
              <div className="fixed top-20 left-4 w-32 h-32 opacity-40 pointer-events-none hidden lg:block animate-pulse mix-blend-screen"><Sparkle className="w-full h-full drop-shadow-2xl text-yellow-300" /></div>
              <div className="fixed top-24 right-10 w-24 h-24 opacity-50 pointer-events-none hidden lg:block animate-pulse mix-blend-screen" style={{ animationDelay: '1s' }}><Star className="w-full h-full drop-shadow-2xl" /></div>
              <div className="fixed bottom-10 left-10 w-40 h-40 opacity-30 pointer-events-none z-0 animate-float mix-blend-screen"><Sparkle className="w-full h-full" /></div>
              <div className="fixed bottom-20 right-5 w-28 h-28 opacity-40 pointer-events-none z-0 animate-float mix-blend-screen" style={{ animationDelay: '1.5s' }}><Star className="w-full h-full" /></div>
            </>
          )}

          {/* KHU VỰC TRUNG TÂM */}
          <div className="flex flex-col gap-10 relative z-10 max-w-6xl mx-auto">
            <div className="text-center space-y-2 flex flex-col items-center">
              <button onClick={toggleTheme} className={`mb-4 px-5 py-2 rounded-full font-bold text-xs tracking-wider uppercase transition-all border shadow-md hover:scale-105 active:scale-95 ${isOcean ? 'bg-slate-900 text-cyan-300 border-cyan-500/30' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>
                {isOcean ? '☀️ CHUYỂN SANG CHẾ ĐỘ TẾT' : '🌊 CHUYỂN SANG CHẾ ĐỘ BIỂN'}
              </button>
              <div className={`inline-flex items-center gap-2 px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border shadow-lg transition-all duration-500 ${isOcean ? 'bg-slate-900/60 text-cyan-200 border-cyan-500/40 shadow-cyan-950/40' : 'bg-gradient-to-r from-yellow-105 via-yellow-100 to-amber-100 text-yellow-805 border-yellow-355 shadow-yellow-200/50'}`}>
                {isOcean ? ( <> <span className="text-cyan-400 animate-pulse">🫧</span> Phiên Bản ĐÁY BIỂN <span className="text-cyan-400 animate-pulse">🫧</span> </> ) : ( <> <span className="text-yellow-600 animate-pulse">✨</span> Phiên Bản CÓ ĐƠN <span className="text-yellow-600 animate-pulse">✨</span> </> )}
              </div>
              <h1 className={`text-5xl md:text-7xl font-black tracking-tight leading-none font-tet-title mt-4 text-transparent bg-clip-text bg-gradient-to-br animate-shimmer drop-shadow-lg transition-all duration-500 ${isOcean ? 'from-cyan-300 via-sky-100 to-teal-400' : 'from-yellow-500 via-yellow-300 to-amber-600'}`}>LÊN ĐƠN THÔI</h1>
            </div>

            {/* Platform Tabs */}
            <div className="flex justify-center">
              <div className={`p-2 rounded-2xl flex gap-2 border transition-all duration-500 relative overflow-hidden ${isOcean ? 'bg-slate-900/60 backdrop-blur-md border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] shadow-[inset_0_2px_8px_rgba(6,182,212,0.1)]' : 'bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-300 shadow-inner'}`}>
                {isOcean && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" style={{ animation: 'scan-neon 3s linear infinite' }}></div>}
                <button onClick={() => { setActivePlatform('shopee'); reset(); }} className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'shopee' ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white border-orange-400 shadow-lg scale-105' : (isOcean ? 'bg-slate-950/60 text-cyan-200 border-transparent hover:border-cyan-500/30' : 'bg-white text-orange-850 border-transparent')}`}>SHOPEE</button>
                <button onClick={() => { setActivePlatform('tiktok'); reset(); }} className={`px-8 py-3 rounded-xl font-bold text-lg transition-all border-2 duration-300 ${activePlatform === 'tiktok' ? (isOcean ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white border-cyan-455 shadow-lg scale-105' : 'bg-gradient-to-r from-slate-900 to-black text-white border-slate-700 shadow-lg scale-105') : (isOcean ? 'bg-slate-950/60 text-cyan-200 border-transparent hover:border-cyan-500/30' : 'bg-white text-slate-800 border-transparent')}`}>TIKTOK</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              {/* NHẬT KÝ */}
              <div className="lg:col-span-4 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className={`p-7 rounded-3xl border-2 transition-all duration-500 shadow-2xl hover:-translate-y-1 space-y-4 ${isOcean ? 'bg-slate-950/50 border-cyan-500/20 shadow-cyan-950/40 text-cyan-100' : 'bg-white border-yellow-200 shadow-yellow-100/50 text-amber-900'}`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${isOcean ? 'border-cyan-500/30' : 'border-yellow-200'}`}>
                    <h2 className="text-lg font-bold font-tet-title">Nhật ký</h2>
                    {history.length > 0 && <button onClick={clearHistory} className="text-xs font-black uppercase tracking-wider text-cyan-404">Xóa</button>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <div className="text-center py-8"><span className="text-4xl opacity-30 animate-pulse">{isOcean ? '🫧' : '✨'}</span><p className="text-xs mt-2 font-medium opacity-50">Chưa có lịch sử</p></div>
                    ) : (
                      history.map(item => (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border shadow-md transition-all ${isOcean ? 'bg-gradient-to-r from-slate-900/50 to-slate-800/40 border-cyan-500/20 text-cyan-100' : 'bg-gradient-to-r from-yellow-50 to-white border-yellow-150 text-amber-900'}`}>
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-sm ${item.platform === 'shopee' ? 'bg-gradient-to-br from-orange-100 to-orange-250 text-orange-700 border-orange-300' : (isOcean ? 'bg-gradient-to-br from-cyan-900 to-cyan-750 text-white border-cyan-600' : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-600')}`}>{item.platform === 'shopee' ? 'S' : 'T'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-sm opacity-90">{item.filename}</p>
                            <div className="flex justify-between items-center mt-1 text-xs font-medium opacity-60"><span>{item.type === 'upload' ? 'Tải lên' : 'Kết quả'}</span><span>{new Date(item.timestamp).toLocaleTimeString('vi-VN')}</span></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* THẢ FILE */}
              <div className="lg:col-span-8 space-y-6 order-1 lg:order-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className={`p-2 rounded-[2.5rem] border-4 shadow-2xl overflow-hidden relative transition-all duration-500 ${isOcean ? 'bg-slate-950/50 border-cyan-500/30 shadow-cyan-950/30' : 'bg-white border-yellow-300 shadow-yellow-100/50'}`}>
                  <div className="p-8 relative z-10">
                    {files.length < MAX_FILES && !processedFileUrl && (
                      <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 group relative overflow-hidden ${isOcean ? 'border-cyan-500/40 bg-cyan-950/15 hover:bg-cyan-950/25' : 'border-yellow-405 bg-yellow-50/30 hover:bg-yellow-50/60'}`}>
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-xl bg-slate-900/80 text-cyan-400"><BubbleSVG className="w-12 h-12" /></div>
                        <p className={`text-2xl font-black text-center group-hover:scale-105 transition-transform ${isOcean ? 'text-cyan-100' : 'text-amber-955'}`}>Thả file {activePlatform.toUpperCase()} vào đây</p>
                        <p className="mt-2 font-medium opacity-60">hoặc nhấn để chọn file</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileChange} />
                      </div>
                    )}

                    {/* LIST FILE */}
                    {files.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between border-b pb-2 border-cyan-500/30">
                          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">Danh sách ({files.length})</h3>
                          {!processedFileUrl && <button onClick={reset} className="text-xs text-rose-450 font-bold">Hủy bỏ</button>}
                        </div>
                        {files.map((f, index) => (
                          <div key={index} className={`flex items-center justify-between p-4 rounded-xl border group transition-colors animate-fade-in ${isOcean ? 'bg-cyan-950/40 border-cyan-500/20' : 'bg-yellow-50/40 border-yellow-250'}`}>
                            <span className="text-sm font-bold truncate max-w-[200px]">{f.name}</span>
                            {!processedFileUrl && <button onClick={() => removeFile(index)} className="text-rose-404 px-2 font-bold">Xóa</button>}
                          </div>
                        ))}
                      </div>
                    )}

                    {productList.length > 0 && !processedFileUrl && (
                      <div className={`p-5 mb-8 rounded-2xl border-2 transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${isOcean ? 'bg-slate-900/60 border-cyan-500/20' : 'bg-amber-50/60 border-yellow-300'}`}>
                        <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                          <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-70">🎲 Gợi ý mặt hàng hôm nay ({productList.length}):</p>
                          <div className={`text-sm font-bold mt-1.5 truncate p-3 rounded-xl border border-dashed min-h-[48px] flex items-center justify-center sm:justify-start ${randomProduct ? 'bg-cyan-950/40 border-cyan-500/30 text-white' : 'opacity-40 italic text-xs'}`}>{randomProduct || "Đang chờ quay số..."}</div>
                        </div>
                        <button onClick={handlePickRandomProduct} className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold text-xs uppercase flex-shrink-0 tracking-wider">Hôm nay bán gì?</button>
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                      {state.status === 'idle' && files.length > 0 && (
                        <button onClick={handleProcess} className="w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white border border-cyan-400">XỬ LÝ GỘP ĐƠN NGAY</button>
                      )}
                      {state.status === 'processing' && <div className="text-center py-12 text-cyan-400 animate-pulse font-bold tracking-widest uppercase text-sm">{state.message}</div>}
                      {state.status === 'success' && processedFileUrl && (
                        <div className="space-y-5 animate-slide-up">
                          <div className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-center font-bold text-emerald-400">Gộp file xuất sắc thành công tốt đẹp!</div>
                          <a href={processedFileUrl} download={`Kết Quả_${activePlatform.toUpperCase()}_${Date.now()}.xlsx`} className="flex items-center justify-center w-full py-6 rounded-2xl font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl">TẢI FILE KẾT QUẢ</a>
                          <button onClick={reset} className="w-full text-center text-xs opacity-60 font-bold py-2">Làm lượt mới</button>
                        </div>
                      )}
                      {state.status === 'error' && <div className="p-6 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-2xl text-center text-sm">{state.message}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KHU VỰC GÓP Ý DƯỚI CÙNG TƯƠNG TÁC ONLINE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full border-t border-cyan-500/10 pt-8 mt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="lg:col-span-5">
                <form onSubmit={handleSendFeedback} className={`p-6 rounded-3xl border-2 shadow-xl space-y-4 ${isOcean ? 'bg-slate-950/40 border-cyan-500/30' : 'bg-white border-yellow-300'}`}>
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
                <div className={`p-6 rounded-3xl border-2 shadow-xl flex flex-col h-[302px] ${isOcean ? 'bg-slate-950/40 border-cyan-500/20' : 'bg-white border-yellow-200'}`}>
                  <h3 className="text-base font-black uppercase text-cyan-300 tracking-wider border-b border-cyan-500/20 pb-3 mb-3">Hòm thư góp ý công khai ({feedbacks.length})</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {feedbacks.length === 0 ? ( <p className="text-center py-12 opacity-40 italic text-sm">Chưa có bài góp ý nào.</p> ) : (
                      feedbacks.map(fb => (
                        <div key={fb.id} className={`p-3.5 rounded-2xl border text-xs ${isOcean ? 'bg-slate-900/40 border-cyan-500/10' : 'bg-gradient-to-r from-amber-50/30 to-white border-yellow-100 text-amber-955'}`}>
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
      </Layout>

      {/* TÍCH HỢP TOÀN DIỆN CÁC FONT VÀ CSS OVERRIDE */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zeyada&family=Ruthie&display=swap');
        [class*="Couplet"], .fixed.w-12.text-center {
          font-family: 'Zeyada', 'Ruthie', cursive !important;
          font-size: 26px !important;
          line-height: 1.2 !important;
          letter-spacing: 2px !important;
        }
        nav, header, [class*="Navbar"], [class*="Header"], .navbar-container {
          display: none !important;
          height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        body, #root, .app-container { padding-top: 0 !important; margin-top: 0 !important; }
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
