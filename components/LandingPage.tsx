
import React, { useState, useEffect } from 'react';
import { aiAvatarBase64 as dashboardImage } from '../assets/mazad-dashboard';
import { 
  NebrasLogo, 
  ChartBarIcon, 
  CubeIcon, 
  UsersIcon, 
  BanknotesIcon, 
  GlobeAltIcon, 
  BrainIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathRoundedSquareIcon,
  SparklesIcon,
  ChevronDownIcon
} from './icons/Icons';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigate?: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (action: string) => {
      setMobileMenuOpen(false);
      if (action.startsWith('#')) {
          const element = document.querySelector(action);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
          }
      } else if (onNavigate) {
          onNavigate(action);
      }
  };

  const features = [
    {
      icon: <CheckCircleIcon />,
      title: "إدارة شاملة وموحدة",
      desc: "نظام ERP متكامل يجمع كل أقسام شركتك في مكان واحد: المبيعات، المخزون، الحسابات، والموارد البشرية."
    },
    {
      icon: <BrainIcon />,
      title: "ذكاء اصطناعي متطور",
      desc: "مساعد ذكي يحلل بياناتك لحظياً، يتوقع الطلب، ويقدم توصيات استراتيجية لزيادة الربحية وتقليل التكاليف."
    },
    {
      icon: <GlobeAltIcon />,
      title: "سحابي وآمن 100%",
      desc: "وصول آمن لبياناتك من أي جهاز وفي أي وقت، مع تشفير متقدم ونسخ احتياطي تلقائي لضمان سلامة أعمالك."
    }
  ];

  const modules = [
    {
      icon: <ChartBarIcon />,
      title: "نقاط البيع (POS)",
      desc: "واجهة بيع سريعة، تدعم الباركود والفاتورة الإلكترونية، وتعمل حتى مع انقطاع الإنترنت.",
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      icon: <CubeIcon />,
      title: "إدارة المخزون",
      desc: "تتبع دقيق للكميات، تنبيهات النواقص، وإدارة الموردين وأوامر الشراء بذكاء.",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      icon: <BanknotesIcon />,
      title: "الحسابات العامة",
      desc: "قيود يومية، ميزانية عمومية، وتقارير الأرباح والخسائر محدثة لحظياً.",
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      icon: <UsersIcon />,
      title: "الموارد البشرية",
      desc: "ملفات الموظفين، الرواتب، الحضور والانصراف، والسلف والإجازات.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      icon: <GlobeAltIcon />,
      title: "المتجر الإلكتروني",
      desc: "أنشئ متجرك الإلكتروني بدقائق واربطه تلقائياً بالمخزون لبيع منتجاتك أونلاين.",
      color: "bg-pink-50 text-pink-600 border-pink-100"
    },
    {
      icon: <ChatBubbleLeftRightIcon />,
      title: "خدمة العملاء AI",
      desc: "بوت ذكي للرد على العملاء عبر واتساب، تحليل المشاعر، وإدارة التذاكر.",
      color: "bg-cyan-50 text-cyan-600 border-cyan-100"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-right text-slate-800 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900" dir="rtl">
      
      {/* --- Navbar --- */}
      <nav 
        className={`fixed w-full z-50 top-0 transition-all duration-300 ${
          scrolled || mobileMenuOpen ? 'bg-white/90 backdrop-blur-lg shadow-sm py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="transform group-hover:rotate-12 transition-transform duration-300">
                <NebrasLogo />
            </div>
            <span className={`text-2xl font-bold tracking-tight transition-colors ${scrolled || mobileMenuOpen ? 'text-slate-900' : 'text-white'}`}>
              مزاد بلس
            </span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => handleNavClick('#features')} className={`text-sm font-medium hover:text-indigo-500 transition-colors ${scrolled ? 'text-slate-600' : 'text-slate-200 hover:text-white'}`}>المميزات</button>
            <button onClick={() => handleNavClick('#modules')} className={`text-sm font-medium hover:text-indigo-500 transition-colors ${scrolled ? 'text-slate-600' : 'text-slate-200 hover:text-white'}`}>الحلول</button>
            <button onClick={() => handleNavClick('about')} className={`text-sm font-medium hover:text-indigo-500 transition-colors ${scrolled ? 'text-slate-600' : 'text-slate-200 hover:text-white'}`}>عن الشركة</button>
            
            <button 
              onClick={onNavigateToLogin}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-lg ${
                scrolled 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30' 
                : 'bg-white text-indigo-900 hover:bg-indigo-50 hover:shadow-white/20'
              }`}
            >
              دخول النظام
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled || mobileMenuOpen ? 'text-slate-800' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col p-4 space-y-2">
            <button onClick={() => handleNavClick('#features')} className="block px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg font-medium text-right">المميزات</button>
            <button onClick={() => handleNavClick('#modules')} className="block px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg font-medium text-right">الحلول</button>
            <button onClick={() => handleNavClick('about')} className="block px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg font-medium text-right">عن الشركة</button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button 
              onClick={() => { onNavigateToLogin(); setMobileMenuOpen(false); }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
            >
              دخول النظام
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#0f172a] text-white overflow-hidden">
        {/* Advanced Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            <div className="lg:w-1/2 text-center lg:text-right space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm animate-fade-in-up">
                <SparklesIcon />
                <span className="text-sm font-semibold text-indigo-300">الجيل الجديد من أنظمة الإدارة</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight drop-shadow-2xl">
                أدر أعمالك بذكاء<br />
                مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">مزاد بلس</span>
              </h1>
              
              <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                حلول أعمال متكاملة لشركتك. يجمع "مزاد بلس" بين سهولة الاستخدام وقوة الذكاء الاصطناعي لمساعدتك على النمو والتوسع بثقة.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button 
                  onClick={onNavigateToLogin}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 group"
                >
                  <span>جرب النظام مجاناً</span>
                  <ArrowPathRoundedSquareIcon />
                </button>
                <a 
                  href="https://wa.me/201508755174" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-3 group"
                >
                  <svg className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c1.005.572 1.913.846 3.037.843 3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.999-5.771zm-5.768 5.766c0-1.575.74-2.967 1.9-3.895l.482 2.16-1.512 1.195c-.37.292-.37.765-.002 1.059l.002.002c.768.612 2.09 1.671 3.666 2.14.464.139.963.069 1.297-.264l1.109-1.109 2.207.456c-1.026 1.292-2.546 2.165-4.268 2.165-3.007 0-5.447-2.44-5.447-5.447 0-.154.007-.307.02-.458l.546-.004zm5.768 3.662c-.928 0-1.809-.247-2.583-.679l-1.63.429.437-1.596c-.489-.836-.77-1.826-.769-2.877 0-2.935 2.389-5.323 5.324-5.324 2.933.001 5.321 2.39 5.321 5.324 0 2.935-2.388 5.323-5.323 5.323z"/></svg>
                  <span>تواصل معنا</span>
                </a>
              </div>
              
              <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2"><CheckCircleIcon /> <span>تجربة مجانية 14 يوم</span></div>
                <div className="flex items-center gap-2"><CheckCircleIcon /> <span>لا يحتاج بطاقة ائتمان</span></div>
                <div className="flex items-center gap-2"><CheckCircleIcon /> <span>دعم فني 24/7</span></div>
              </div>
            </div>

            <div className="lg:w-1/2 relative mt-12 lg:mt-0 perspective-1000">
                {/* Dashboard Mockup with 3D effect */}
                <div className="relative z-10 transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-500 hover:rotate-0 hover:scale-105">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                    <img 
                        src={dashboardImage} 
                        alt="لوحة تحكم مزاد بلس" 
                        className="relative rounded-xl shadow-2xl border border-slate-700/50 w-full object-cover"
                    />
                    {/* Floating Elements */}
                    <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl animate-float hidden md:block">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><ChartBarIcon /></div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold">المبيعات اليوم</p>
                                <p className="text-lg font-bold text-gray-800">+4,250 ج.م</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-8 -left-4 bg-white p-4 rounded-xl shadow-xl animate-float animation-delay-2000 hidden md:block">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><UsersIcon /></div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold">عملاء جدد</p>
                                <p className="text-lg font-bold text-gray-800">+12 عميل</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </header>

      {/* --- Features Section --- */}
      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-base font-bold text-indigo-600 uppercase tracking-wider mb-2">لماذا مزاد بلس؟</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">كل ما تحتاجه للنمو في منصة واحدة</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              تخلص من الأنظمة المتعددة والتعقيدات. صممنا مزاد بلس ليكون الحل الشامل الذي يجمع قوة الأداء مع بساطة الاستخدام.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feat, idx) => (
              <div key={idx} className="group relative p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-transparent rounded-tr-3xl rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 text-3xl mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {feat.icon}
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{feat.title}</h4>
                    <p className="text-slate-600 leading-relaxed">
                    {feat.desc}
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Modules Grid --- */}
      <section id="modules" className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-base font-bold text-indigo-600 uppercase tracking-wider mb-2">حلول متكاملة</h2>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">نظام ينمو مع نمو أعمالك</h3>
              <p className="text-slate-600 text-lg">اختر الوحدات التي تحتاجها الآن، وأضف المزيد لاحقاً. نظام مرن يناسب كافة أنواع المتاجر والشركات.</p>
            </div>
            <button onClick={onNavigateToLogin} className="group flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition bg-white px-6 py-3 rounded-xl shadow-sm hover:shadow-md">
              <span>استكشف جميع المديولات</span>
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => (
              <div key={idx} className={`bg-white p-8 rounded-3xl shadow-sm border ${mod.color} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}>
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${mod.color.split(' ')[0]} ${mod.color.split(' ')[1]}`}>
                    {mod.icon}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{mod.title}</h3>
                <p className="text-slate-500 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[100px]"></div>
             <div className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] bg-indigo-500/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
            جاهز لنقل تجارتك للمستوى التالي؟
          </h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            انضم إلى مئات الشركات التي تعتمد على مزاد بلس يومياً لإدارة عملياتها بكفاءة وذكاء. ابدأ رحلتك الآن.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              onClick={onNavigateToLogin}
              className="px-10 py-5 bg-white text-indigo-900 rounded-2xl font-bold text-xl hover:bg-indigo-50 transition shadow-2xl shadow-white/10 transform hover:-translate-y-1"
            >
              ابدأ تجربتك المجانية
            </button>
            <a 
              href="https://wa.me/201508755174" 
              target="_blank" 
              rel="noreferrer"
              className="px-10 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl font-bold text-xl hover:bg-white/10 transition flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c1.005.572 1.913.846 3.037.843 3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.999-5.771zm-5.768 5.766c0-1.575.74-2.967 1.9-3.895l.482 2.16-1.512 1.195c-.37.292-.37.765-.002 1.059l.002.002c.768.612 2.09 1.671 3.666 2.14.464.139.963.069 1.297-.264l1.109-1.109 2.207.456c-1.026 1.292-2.546 2.165-4.268 2.165-3.007 0-5.447-2.44-5.447-5.447 0-.154.007-.307.02-.458l.546-.004zm5.768 3.662c-.928 0-1.809-.247-2.583-.679l-1.63.429.437-1.596c-.489-.836-.77-1.826-.769-2.877 0-2.935 2.389-5.323 5.324-5.324 2.933.001 5.321 2.39 5.321 5.324 0 2.935-2.388 5.323-5.323 5.323z"/></svg>
              تحدث مع المبيعات
            </a>
          </div>
          <p className="mt-8 text-indigo-300 text-sm opacity-80">لا يتطلب بطاقة ائتمان • إلغاء في أي وقت</p>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
               <div className="flex items-center gap-3">
                  <div className="bg-white/5 p-2.5 rounded-xl">
                     <NebrasLogo />
                  </div>
                  <span className="text-white text-2xl font-bold tracking-wider">مزاد بلس</span>
               </div>
               <p className="text-sm max-w-xs text-center md:text-right leading-relaxed">
                 نظام ERP سحابي متكامل يهدف لتمكين الشركات الصغيرة والمتوسطة من النمو بأحدث تقنيات الذكاء الاصطناعي.
               </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end space-y-4">
              <div className="flex gap-6 text-sm font-medium text-slate-300">
                  <button onClick={() => handleNavClick('about')} className="hover:text-white transition">عن الشركة</button>
                  <button onClick={() => handleNavClick('privacy')} className="hover:text-white transition">سياسة الخصوصية</button>
                  <button onClick={() => handleNavClick('terms')} className="hover:text-white transition">الشروط والأحكام</button>
              </div>
              
              <a href="https://wa.me/201508755174" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition border border-slate-800">
                <div className="text-right">
                    <p className="text-xs text-slate-500">الدعم والمبيعات</p>
                    <p className="text-indigo-400 font-mono font-bold" dir="ltr">+20 150 875 5174</p>
                </div>
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c1.005.572 1.913.846 3.037.843 3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.999-5.771zm-5.768 5.766c0-1.575.74-2.967 1.9-3.895l.482 2.16-1.512 1.195c-.37.292-.37.765-.002 1.059l.002.002c.768.612 2.09 1.671 3.666 2.14.464.139.963.069 1.297-.264l1.109-1.109 2.207.456c-1.026 1.292-2.546 2.165-4.268 2.165-3.007 0-5.447-2.44-5.447-5.447 0-.154.007-.307.02-.458l.546-.004zm5.768 3.662c-.928 0-1.809-.247-2.583-.679l-1.63.429.437-1.596c-.489-.836-.77-1.826-.769-2.877 0-2.935 2.389-5.323 5.324-5.324 2.933.001 5.321 2.39 5.321 5.324 0 2.935-2.388 5.323-5.323 5.323z"/></svg>
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-900 mt-10 pt-6 text-center text-xs text-slate-600">
            جميع الحقوق محفوظة © {new Date().getFullYear()} شركة مزاد بلس للبرمجيات.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
