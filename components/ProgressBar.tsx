
import React from 'react';

interface ProgressBarProps {
    progress?: number; // 0 to 100
    label?: string;
    indeterminate?: boolean;
    colorClass?: string;
    heightClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
    progress = 0, 
    label, 
    indeterminate = false,
    colorClass = 'bg-indigo-600',
    heightClass = 'h-3'
}) => {
    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {!indeterminate && <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>}
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
                {indeterminate ? (
                    <div className={`h-full ${colorClass} relative w-full overflow-hidden`}>
                         <div className="absolute top-0 left-0 h-full w-full bg-white/30 animate-progress-indeterminate origin-left"></div>
                    </div>
                ) : (
                    <div 
                        className={`h-full ${colorClass} transition-all duration-500 ease-out flex items-center justify-center bg-stripes animate-stripes`} 
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    >
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressBar;
