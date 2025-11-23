
import React from 'react';
import { NebrasLogo, ShieldCheckIcon } from './icons/Icons';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-right" dir="rtl">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
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

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <ShieldCheckIcon />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">سياسة الخصوصية</h1>
                    </div>

                    <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
                        <p className="lead text-lg">
                            في "مزاد بلس"، ندرك أهمية خصوصية بياناتك وبيانات عملائك. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات عند استخدامك لنظامنا السحابي لإدارة الموارد (ERP).
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">1. المعلومات التي نجمعها</h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف، واسم الشركة عند التسجيل.</li>
                                <li><strong>بيانات الأعمال:</strong> المنتجات، المبيعات، المخزون، بيانات الموظفين، وبيانات العملاء التي تقوم بإدخالها في النظام.</li>
                                <li><strong>بيانات الاستخدام:</strong> معلومات حول كيفية تفاعلك مع الخدمات، السجلات التقنية (Logs)، وعنوان IP لأغراض الأمان.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">2. كيف نستخدم معلوماتك</h2>
                            <p>نستخدم البيانات للأغراض التالية:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>تقديم وتشغيل وصيانة خدماتنا.</li>
                                <li>تحسين وتخصيص تجربتك وتطوير ميزات جديدة.</li>
                                <li>تقديم تحليلات الذكاء الاصطناعي (مثل التنبؤ بالمبيعات) بناءً على بياناتك الخاصة فقط.</li>
                                <li>إرسال إشعارات فنية، تحديثات أمنية، ورسائل إدارية.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">3. حماية البيانات والأمان</h2>
                            <p>
                                نحن نطبق إجراءات أمنية تقنية وتنظيمية متقدمة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف. تشمل هذه الإجراءات التشفير (SSL/TLS) أثناء النقل، والتشفير أثناء التخزين، والنسخ الاحتياطي الدوري.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">4. مشاركة المعلومات</h2>
                            <p>
                                <strong>نحن لا نبيع بياناتك لأطراف ثالثة.</strong> قد نشارك المعلومات فقط في الحالات التالية:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>مع مزودي الخدمة الموثوقين (مثل خدمات الاستضافة السحابية) الذين يعملون نيابة عنا وبموجب التزامات سرية صارمة.</li>
                                <li>للامتثال للقوانين السارية أو الإجراءات القانونية.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">5. الذكاء الاصطناعي وتحليل البيانات</h2>
                            <p>
                                يستخدم النظام نماذج ذكاء اصطناعي لتقديم توصيات. يتم معالجة بياناتك بطريقة آمنة لتقديم هذه الرؤى لك حصراً. لا يتم استخدام بياناتك الحساسة لتدريب نماذج عامة يتم مشاركتها مع مستخدمين آخرين.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">6. التغييرات على هذه السياسة</h2>
                            <p>
                                قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل النظام.
                            </p>
                        </section>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                آخر تحديث: 24 مايو 2024 <br />
                                إذا كان لديك أي أسئلة، يرجى التواصل معنا عبر <a href="mailto:support@mazad-plus.com" className="text-indigo-600 hover:underline">support@mazad-plus.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
