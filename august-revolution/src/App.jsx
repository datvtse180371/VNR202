import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Menu, X, Calendar, MapPin, Users, Award, BookOpen, ChevronRight, Star, Flame, Flag, Target, Zap } from 'lucide-react';
import ChatAgent from './components/ChatAgent';
import { Analytics } from '@vercel/analytics/next';

// Optional: Vercel Analytics (requires installing @vercel/analytics)
let AnalyticsComp = null;
try {
  // Dynamic import to avoid build errors if package not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  const mod = require('@vercel/analytics/react');
  AnalyticsComp = mod.Analytics;
} catch {}

// Import images from assets
import heroImage from './assets/mo-dau.jpg';
import introImage from './assets/gioi-thieu.jpg';
import contextImage from './assets/boi-canh.jpg';
import uprisingImage from './assets/dien-bien.jpg';
import uyBanKhoiNghiaImage from './assets/uy-ban-khoi-nghia.jpg';
import hoiNghiTanTraoImage from './assets/hoi-nghi-tan-trao.jpg';
import daiHoiQuocDanImage from './assets/dai-hoi-quoc-dan.jpg';
import khoiNghiaHaNoiImage from './assets/khoi-nghia-ha-noi.jpg';
import thangLoiHueImage from './assets/thang-lơi-hue.jpg';
import baiHocKinhNghiemImage from './assets/bai-hoc-kinh-nghiem.jpg';
import ketLuanImage from './assets/ket-luan.jpg';
// Removed unused background image as we enforce a single dark theme

// Memoized timeline events outside component to avoid recreating on each render
const TIMELINE_EVENTS = [
  {
    date: '13/8/1945',
    title: 'Ủy ban Khởi nghĩa toàn quốc',
    desc: 'Trung ương Đảng & Tổng bộ Việt Minh thành lập Ủy ban Khởi nghĩa toàn quốc, ban hành "Quân lệnh số 1".',
    color: 'red',
    icon: Flag
  },
  {
    date: '14-15/8/1945',
    title: 'Hội nghị Tân Trào',
    desc: 'Hội nghị toàn quốc của Đảng tại Tân Trào, xác định phương hướng hành động: chớp thời cơ, kết hợp chính trị – quân sự.',
    color: 'yellow',
    icon: Users
  },
  {
    date: '16/8/1945',
    title: 'Đại hội Quốc dân',
    desc: 'Đại hội Quốc dân Tân Trào (60 đại biểu) thông qua 10 chính sách, bầu Ủy ban Giải phóng do Hồ Chí Minh làm Chủ tịch.',
    color: 'orange',
    icon: Award
  },
  {
    date: '14-18/8/1945',
    title: 'Các địa phương nổi dậy',
    desc: '4 tỉnh đầu tiên: Hải Dương, Bắc Giang, Hà Tĩnh, Quảng Nam. Miền núi: Quân Giải phóng tấn công đồn Nhật.',
    color: 'red',
    icon: Target
  },
  {
    date: '19/8/1945',
    title: 'Hà Nội khởi nghĩa',
    desc: 'Mít tinh tại Quảng trường Nhà hát Lớn → biểu tình vũ trang. Chính quyền về tay nhân dân trong 1 ngày!',
    color: 'yellow',
    icon: Zap,
    highlight: true
  },
  {
    date: '23/8/1945',
    title: 'Huế khởi nghĩa',
    desc: 'Kinh đô phong kiến cuối cùng khởi nghĩa thành công.',
    color: 'orange',
    icon: Flag
  },
  {
    date: '25/8/1945',
    title: 'Sài Gòn khởi nghĩa',
    desc: 'Hàng triệu người biểu tình, chiếm công sở, đánh đổ chính quyền thân Nhật.',
    color: 'red',
    icon: Users
  },
  {
    date: '30/8/1945',
    title: 'Vua Bảo Đại thoái vị',
    desc: 'Tại Ngọ Môn (Huế) trao ấn kiếm, chấm dứt chế độ quân chủ gần 1.000 năm.',
    color: 'yellow',
    icon: Award
  },
  {
    date: '2/9/1945',
    title: 'Ngày Quốc Khánh',
    desc: 'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập. Nước Việt Nam Dân chủ Cộng hòa ra đời!',
    color: 'red',
    icon: Star,
    final: true
  }
];

const AugustRevolutionWebsite = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rafId = useRef(null);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [starCount, setStarCount] = useState(24);
  // Enforce dark theme only

  const sections = useMemo(() => ([
    { id: 'intro', title: 'Giới thiệu', icon: BookOpen },
    { id: 'context', title: 'Bối cảnh', icon: Calendar },
    { id: 'uprising', title: 'Tổng khởi nghĩa', icon: Users },
    { id: 'lessons', title: 'Bài học kinh nghiệm', icon: Award },
  ]), []);

  useEffect(() => {
    // Document metadata polish
    document.title = 'Cách mạng Tháng Tám 1945 — Trang thông tin giáo dục';
    const existingMeta = document.querySelector('meta[name="theme-color"]');
    if (existingMeta) {
      existingMeta.setAttribute('content', '#111827');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', '#111827');
      document.head.appendChild(meta);
    }

    // IntersectionObserver for active section detection
    const sectionEls = Array.from(document.querySelectorAll('section[id]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '-100px 0px -66% 0px', threshold: [0, 0.1, 0.25] }
    );
    sectionEls.forEach((el) => observer.observe(el));

    const handleMouseMove = (e) => {
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(() => {
          setMousePosition(lastMouse.current);
          rafId.current = null;
        });
      }
    };

    // Responsive star density
    const handleResize = () => {
      const width = window.innerWidth;
      setStarCount(width < 640 ? 12 : 24);
    };
    handleResize();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  }, []);
  const timelineEvents = useMemo(() => TIMELINE_EVENTS, []);

  const renderBackground = () => {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-[#1a0000] via-[#2d0a0a] to-[#1a0000]"></div>
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(starCount)].map((_, i) => (
            <div
              key={`dstar-${i}`}
              className="absolute text-yellow-500"
              style={{
                left: `${(i * 29) % 100}%`,
                top: `${(i * 17 + 13) % 100}%`,
                opacity: 0.1 + (i % 5) * 0.03,
                animation: `float ${18 + (i % 5) * 4}s ease-in-out infinite`,
                transform: `scale(${0.5 + (i % 4) * 0.25})`
              }}
            >
              <Star size={8 + (i % 4) * 3} fill="currentColor" />
            </div>
          ))}
        </div>
        <div className="fixed inset-0 opacity-[0.08]" style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(218,165,32,0.1), transparent 60%)`
        }}></div>
      </>
    );
  };
  return (
    <div className="min-h-screen overflow-x-hidden relative">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber-300 focus:text-stone-900 focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Bỏ qua điều hướng
      </a>
      {renderBackground()}

      {/* Enhanced Mouse Follower Glow */}
      <div
        className="fixed w-72 h-72 rounded-full pointer-events-none transition-transform duration-500 ease-out z-0"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(251, 191, 36, 0.15) 40%, transparent 70%)',
          filter: 'blur(40px)',
          left: mousePosition.x - 144,
          top: mousePosition.y - 144,
          willChange: 'transform'
        }}
      />

      {/* Header */}
      <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-stone-800/70 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-amber-300 rounded-full flex items-center justify-center transform group-hover:rotate-180 transition-transform duration-500">
                  <Star className="text-stone-900" size={24} fill="currentColor" />
                </div>
                <div className="absolute inset-0 bg-amber-300 rounded-full animate-ping opacity-60"></div>
              </div>
              <h1 className="text-white text-lg sm:text-xl font-bold hover:scale-105 transition-transform">
                Cách mạng Tháng Tám 1945
              </h1>
            </div>

            <nav role="navigation" aria-label="Chuyển đến mục" className="hidden md:flex space-x-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800 ${activeSection === section.id
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-semibold shadow-lg'
                    : 'text-white hover:bg-stone-700'
                    }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-stone-700 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden bg-stone-900 border-t border-stone-700 transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
          <div className="px-4 py-3 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${activeSection === section.id
                    ? 'bg-amber-300 text-stone-900 font-semibold'
                    : 'text-white hover:bg-stone-800'
                    }`}
                >
                  <Icon size={20} />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Theme Switcher removed to enforce dark-only theme */}

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 relative">
            {/* Animated Background Circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-200 to-yellow-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>

            <div className="inline-block mb-6 relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10">
                <Star className="text-white" size={48} fill="currentColor" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-br from-red-600 to-yellow-500 rounded-full animate-ping opacity-20"
                  style={{ animationDelay: `${i * 0.5}s` }}
                ></div>
              ))}
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-50 mb-4 relative z-10">
              {['Cách', 'mạng', 'Tháng', 'Tám', 'năm', '1945'].map((word, i) => (
                <span
                  key={i}
                  className="inline-block hover:scale-110 transition-transform cursor-default mx-1"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    color: word === '1945' ? '#ca8a04' : undefined
                  }}
                >
                  {word}
                </span>
              ))}
            </h2>

            <p className="text-xl sm:text-2xl text-amber-300 font-semibold mb-8 relative z-10">
              Bước ngoặt vĩ đại trong lịch sử dân tộc Việt Nam
            </p>

            {/* Hero Image */}
            <div className="mb-8 relative z-10">
              <img 
                loading="lazy"
                decoding="async"
                width="1280"
                height="768"
                src={heroImage} 
                alt="Cách mạng Tháng Tám năm 1945"
                className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl object-cover h-64 sm:h-80 md:h-96"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-200 relative z-10">
              <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full shadow-md hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <Calendar className="text-amber-400 group-hover:animate-bounce" size={20} />
                <span className="font-semibold">2/9/1945</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full shadow-md hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <MapPin className="text-amber-400 group-hover:animate-bounce" size={20} />
                <span className="font-semibold">Quảng trường Ba Đình, Hà Nội</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">

        {/* Introduction */}
        <section id="intro" className="mb-16 scroll-mt-20">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border-l-8 border-red-700 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100 to-yellow-100 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -mr-32 -mt-32"></div>

            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="bg-red-100 p-3 rounded-xl group-hover:rotate-12 transition-transform duration-500">
                <BookOpen className="text-amber-700" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">Giới thiệu</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6 relative z-10">
              <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
                <p className="text-lg hover:text-red-700 transition-colors duration-300">
                  Cách mạng Tháng Tám năm 1945 là một sự kiện lịch sử trọng đại, đánh dấu <span className="font-bold text-amber-700">bước ngoặt vĩ đại</span> trong lịch sử dân tộc Việt Nam. Đây là cuộc cách mạng giải phóng dân tộc mang tính dân chủ mới, nhằm chấm dứt ách thống trị của đế quốc và phong kiến, giành chính quyền về tay nhân dân.
                </p>
                <p className="text-lg hover:text-red-700 transition-colors duration-300">
                  Dưới sự lãnh đạo của <span className="font-bold text-amber-700">Đảng Cộng sản Đông Dương</span> và lãnh tụ <span className="font-bold text-amber-700">Hồ Chí Minh</span>, nhân dân Việt Nam đã hoàn thành nhiệm vụ trung tâm của cách mạng: giải phóng dân tộc, giành độc lập, tự do cho Tổ quốc.
                </p>
              </div>
              <div className="relative">
                <img 
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="800"
                  src={introImage} 
                  alt="Giới thiệu về Cách mạng Tháng Tám"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Historical Context */}
        <section id="context" className="mb-16 scroll-mt-20">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border-l-8 border-red-700 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-yellow-100 p-3 rounded-xl hover:rotate-12 transition-transform duration-500">
                <Calendar className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">Bối cảnh lịch sử và thời cơ cách mạng</h3>
            </div>

            <div className="mb-6">
              <img 
                loading="lazy"
                decoding="async"
                width="1280"
                height="640"
                src={contextImage} 
                alt="Bối cảnh lịch sử"
                className="w-full rounded-xl shadow-lg object-cover h-80 object-center object-top"
                style={{ objectPosition: 'center top' }}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center space-x-2 mb-4">
                  <Flame className="text-yellow-600 animate-pulse" size={24} />
                  <h4 className="text-xl font-bold text-gray-800">Bối cảnh quốc tế</h4>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                    <span><strong>9/5/1945:</strong> Phát xít Đức đầu hàng Liên Xô và Đồng minh</span>
                  </li>
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                    <span>Liên Xô tuyên chiến với Nhật Bản, đánh tan đạo quân Quan Đông tại Mãn Châu</span>
                  </li>
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                    <span>Mỹ ném hai quả bom nguyên tử xuống Hiroshima (6/8) và Nagasaki (9/8)</span>
                  </li>
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                    <span><strong>15/8/1945:</strong> Nhật Bản tuyên bố đầu hàng vô điều kiện</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center space-x-2 mb-4">
                  <Flag className="text-amber-700 animate-pulse" size={24} />
                  <h4 className="text-xl font-bold text-gray-800">Tình hình Đông Dương</h4>
                </div>
                <p className="text-gray-700 mb-4">
                  Quân Nhật ở Đông Dương mất hết tinh thần, chính quyền thân Nhật rệu rã, khủng hoảng trầm trọng. <span className="font-bold text-amber-700">Thời cơ ngàn năm có một</span> cho cách mạng Việt Nam đã đến.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <span className="animate-pulse">⚠️</span>
                  <span>Nguy cơ mới</span>
                </h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <span>Theo Hội nghị Potsdam (7/1945): Quân Trung Hoa Dân quốc vào Bắc Việt Nam, quân Anh vào Nam Việt Nam</span>
                  </li>
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <span>Thực dân Pháp âm mưu quay lại khôi phục ách thống trị</span>
                  </li>
                  <li className="flex items-start space-x-3 hover:translate-x-2 transition-transform duration-300">
                    <ChevronRight className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <span>Các thế lực phản động trong nước tìm cách duy trì chế độ phong kiến</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-red-100 to-yellow-100 p-6 rounded-xl border-2 border-red-300 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-yellow-200 opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <p className="text-lg font-semibold text-gray-800 italic relative z-10">
                  "Thời cơ tổng khởi nghĩa đã chín muồi, cần phải hành động khẩn trương <span className="text-amber-700">như một cuộc chạy đua với quân Đồng minh</span>"
                </p>
                <p className="text-right text-gray-600 mt-2 relative z-10">- Đảng Cộng sản Đông Dương</p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section - Custom Design */}
        <section id="uprising" className="mb-16 scroll-mt-20">
          {/* Decorative subtle background */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border-l-8 border-red-700 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl"> 
            <div className="flex items-center space-x-3 mb-8"> 
              <div className="bg-red-100 p-3 rounded-xl hover:rotate-12 transition-transform duration-500"> 
                <Users className="text-amber-700" size={32} /> 
              </div> 
              <h3 className="text-3xl font-bold text-gray-800">Diễn biến Tổng khởi nghĩa giành chính quyền</h3> 
            </div>
            
            <div className="mb-8">
              <img 
                loading="lazy"
                decoding="async"
                width="1280"
                height="512"
                src={uprisingImage} 
                alt="Diễn biến Tổng khởi nghĩa"
                className="w-full rounded-xl shadow-lg object-cover h-64"
              />
            </div>

            <div className="relative">
              {/* Vertical timeline line (centered) */}
              <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-red-300 via-red-500 to-red-800 rounded-full"></div>

              {[
                {
                  date: '13/8/1945',
                  title: 'Ủy ban Khởi nghĩa toàn quốc được thành lập',
                  content:
                    'Ban Thường vụ Trung ương Đảng quyết định phát động toàn dân nổi dậy, lập Ủy ban khởi nghĩa toàn quốc do Trường Chinh đứng đầu.',
                  icon: Flame,
                  image: uyBanKhoiNghiaImage,
                },
                {
                  date: '14–15/8/1945',
                  title: 'Hội nghị toàn quốc của Đảng tại Tân Trào',
                  content:
                    'Hội nghị quyết định Tổng khởi nghĩa trong cả nước và đề ra kế hoạch giành chính quyền.',
                  icon: Calendar,
                  image: hoiNghiTanTraoImage,
                },
                {
                  date: '16–17/8/1945',
                  title: 'Đại hội Quốc dân tại Tân Trào',
                  content:
                    'Đại hội tán thành chủ trương Tổng khởi nghĩa, thông qua 10 chính sách lớn của Việt Minh và bầu ra Ủy ban Dân tộc Giải phóng Việt Nam.',
                  icon: Users,
                  image: daiHoiQuocDanImage,
                },
                {
                  date: '19/8/1945',
                  title: 'Khởi nghĩa giành chính quyền ở Hà Nội',
                  content:
                    'Nhân dân Hà Nội vùng lên giành chính quyền thành công, mở đầu cho thắng lợi của Cách mạng Tháng Tám trên cả nước.',
                  icon: Star,
                  image: khoiNghiaHaNoiImage,
                },
                {
                  date: '23–25/8/1945',
                  title: 'Thắng lợi ở Huế và Sài Gòn',
                  content:
                    'Chính quyền cách mạng được thiết lập trên toàn quốc, đánh dấu thắng lợi hoàn toàn của nhân dân Việt Nam.',
                  icon: Award,
                  image: thangLoiHueImage,
                },
              ].map((event, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className="relative flex flex-col md:flex-row items-center justify-between w-full mb-20"
                  >
                    {/* --- Left Side Content --- */}
                    <div className={`w-full md:w-5/12 mb-4 md:mb-0`}>
                      {isEven ? (
                        // Even: Card on LEFT
                        <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-md hover:shadow-2xl transition duration-500 transform hover:-translate-y-2 relative z-20 md:text-left">
                          <p className="text-sm text-amber-700 font-semibold">{event.date}</p>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                            {event.title}
                          </h3>
                          <p className="text-gray-700 mt-2 leading-relaxed">{event.content}</p>
                        </div>
                      ) : (
                        // Odd: Image on LEFT
                        <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105">
                          <img 
                            loading="lazy"
                            decoding="async"
                            width="1200"
                            height="512"
                            src={event.image} 
                            alt={event.title}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* --- Center Dot --- */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-30">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-xl shadow-red-300 ring-4 ring-white">
                        <event.icon className="text-white" size={24} />
                      </div>
                    </div>

                    {/* --- Right Side Content --- */}
                    <div className="w-full md:w-5/12">
                      {isEven ? (
                        // Even: Image on RIGHT
                        <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105">
                          <img 
                            loading="lazy"
                            decoding="async"
                            width="1200"
                            height="512"
                            src={event.image} 
                            alt={event.title}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      ) : (
                        // Odd: Card on RIGHT
                        <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-md hover:shadow-2xl transition duration-500 transform hover:-translate-y-2 relative z-20 md:text-right">
                          <p className="text-sm text-amber-700 font-semibold">{event.date}</p>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                            {event.title}
                          </h3>
                          <p className="text-gray-700 mt-2 leading-relaxed">{event.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {/* Lessons */}
        <section id="lessons" className="mb-16 scroll-mt-20">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border-l-8 border-red-700 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-red-100 p-3 rounded-xl hover:rotate-12 transition-transform duration-500">
                <MapPin className="text-amber-700" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">Những bài học và kinh nghiệm quý báu</h3>
            </div>

            <div className="mb-6">
              <img 
                loading="lazy"
                decoding="async"
                width="1280"
                height="512"
                src={baiHocKinhNghiemImage} 
                alt="Bài học và kinh nghiệm"
                className="w-full rounded-xl shadow-lg object-cover h-64"
              />
            </div>

            <div className="space-y-6">
              {[
                {
                  num: 1,
                  bgColor: 'from-red-50 to-orange-50',
                  borderColor: 'border-red-600',
                  numBg: 'bg-red-600',
                  title: 'Xác định đúng đường lối chiến lược',
                  desc: 'Đặt nhiệm vụ giải phóng dân tộc lên hàng đầu, gắn liền với mục tiêu dân chủ và tiến bộ xã hội. Đó là sự vận dụng sáng tạo chủ nghĩa Mác – Lênin và tư tưởng Hồ Chí Minh vào hoàn cảnh Việt Nam.'
                },
                {
                  num: 2,
                  bgColor: 'from-yellow-50 to-orange-50',
                  borderColor: 'border-yellow-600',
                  numBg: 'bg-yellow-600',
                  title: 'Xây dựng lực lượng toàn dân đoàn kết',
                  desc: 'Dựa trên khối liên minh công – nông, khơi dậy tinh thần yêu nước, tập hợp mọi tầng lớp trong Mặt trận Việt Minh, biến phong trào yêu nước thành sức mạnh tổng hợp của dân tộc.',
                  quote: '"Đoàn kết, đoàn kết, đại đoàn kết - Thành công, thành công, đại thành công"'
                },
                {
                  num: 3,
                  bgColor: 'from-orange-50 to-red-50',
                  borderColor: 'border-orange-600',
                  numBg: 'bg-orange-600',
                  title: 'Kết hợp đúng đắn giữa chính trị và vũ trang',
                  desc: 'Biết kết hợp đấu tranh chính trị, vũ trang, binh vận; khởi nghĩa từng phần tiến tới tổng khởi nghĩa toàn quốc; nắm vững và chớp đúng thời cơ vàng của lịch sử.'
                },
                {
                  num: 4,
                  bgColor: 'from-red-50 to-pink-50',
                  borderColor: 'border-red-700',
                  numBg: 'bg-red-700',
                  title: 'Xây dựng Đảng vững mạnh',
                  desc: 'Đảng Cộng sản phải là đội tiên phong, trung thành với lợi ích dân tộc; gắn bó mật thiết với nhân dân; có đường lối, phương pháp lãnh đạo sáng tạo, linh hoạt và phù hợp thực tiễn.'
                }
              ].map((lesson, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${lesson.bgColor} p-6 rounded-xl border-l-4 ${lesson.borderColor} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${lesson.numBg} text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-lg`}>
                      {lesson.num}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">{lesson.title}</h4>
                      <p className="text-gray-700">{lesson.desc}</p>
                      {lesson.quote && (
                        <div className="bg-white/70 p-4 rounded-lg mt-3">
                          <p className="text-sm text-gray-600 italic">{lesson.quote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-red-600 to-yellow-600 p-8 rounded-2xl text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
                <h4 className="text-2xl font-bold mb-4 text-center">Thông điệp bất hủ</h4>
                <p className="text-lg leading-relaxed text-center">
                  Cách mạng Tháng Tám không chỉ đem lại độc lập cho dân tộc, mà còn thể hiện <strong>sức mạnh của khối đại đoàn kết toàn dân</strong> và <strong>ý chí kiên cường của con người Việt Nam</strong>.
                </p>
                <div className="text-center mt-6">
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                    <p className="text-xl font-bold flex items-center space-x-2">
                      <Star size={20} fill="currentColor" />
                      <span>Một bản anh hùng ca bất diệt</span>
                      <Star size={20} fill="currentColor" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-red-600 via-red-700 to-yellow-600 rounded-2xl shadow-2xl p-10 text-white relative overflow-hidden">
            {/* Decorative Pattern (match background style) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {[...Array(24)].map((_, i) => (
                <div
                  key={`cstar-${i}`}
                  className="absolute text-yellow-500"
                  style={{
                    left: `${(i * 29) % 100}%`,
                    top: `${(i * 17 + 13) % 100}%`,
                    opacity: 0.08 + (i % 5) * 0.025,
                    animation: `float ${18 + (i % 5) * 4}s ease-in-out infinite`,
                    transform: `scale(${0.5 + (i % 4) * 0.25})`
                  }}
                >
                  <Star size={8 + (i % 4) * 3} fill="currentColor" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: `radial-gradient(circle at 50% 0%, rgba(218,165,32,0.1), transparent 60%)`
            }}></div>

            <div className="text-center mb-8 relative z-10">
              <div className="inline-block mb-4">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl animate-spin-slow">
                  <Star className="text-red-700" size={48} fill="currentColor" />
                </div>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">Kết luận</h3>
            </div>

            <div className="mb-8 relative z-10">
              <img 
                loading="lazy"
                decoding="async"
                width="1280"
                height="512"
                src={ketLuanImage} 
                alt="Kết luận"
                className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl object-cover h-64"
              />
            </div>

            <div className="space-y-6 max-w-4xl mx-auto relative z-10">
              <p className="text-lg leading-relaxed">
                Cách mạng Tháng Tám năm 1945 là <strong>bước ngoặt vĩ đại nhất</strong> trong lịch sử dân tộc Việt Nam. Dưới sự lãnh đạo sáng suốt của Đảng Cộng sản Đông Dương và lãnh tụ Hồ Chí Minh, nhân dân ta đã giành được độc lập, tự do, lập nên nước Việt Nam Dân chủ Cộng hòa.
              </p>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <p className="text-xl font-semibold text-center">
                  "Không có gì quý hơn độc lập, tự do"
                </p>
                <p className="text-center mt-2 text-sm opacity-90">- Chủ tịch Hồ Chí Minh</p>
              </div>

              <p className="text-lg leading-relaxed">
                Từ ngày 2/9/1945, nhân dân Việt Nam đã đứng lên làm chủ vận mệnh của mình, mở ra kỷ nguyên mới - kỷ nguyên độc lập, tự do và tiến lên chủ nghĩa xã hội. Đây là <strong>trang sử vàng chói lọi</strong>, là nguồn cảm hứng bất tận cho các thế hệ người Việt Nam tiếp tục xây dựng và bảo vệ Tổ quốc.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mt-8">
                {[
                  { emoji: 'VN', text: 'Độc lập' },
                  { emoji: '🕊️', text: 'Tự do' },
                  { emoji: '😊', text: 'Hạnh phúc' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/20 backdrop-blur-sm p-4 rounded-xl text-center hover:bg-white/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <p className="font-semibold">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-stone-950 text-white py-8 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-yellow-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-300 rounded-full flex items-center justify-center">
                <Star className="text-stone-900" size={24} fill="currentColor" />
              </div>
              <h4 className="text-xl font-bold">Cách mạng Tháng Tám 1945</h4>
            </div>
            <p className="text-gray-400 mb-4">
              Trang web giáo dục về Cách mạng Tháng Tám năm 1945
            </p>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-500">
                © 2024 - Tài liệu tham khảo lịch sử Đảng Cộng sản Việt Nam
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Dự án website có tích hợp công nghệ Trí tuệ Nhân tạo (AI) nhằm nâng cao trải nghiệm người dùng. AI được sử dụng để gợi ý nội dung phù hợp, hỗ trợ chatbot tự động và phân tích hành vi truy cập, giúp website hoạt động thông minh và hiệu quả hơn.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Agent */}
      <ChatAgent />

      {/* Vercel Analytics */}
      {AnalyticsComp ? <AnalyticsComp /> : null}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.15;
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
            opacity: 0.25;
          }
          50% {
            transform: translate(-15px, -50px) scale(0.9);
            opacity: 0.2;
          }
          75% {
            transform: translate(10px, -20px) scale(1.05);
            opacity: 0.23;
          }
        }
      `}</style>
    </div>
  );
};

export default AugustRevolutionWebsite;