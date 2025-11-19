import React, { useEffect } from 'react';
import type { AIMessage } from '../types';
import { BrainIcon } from './icons/Icons';


interface AIMessagesProps {
  messages: AIMessage[];
  markAllAsRead: () => void;
}

const AIMessages: React.FC<AIMessagesProps> = ({ messages, markAllAsRead }) => {

  useEffect(() => {
    // When the component mounts, mark all messages as read.
    markAllAsRead();
  }, [markAllAsRead]);

  const sortedMessages = [...messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
            <BrainIcon />
            <h1 className="text-3xl font-bold text-gray-800">رسائل المساعد الذكي</h1>
        </div>
      </div>
      <p className="text-gray-600">هنا ستجد سجلاً كاملاً بجميع النصائح والتنبيهات التي قدمها لك المساعد الذكي لتحسين أداء متجرك.</p>
      
      <div id="ai-messages-list" className="bg-white p-6 rounded-xl shadow-lg">
        <div className="space-y-4">
          {sortedMessages.length > 0 ? (
            sortedMessages.map(message => (
              <div 
                key={message.id} 
                className={`p-4 rounded-lg border-r-4 transition-colors duration-300 ${
                  !message.read ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                    <p className="text-gray-800 flex-1 pr-4">{message.content}</p>
                    {message.feedback && (
                        <span 
                            className="text-2xl" 
                            aria-label={`التقييم: ${message.feedback === 'positive' ? 'مفيد' : 'غير مفيد'}`}
                            title={`التقييم: ${message.feedback === 'positive' ? 'مفيد' : 'غير مفيد'}`}
                        >
                            {message.feedback === 'positive' ? '👍' : '👎'}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-left">
                  {new Date(message.timestamp).toLocaleString('ar-EG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد رسائل من المساعد الذكي بعد.</p>
              <p className="text-sm text-gray-400 mt-2">سيقوم المساعد بتحليل بياناتك وإرسال نصائح مفيدة قريبًا.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMessages;