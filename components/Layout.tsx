
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Top Border */}
      <div className="h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600"></div>
      
      <header className="bg-red-800 border-b-4 border-yellow-500 shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2.5 rounded-xl shadow-inner border-2 border-yellow-200">
              <svg className="w-7 h-7 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black text-yellow-400 tracking-tight font-tet-title drop-shadow-md">LÊN ĐƠN CÙNG LÂM</span>
              <p className="text-[10px] text-yellow-200 uppercase tracking-widest font-bold opacity-80">Công cụ hỗ trợ bán hàng</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-yellow-100/90">
            <a href="#" className="hover:text-yellow-400 transition-colors flex items-center gap-1 group">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-all"></span>
              Công cụ
            </a>
            <a href="#" className="hover:text-yellow-400 transition-colors flex items-center gap-1 group">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-all"></span>
              Hướng dẫn
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full relative z-10">
        {children}
      </main>

      <footer className="bg-red-900 border-t-4 border-yellow-600 pt-10 pb-8 mt-10 relative overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fcd34d 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <p className="text-yellow-400 font-tet-title text-lg mb-2">Chúc Mừng Năm Mới</p>
          <p className="text-sm text-red-200 font-medium">
            &copy; {new Date().getFullYear()} LÊN ĐƠN CÙNG LÂM. Vạn sự như ý - Tỷ sự như mơ.
          </p>
        </div>
      </footer>
    </div>
  );
};
