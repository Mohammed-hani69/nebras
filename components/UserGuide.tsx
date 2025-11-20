import React from 'react';
import { userGuideData, generalIntro } from '../data/userGuideData';

interface UserGuideProps {
    enabledModules: string[];
}

const UserGuide: React.FC<UserGuideProps> = ({ enabledModules }) => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800">دليل مستخدم نظام نبراس</h1>
                <p className="mt-2 text-lg text-gray-600">مرجعك الشامل لفهم واستغلال كل إمكانيات النظام.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2">مقدمة عن نظام نبراس</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{generalIntro}</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">شروحات الوحدات (Modules)</h2>
                {userGuideData
                    .filter(module => enabledModules.includes(module.id))
                    .map((moduleData) => (
                    <details key={moduleData.id} className="bg-white rounded-xl shadow-lg overflow-hidden group">
                        <summary className="p-5 flex justify-between items-center cursor-pointer list-none bg-gray-50 group-hover:bg-gray-100 transition">
                            <h3 className="text-xl font-bold text-gray-800">{moduleData.title}</h3>
                            <span className="transform transition-transform duration-300 group-open:rotate-180">▼</span>
                        </summary>
                        <div className="p-6 border-t border-gray-200">
                            <div className="prose max-w-none text-gray-700">
                                <h4 className="font-bold text-indigo-600">الغرض من الوحدة:</h4>
                                <p>{moduleData.purpose}</p>

                                {moduleData.elements && (
                                    <>
                                        <h4 className="font-bold text-indigo-600 mt-4">شرح العناصر الرئيسية:</h4>
                                        <ul>
                                            {moduleData.elements.map((el, index) => (
                                                <li key={index}><strong>{el.name}:</strong> {el.description}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {moduleData.terms && (
                                     <>
                                        <h4 className="font-bold text-indigo-600 mt-4">مصطلحات هامة:</h4>
                                        <ul>
                                            {moduleData.terms.map((term, index) => (
                                                <li key={index}><strong>{term.name}:</strong> {term.definition}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {moduleData.howTo && (
                                     <>
                                        <h4 className="font-bold text-indigo-600 mt-4">كيفية الاستخدام:</h4>
                                        <ol>
                                            {moduleData.howTo.map((step, index) => (
                                                <li key={index}>{step}</li>
                                            ))}
                                        </ol>
                                    </>
                                )}
                            </div>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};

export default UserGuide;
