
import React from 'react';
import { NebrasLogo, UsersIcon, GlobeAltIcon, SparklesIcon } from './icons/Icons';

interface AboutUsProps {
    onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-white font-sans text-right" dir="rtl">
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <NebrasLogo />
                        <span className="text-xl font-bold text-slate-800">مزاد بلس</span>
                    </div>
                    <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 font-medium transition">
                        ← العودة للرئيسية
                    </button>
                </div>
            </header>

            {/* Hero */}
            <div className="bg-indigo-900 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">تمكين الأعمال للنمو الذكي</h1>
                    <p className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed">
                        نحن في مزاد بلس نؤمن بأن التكنولوجيا المتقدمة لا يجب أن تكون حكراً على الشركات الكبرى. مهمتنا هي وضع قوة الذكاء الاصطناعي بين يديك.
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 relative">
                            من نحن
                            <span className="absolute bottom-[-10px] right-0 w-16 h-1 bg-indigo-600 rounded-full"></span>
                        </h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-4">
                            "مزاد بلس" هي شركة برمجيات رائدة متخصصة في حلول التكنولوجيا المالية وإدارة الموارد (ERP) للشركات الصغيرة والمتوسطة في الشرق الأوسط وشمال أفريقيا.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            تأسست الشركة برؤية واضحة: سد الفجوة بين الأنظمة التقليدية المعقدة واحتياجات السوق المتسارعة، من خلال تقديم نظام سحابي متكامل، سهل الاستخدام، ومدعوم بأحدث تقنيات الذكاء الاصطناعي.
                        </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-8 relative">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-100 rounded-full -z-10"></div>
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-pink-100 rounded-full -z-10"></div>
                        <img src="https://placehold.co/600x400/indigo/white?text=Our+Team" alt="فريق العمل" className="rounded-xl shadow-lg w-full" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <div className="text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition duration-300">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                            <GlobeAltIcon />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">رؤيتنا</h3>
                        <p className="text-gray-600">أن نكون الشريك التكنولوجي الأول لمليون مشروع تجاري في المنطقة، ومساعدتهم على التحول الرقمي الكامل.</p>
                    </div>
                    <div className="text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                            <UsersIcon />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">رسالتنا</h3>
                        <p className="text-gray-600">تبسيط إدارة الأعمال المعقدة وتحويل البيانات إلى قرارات ذكية تزيد من ربحية عملائنا.</p>
                    </div>
                    <div className="text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition duration-300">
                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                            <SparklesIcon />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">قيمنا</h3>
                        <p className="text-gray-600">الابتكار المستمر، الشفافية المطلقة، والتركيز المهووس على نجاح العميل.</p>
                    </div>
                </div>

                <div className="bg-indigo-50 rounded-3xl p-10 md:p-16 text-center">
                    <h2 className="text-3xl font-bold text-indigo-900 mb-6">انضم إلى عائلة مزاد بلس</h2>
                    <p className="text-lg text-indigo-700 max-w-2xl mx-auto mb-8">
                        نحن لا نقدم مجرد برنامج، بل نبني مجتمعاً من رواد الأعمال الناجحين. هل أنت مستعد لتكون جزءاً من القصة؟
                    </p>
                    <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition transform hover:-translate-y-1">
                        ابدأ رحلتك اليوم
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AboutUs;
