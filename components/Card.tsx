
import React from 'react';

interface CardProps {
  title: string;
  value: string;
  isHighlight?: boolean;
}

const Card: React.FC<CardProps> = ({ title, value, isHighlight = false }) => {
  return (
    <div className={`p-6 rounded-xl shadow-lg transition-transform hover:scale-105 ${
        isHighlight 
        ? 'bg-indigo-600 text-white' 
        : 'bg-white text-gray-800'
    }`}>
      <h4 className={`font-medium mb-2 ${isHighlight ? 'text-indigo-200' : 'text-gray-500'}`}>{title}</h4>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export default Card;
