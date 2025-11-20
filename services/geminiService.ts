
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Store, AISettings, Lead, Customer } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAiInsight = async (query: string, store: Store, aiSettings: AISettings): Promise<string> => {
  try {
    const { products, sales, services, expenses } = store;
    const simplifiedProducts = products.map(p => {
        const sold = sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0);
        return {
            id: p.id,
            name: p.name,
            category: p.category,
            sellPrice: p.sellPrice,
            quantityAvailable: p.initialQuantity - sold,
        };
    });

    const prompt = `
      أنت محلل بيانات خبير ومساعد ذكي في محل لبيع وإصلاح الموبايلات.
      مهمتك هي تحليل البيانات التالية وتقديم إجابات ورؤى مفيدة باللغة العربية.
      كن موجزًا ومباشرًا في إجابتك.
      تاريخ اليوم هو: ${new Date().toLocaleDateString('ar-EG')}

      تعليمات النظام العامة: ${aiSettings.systemInstructions || 'لا توجد تعليمات عامة.'}
      تعليمات خاصة بهذا المتجر: ${store.aiInstructions || 'لا توجد تعليمات خاصة.'}

      البيانات الحية المحدثة:
      1. المنتجات في المخزون (الكميات الحالية): ${JSON.stringify(simplifiedProducts, null, 2)}
      2. سجل المبيعات: ${JSON.stringify(sales, null, 2)}
      3. سجل خدمات الصيانة: ${JSON.stringify(services, null, 2)}
      4. سجل المصروفات: ${JSON.stringify(expenses, null, 2)}

      سؤال المستخدم: "${query}"

      الرجاء تقديم إجابة دقيقة بناءً على البيانات المحدثة أعلاه.
    `;

    const response = await ai.models.generateContent({
      model: aiSettings.model,
      contents: prompt,
      config: {
          temperature: aiSettings.temperature,
          topK: aiSettings.topK,
          topP: aiSettings.topP,
      }
    });
    
    return response.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from Gemini API.");
  }
};


export const getAiSuggestions = async (store: Store, allModules: {id: string, label: string}[], aiSettings: AISettings): Promise<string[]> => {
    try {
        const disabledModules = allModules.filter(m => !store.enabledModules.includes(m.id) && m.id !== 'ai-messages');
        
        const lowStockProducts = store.products
            .map(p => {
                const sold = store.sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0);
                return { name: p.name, available: p.initialQuantity - sold };
            })
            .filter(p => p.available <= 3);

        const prompt = `
            أنت مستشار أعمال خبير لنظام إدارة محلات الموبايلات.
            مهمتك هي تحليل بيانات المتجر التالية وتقديم 3 إلى 5 اقتراحات قصيرة ومفيدة وقابلة للتنفيذ لمساعدة صاحب المتجر على تحسين أعماله.
            يجب أن تكون الاقتراحات باللغة العربية وبأسلوب مشجع ومحفز.

            تعليمات النظام العامة: ${aiSettings.systemInstructions || 'لا توجد تعليمات عامة.'}
            تعليمات خاصة بهذا المتجر: ${store.aiInstructions || 'لا توجد تعليمات خاصة.'}

            بيانات المتجر الحية للتحليل:
            - اسم المتجر: ${store.name}
            - الوحدات (الميزات) المفعلة حالياً: ${store.enabledModules.map(id => allModules.find(m=>m.id === id)?.label).filter(Boolean).join(', ')}
            - الوحدات المتاحة وغير المفعلة: ${disabledModules.map(m => m.label).join(', ') || 'لا يوجد'}
            - منتجات على وشك النفاذ (الكمية 3 أو أقل): ${lowStockProducts.length > 0 ? lowStockProducts.map(p => p.name).join(', ') : 'لا يوجد'}
            - ملخص المبيعات الأخير: تم تسجيل ${store.sales.length} عملية بيع.
            - ملخص الخدمات الأخير: تم تقديم ${store.services.length} خدمة صيانة.

            يرجى تقديم ردك بصيغة JSON فقط، على شكل كائن يحتوي على مفتاح واحد "suggestions"، وقيمته هي مصفوفة من السلاسل النصية (string array) تحتوي على الاقتراحات.
            `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: aiSettings.temperature,
                topK: aiSettings.topK,
                topP: aiSettings.topP,
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.suggestions || [];

    } catch (error) {
        console.error("Gemini API suggestions error:", error);
        return [];
    }
};

export const getAiGeneralReportAnalysis = async (summaryData: any, aiSettings: AISettings): Promise<string> => {
    try {
        const prompt = `
          أنت محلل أعمال خبير، ومهمتك هي تحليل ملخص البيانات التالي لمتجر موبايلات وتقديم رؤى عملية وقابلة للتنفيذ باللغة العربية.

          تعليمات النظام العامة: ${aiSettings.systemInstructions || 'لا توجد تعليمات عامة.'}
          
          البيانات للتحليل (للفترة الزمنية المحددة):
          - مؤشرات الأداء الرئيسية: ${JSON.stringify(summaryData.kpis, null, 2)}
          - أفضل 5 منتجات مبيعًا: ${JSON.stringify(summaryData.topProducts, null, 2)}

          المطلوب:
          قدم تحليلاً موجزاً (3-4 فقرات) يغطي النقاط التالية:
          1.  تقييم عام للأداء: هل الأداء جيد أم ضعيف بناءً على صافي الربح مقارنة بالإيرادات والمصروفات؟
          2.  نقاط القوة: ما هي أبرز مصادر الإيراد؟ هل هي مبيعات المنتجات أم خدمات الصيانة؟
          3.  فرص للتحسين: بناءً على أفضل المنتجات مبيعًا، هل هناك فرص لعمل عروض أو زيادة المخزون منها؟ هل هناك أي مؤشرات ضعف في البيانات يمكن معالجتها؟
          4.  نصيحة عملية واحدة: قدم نصيحة واضحة ومحددة يمكن لصاحب المتجر تطبيقها مباشرة لتحسين الأرباح أو تقليل التكاليف.

          اجعل التحليل احترافيًا وسهل الفهم، وقم بتنسيقه باستخدام Markdown.
        `;
        const response = await ai.models.generateContent({
          model: aiSettings.model,
          contents: prompt,
          config: {
            temperature: aiSettings.temperature,
            topK: aiSettings.topK,
            topP: aiSettings.topP,
          }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (General Report):", error);
        return "عذرًا، حدث خطأ أثناء محاولة تحليل البيانات. يرجى المحاولة مرة أخرى.";
    }
};

export const generateModuleDescription = async (moduleLabel: string, aiSettings: AISettings): Promise<{ short: string, long: string }> => {
    try {
        const prompt = `
            أنت خبير تسويق رقمي متخصص في أنظمة تخطيط موارد المؤسسات (ERP).
            لديك موديول (وحدة) في النظام باسم: "${moduleLabel}".
            
            المطلوب منك توليد وصفين لهذا الموديول لبيعه في "سوق التطبيقات":
            1. وصف قصير (Short Description): جملة واحدة جذابة وتسويقية تشرح الفائدة الأساسية (مثل tagline).
            2. وصف طويل (Long Description): فقرة مفصلة (حوالي 3-4 جمل) تشرح المميزات، كيف يساعد الموديول صاحب المتجر، ولماذا يجب عليه تفعيله.
            
            تعليمات النظام: ${aiSettings.systemInstructions || ''}
            
            يجب أن يكون الرد بصيغة JSON فقط:
            {
                "short": "الوصف القصير هنا",
                "long": "الوصف الطويل هنا"
            }
        `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Gemini API Module Description Error:", error);
        return { short: "وصف غير متوفر", long: "عذرًا، لم نتمكن من توليد الوصف تلقائيًا." };
    }
}

export const generateNotificationMessage = async (topic: string, tone: string, aiSettings: AISettings): Promise<string> => {
    try {
        const prompt = `
            أنت مساعد ذكي لمدير نظام "نبراس".
            المطلوب: صياغة رسالة تنبيه أو إشعار قصيرة ومحترفة لإرسالها إلى أصحاب المتاجر.
            
            الموضوع: ${topic}
            النبرة (Tone): ${tone}
            
            تعليمات النظام: ${aiSettings.systemInstructions || ''}

            يجب أن تكون الرسالة باللغة العربية، واضحة، ومباشرة. لا تزد عن جملتين أو ثلاثة.
            لا تضع أي مقدمات أو نصوص إضافية، فقط نص الرسالة.
        `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                temperature: aiSettings.temperature,
                topK: aiSettings.topK,
                topP: aiSettings.topP,
            }
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Notification Error:", error);
        return "عذرًا، حدث خطأ أثناء توليد الرسالة.";
    }
}

// --- Super Admin AI Functions ---

// Tool Definitions
const superAdminTools: FunctionDeclaration[] = [
    {
        name: "create_store",
        description: "تسجيل متجر جديد في النظام. استخدم هذا عندما يطلب المستخدم إنشاء متجر.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "اسم المتجر" },
                ownerName: { type: Type.STRING, description: "اسم المالك" },
                ownerPhone: { type: Type.STRING, description: "رقم هاتف المالك" },
                storeType: { type: Type.STRING, description: "نوع نشاط المتجر (مثال: موبايلات، ملابس)" },
                subscriptionPrice: { type: Type.NUMBER, description: "سعر الاشتراك الشهري" },
                adminUsername: { type: Type.STRING, description: "اسم المستخدم لمدير المتجر" }
            },
            required: ["name", "ownerName", "ownerPhone"]
        }
    },
    {
        name: "navigate_to",
        description: "تغيير الصفحة المعروضة في لوحة التحكم.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                view: { 
                    type: Type.STRING, 
                    description: "اسم الصفحة (management, profits, analysis, ai-settings, marketplace-settings)",
                    enum: ["management", "profits", "analysis", "ai-settings", "marketplace-settings"]
                }
            },
            required: ["view"]
        }
    },
    {
        name: "send_broadcast",
        description: "إرسال رسالة عامة لجميع المتاجر.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                message: { type: Type.STRING, description: "نص الرسالة المراد إرسالها" }
            },
            required: ["message"]
        }
    }
];

