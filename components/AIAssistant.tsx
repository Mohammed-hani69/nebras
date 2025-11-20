import React, { useState, useEffect, useRef } from 'react';
import type { AIMessage } from '../types';
import { aiAvatarBase64 } from '../assets/ai-avatar';
import './AIAssistant.css';

interface AIAssistantProps {
  messages: AIMessage[];
  onAvatarClick: () => void;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

const MESSAGE_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours
const MESSAGE_DURATION = 2 * 60 * 1000; // 2 minutes
const CHECK_INTERVAL = 1 * 60 * 1000; // Check every 1 minute

const AIAssistant: React.FC<AIAssistantProps> = ({ messages, onAvatarClick, onFeedback }) => {
  const [currentMessage, setCurrentMessage] = useState<AIMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const checkAndShowMessage = () => {
      // Don't show a new message if one is already visible or the page is hidden
      if (document.hidden || currentMessage) {
        return;
      }
      
      const lastShownTimestamp = parseInt(localStorage.getItem('lastAiMessageShownTimestamp') || '0', 10);
      const now = Date.now();

      if (now - lastShownTimestamp < MESSAGE_INTERVAL) {
        return; // Not time yet
      }

      const shownIds = new Set(JSON.parse(localStorage.getItem('shownAiMessageIds') || '[]'));
      // Find the latest message that hasn't been shown
      const messageToShow = [...messages]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .find(m => !shownIds.has(m.id));

      if (messageToShow) {
        setCurrentMessage(messageToShow);
        setIsVisible(true);
        setFeedbackGiven(!!messageToShow.feedback);
        
        // Update localStorage
        localStorage.setItem('lastAiMessageShownTimestamp', now.toString());
        shownIds.add(messageToShow.id);
        localStorage.setItem('shownAiMessageIds', JSON.stringify(Array.from(shownIds)));

        // Set timeout to hide the message
        hideTimeoutRef.current = window.setTimeout(() => {
          setIsVisible(false);
          // Allow animation to finish before clearing the message
          setTimeout(() => setCurrentMessage(null), 500);
        }, MESSAGE_DURATION);
      }
    };

    // Run once on mount to check immediately
    checkAndShowMessage();

    const intervalId = setInterval(checkAndShowMessage, CHECK_INTERVAL);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [messages, currentMessage]);
  
  const handleFeedback = (feedback: 'positive' | 'negative') => {
    if (currentMessage) {
      onFeedback(currentMessage.id, feedback);
      setFeedbackGiven(true);
    }
  };

  const handleClose = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsVisible(false);
    setTimeout(() => setCurrentMessage(null), 500); // Allow animation to finish
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-end space-x-4">
       {currentMessage && (
        <div className={`ai-message-bubble ${isVisible ? 'visible' : ''}`}>
          <button onClick={handleClose} className="ai-message-close-btn" aria-label="إغلاق">&times;</button>
          <p>{currentMessage.content}</p>
           <div className="ai-feedback-section">
            {!feedbackGiven && !currentMessage.feedback ? (
              <>
                <p className="ai-feedback-question">هل كانت هذه النصيحة مفيدة؟</p>
                <div className="ai-feedback-buttons">
                  <button onClick={() => handleFeedback('positive')} aria-label="نعم، مفيدة">👍</button>
                  <button onClick={() => handleFeedback('negative')} aria-label="لا، غير مفيدة">👎</button>
                </div>
              </>
            ) : (
              <p className="ai-feedback-thanks">شكراً لتقييمك!</p>
            )}
          </div>
        </div>
      )}
      <button onClick={onAvatarClick} className="ai-avatar-button transform hover:scale-110 transition-transform duration-300">
        <img src={aiAvatarBase64} alt="AI Assistant" className="w-24 h-24 object-contain" />
      </button>
    </div>
  );
};

export default AIAssistant;