
import React from 'react';
import { NebrasLogo, DocumentTextIcon } from './icons/Icons';

interface TermsProps {
    onBack: () => void;
}

const TermsAndConditions: React.FC<TermsProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-right" dir="rtl">
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
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <DocumentTextIcon />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">الشروط والأحكام</h1>
                    </div>

                    <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
                        <p className="lead text-lg">
                            مرحباً بك في "مزاد بلس". باستعراضك أو استخدامك لهذا النظام، فإنك تقر بموافقتك الكاملة على الالتزام بالشروط والأحكام التالية. يرجى قراءتها بعناية.
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">1. تعريف الخدمة</h2>
                            <p>
                                "مزاد بلس" هو نظام تخطيط موارد المؤسسات (ERP) سحابي، يقدم خدمات إدارة المخزون، المبيعات، الحسابات، والموارد البشرية للشركات والمتاجر عبر الإنترنت (SaaS).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">2. الحساب والاشتراك</h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li>يجب عليك تقديم معلومات دقيقة وكاملة عند التسجيل.</li>
                                <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور.</li>
                                <li>يتم تجديد الاشتراكات تلقائياً وفقاً للباقة المختارة (شهرية/سنوية) ما لم يتم الإلغاء قبل موعد التجديد.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">3. الاستخدام المقبول</h2>
                            <p>يمنع استخدام النظام في أي من الأغراض التالية:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>أي نشاط غير قانوني أو احتيالي.</li>
                                <li>محاولة اختراق النظام أو الهندسة العكسية للكود المصدري.</li>
                                <li>بيع أو تأجير حسابك لطرف ثالث دون موافقة خطية منا.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">4. حقوق الملكية الفكرية</h2>
                            <p>
                                جميع الحقوق والملكية والمصالح في النظام (بما في ذلك البرمجيات، التصاميم، الشعارات، والخوارزميات) هي ملكية حصرية لشركة "مزاد بلس". تظل البيانات التي تدخلها ملكاً لك.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">5. حدود المسؤولية</h2>
                            <p>
                                يتم تقديم الخدمة "كما هي". لا تتحمل "مزاد بلس" المسؤولية عن أي خسائر غير مباشرة أو عرضية (مثل فقدان الأرباح أو البيانات) ناتجة عن استخدامك أو عدم قدرتك على استخدام الخدمة، إلا في حدود ما يفرضه القانون.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">6. إنهاء الخدمة</h2>
                            <p>
                                يحق لنا تعليق أو إنهاء حسابك فوراً في حالة انتهاك هذه الشروط. يمكنك إلغاء اشتراكك في أي وقت، وسيظل الوصول متاحاً حتى نهاية فترة الفوترة الحالية.
                            </p>
                        </section>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                للمزيد من المعلومات القانونية، يرجى التواصل مع القسم القانوني: <a href="mailto:legal@mazad-plus.com" className="text-indigo-600 hover:underline">legal@mazad-plus.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditions;