export const processSuperAdminIntent = async (
    message: string, 
    stores: Store[], 
    aiSettings: AISettings
): Promise<{ text?: string, toolCall?: any }> => {
    try {
        const storesSummary = stores.map(s => `${s.name} (${s.storeType})`).join(', ');

        const prompt = `
            أنت المساعد الشخصي الذكي للسوبر أدمن (مدير النظام) لنظام "نبراس".
            لديك صلاحيات كاملة لإدارة النظام عبر استدعاء الوظائف (Tools).
            
            معلومات السياق الحالية:
            - عدد المتاجر المسجلة: ${stores.length}
            - قائمة المتاجر: ${storesSummary}
            - التاريخ: ${new Date().toLocaleDateString('ar-EG')}

            تعليمات:
            - إذا طلب المستخدم إجراءً (مثل إنشاء متجر، الانتقال لصفحة، إرسال رسالة)، استخدم الأداة المناسبة (Function Call).
            - إذا كان السؤال استفساراً عاماً، أجب عليه بناءً على السياق.
            - تحدث بلهجة احترافية وودودة باللغة العربية.
            
            طلب المستخدم: "${message}"
        `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                temperature: 0.1, // Lower temperature for precise tool calling
                tools: [{ functionDeclarations: superAdminTools }]
            }
        });
        
        // Check for tool calls
        const functionCalls = response.functionCalls;
        
        if (functionCalls && functionCalls.length > 0) {
            return { toolCall: functionCalls[0] };
        }

        return { text: response.text };

    } catch (error) {
        console.error("Gemini Super Admin Chat Error:", error);
        return { text: "عذرًا، حدث خطأ أثناء معالجة طلبك." };
    }
};

// --- CRM AI Functions ---

