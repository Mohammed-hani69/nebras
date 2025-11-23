
import React from 'react';
import { 
  NebrasLogo, 
  ChartBarIcon, 
  CubeIcon, 
  UsersIcon, 
  BanknotesIcon, 
  GlobeAltIcon, 
  BrainIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon
} from './icons/Icons';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const features = [
    {
      icon: <CheckCircleIcon />,
      title: "إدارة متكاملة",
      desc: "تحكم في كافة جوانب عملك من مبيعات، مخزون، حسابات، وموارد بشرية من منصة واحدة."
    },
    {
      icon: <BrainIcon />,
      title: "ذكاء اصطناعي",
      desc: "مساعد ذكي يحلل بياناتك، يقدم التوصيات، ويساعدك في اتخاذ القرارات الصائبة."
    },
    {
      icon: <GlobeAltIcon />,
      title: "سحابي وآمن",
      desc: "الوصول لبياناتك من أي مكان وفي أي وقت، مع نسخ احتياطي تلقائي وحماية عالية."
    }
  ];

  const modules = [
    {
      icon: <ChartBarIcon />,
      title: "نقاط البيع (POS)",
      desc: "واجهة بيع سريعة وسهلة تدعم الباركود والفواتير الضريبية والتقسيط."
    },
    {
      icon: <CubeIcon />,
      title: "إدارة المخزون",
      desc: "تتبع دقيق للمنتجات، التنبيه عند نقص الكميات، وإدارة الموردين."
    },
    {
      icon: <BanknotesIcon />,
      title: "الحسابات والمالية",
      desc: "دفتر أستاذ عام، إدارة المصروفات، وتقارير الربح والخسارة والتدفق النقدي."
    },
    {
      icon: <UsersIcon />,
      title: "الموارد البشرية",
      desc: "إدارة الموظفين، الرواتب، الحضور والانصراف، والسلف بمرونة تامة."
    },
    {
      icon: <GlobeAltIcon />,
      title: "المتجر الإلكتروني",
      desc: "أنشئ متجرك الإلكتروني الخاص واربطه بالمخزون مباشرة لزيادة مبيعاتك."
    },
    {
      icon: <ChatBubbleLeftRightIcon />,
      title: "خدمة العملاء الذكية",
      desc: "ربط مع واتساب، تحليل مشاعر العملاء، وردود آلية ذكية."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-right" dir="rtl">
      
      {/* --- Hero Section --- */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10 flex flex-col items-center text-center">
          <div className="bg-white/10 p-6 rounded-full shadow-2xl backdrop-blur-md border border-white/10 mb-8 transform hover:scale-105 transition-transform duration-500">
             <div className="transform scale-150 text-white">
                <NebrasLogo />
             </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
            متجر نبراس الإلكتروني
          </h1>
          <p className="text-lg md:text-2xl text-indigo-100 max-w-3xl mb-10 leading-relaxed">
            نظام ERP سحابي متكامل يجمع بين قوة الإدارة وذكاء التحليل. <br className="hidden md:block" />
            الحل الأمثل لإدارة المبيعات، المخزون، الحسابات، والموظفين في مكان واحد.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={onNavigateToLogin}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
            >
              تسجيل الدخول للنظام
            </button>
            <a 
              href="https://wa.me/201508755174" 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>تواصل معنا واتساب</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          </div>
        </div>
        
        {/* Wave SVG */}
        <div className="absolute bottom-0 w-full">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
        </div>
      </div>

      {/* --- Features / Why Us --- */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">لماذا تختار نظام نبراس؟</h2>
            <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feat, idx) => (
              <div key={idx} className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 text-center group">
                <div className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center text-3xl shadow-sm mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feat.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Modules Grid --- */}
      <div className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">ماذا يقدم النظام؟</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">مجموعة متكاملة من الأدوات والمديولات المصممة لتغطية كافة احتياجات نشاطك التجاري.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-300 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-2xl">
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{mod.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="bg-white/10 p-2 rounded-full">
                  <NebrasLogo />
               </div>
               <span className="text-white text-xl font-bold">نبراس</span>
            </div>
            
            <div className="text-center md:text-left text-sm">
              <p className="mb-2">جميع الحقوق محفوظة © {new Date().getFullYear()} نظام نبراس.</p>
              <p>تواصل معنا: <span dir="ltr">+20 150 875 5174</span></p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
