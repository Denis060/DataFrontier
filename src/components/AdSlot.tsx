import React from 'react';

interface AdSlotProps {
  type: 'leaderboard' | 'sidebar' | 'in-feed';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ type, className = '' }) => {
  const dimensions = {
    leaderboard: 'min-h-[90px] w-full max-w-[728px]',
    sidebar: 'min-h-[600px] w-full',
    'in-feed': 'min-h-[250px] w-full',
  };

  return (
    <div className={`flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-md overflow-hidden my-8 mx-auto ${dimensions[type]} ${className}`}>
      <span className="font-mono text-[9px] text-gray-600 uppercase tracking-widest mb-2">Advertisement</span>
      <div className="text-gray-700 text-xs font-medium">
        {type === 'leaderboard' && '728 x 90 Leaderboard'}
        {type === 'sidebar' && '300 x 600 Vertical'}
        {type === 'in-feed' && '970 x 250 In-Feed'}
      </div>
    </div>
  );
};