export const analyzeLeadPotential = async (lead: Lead, aiSettings: AISettings): Promise<{ score: number; note: string; action: string }> => {
    try {
        const interactionsText = lead.interactions.map(i => `${i.date} (${i.type}): ${i.summary} [outcome: ${i.outcome || 'N/A'}]`).join('\n');
        
        const prompt = `
            أنت خبير مبيعات و CRM. حلل بيانات العميل المحتمل (Lead) التالية وتوقع احتمالية إغلاق الصفقة (البيع).
            
            بيانات العميل:
            الاسم: ${lead.name}
            المرحلة الحالية: ${lead.status}
            قيمة الصفقة المتوقعة: ${lead.potentialValue}
            تاريخ الإنشاء: ${lead.createdAt}
            
            سجل التفاعلات:
            ${interactionsText || 'لا يوجد تفاعلات مسجلة بعد.'}
            
            المطلوب (JSON only):
            1. score: رقم من 0 إلى 100 يمثل نسبة احتمالية النجاح.
            2. note: تعليل قصير جداً (جملة واحدة) للنسبة.
            3. action: اقتراح الخطوة التالية الأفضل (Next Best Action).
        `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.3, // Low temp for analytical tasks
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini CRM Analysis Error:", error);
        return { score: 0, note: "فشل التحليل", action: "مراجعة يدوية" };
    }
};

export const classifyCustomer = async (customer: Customer, totalSpent: number, transactionCount: number, aiSettings: AISettings): Promise<string> => {
    try {
        const prompt = `
            صنف هذا العميل بناءً على البيانات التالية إلى واحدة من الفئات: (vip, regular, new, at_risk).
            
            البيانات:
            تاريخ الانضمام: ${customer.joinDate}
            إجمالي الإنفاق: ${totalSpent}
            عدد العمليات: ${transactionCount}
            نقاط الولاء: ${customer.loyaltyPoints}
            
            القواعد:
            - vip: إنفاق عالي وتكرار عالي.
            - new: انضم حديثاً (أقل من شهر) وإنفاق قليل.
            - at_risk: لم يشتري منذ فترة طويلة وكان نشطاً سابقاً (يمكنك افتراض ذلك من البيانات المتاحة).
            - regular: غير ذلك.
            
            أعد فقط الكلمة المفتاحية للتصنيف (vip/regular/new/at_risk) بدون أي نص إضافي.
        `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                temperature: 0.1,
            }
        });
        
        return response.text.trim().toLowerCase().replace(/[^a-z_]/g, '');
    } catch (error) {
        return 'regular';
    }
};

export const suggestBestContactTime = async (lead: Lead, aiSettings: AISettings): Promise<string> => {
     try {
        const interactionsText = lead.interactions.map(i => `Date: ${i.date}, Type: ${i.type}`).join('\n');
        const prompt = `
            بناءً على سجل التفاعلات السابق، اقترح أفضل وقت (يوم ووقت تقريبي) للتواصل مع هذا العميل.
            إذا لم توجد بيانات كافية، اقترح وقتاً عاماً مناسباً للأعمال.
            
            السجل:
            ${interactionsText}
            
            الرد بجملة قصيرة جداً (مثال: "الخميس صباحاً" أو "بعد الظهر").
        `;
        
        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
             config: {
                temperature: 0.4,
                maxOutputTokens: 20
            }
        });
        return response.text.trim();
     } catch (error) {
         return "غير محدد";
     }
};

export const analyzeFinancialStatements = async (trialBalance: any[], aiSettings: AISettings): Promise<string> => {
    try {
        const prompt = `
            أنت محاسب قانوني خبير ومحلل مالي. قم بتحليل "ميزان المراجعة" (Trial Balance) التالي لمتجر تجزئة.
            
            البيانات:
            ${JSON.stringify(trialBalance.map(ac => ({ name: ac.accountName, type: ac.accountType, balance: ac.balance })), null, 2)}
            
            المطلوب:
            1. تحليل السيولة: هل يوجد نقدية كافية؟
            2. تحليل الربحية التقريبي (الإيرادات مقابل المصروفات).
            3. اكتشاف الشذوذ: هل هناك حسابات تبدو غير منطقية (مثلاً رصيد نقدية بالسالب، أو مصاريف ضخمة جداً مقارنة بالإيراد)؟
            4. نصائح لتحسين الوضع المالي.
            
            اكتب التقرير بصيغة Markdown باللغة العربية، كن مهنياً ودقيقاً.
        `;

        const response = await ai.models.generateContent({
            model: aiSettings.model,
            contents: prompt,
            config: {
                temperature: 0.4,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Gemini GL Analysis Error:", error);
        return "عذرًا، حدث خطأ أثناء تحليل القوائم المالية.";
    }
};
