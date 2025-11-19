


import { GoogleGenAI, Type } from "@google/genai";
import type { Store, AISettings } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this environment, we assume the key is present.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAiInsight = async (query: string, store: Store, aiSettings: AISettings): Promise<string> => {
  try {
    const { products, sales, services, expenses } = store;
    const simplifiedProducts = products.map(p => {
        // Calculate available quantity dynamically to ensure freshness
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
        
        // Recalculate stock to ensure freshness
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

            أمثلة على الاقتراحات المطلوبة:
            - "هل فكرت في تفعيل وحدة التقارير المالية؟ ستمنحك نظرة شاملة على أرباحك ومصاريفك بضغطة زر!"
            - "ملاحظة سريعة: مخزون '${lowStockProducts[0]?.name || 'منتج معين'}' منخفض. قد يكون الوقت مناسباً لإعادة طلب كمية جديدة!"
            - "لزيادة مبيعاتك، جرب عمل عرض خاص على الإكسسوارات عند شراء أي هاتف جديد."

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

        // The response text is a JSON string, so we need to parse it.
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.suggestions || [];

    } catch (error) {
        console.error("Gemini API suggestions error:", error);
        // Return an empty array or a default error message in case of failure
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
                temperature: 0.7, // Slightly higher creativity for marketing
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
