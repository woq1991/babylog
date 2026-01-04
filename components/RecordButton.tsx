import React from 'react';
import { COLORS } from '../constants';
import { FeedingType } from '../types';

interface RecordButtonProps {
  amount: number;
  type: FeedingType;
  onClick: (amount: number, type: FeedingType) => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ amount, type, onClick }) => {
  const styles = COLORS[type];

  return (
    <button
      onClick={() => onClick(amount, type)}
      className={`
        relative overflow-hidden group
        w-full aspect-square rounded-2xl shadow-sm border
        flex flex-col items-center justify-center
        transition-all duration-200 ease-out
        ${styles.secondary} ${styles.border} ${styles.text}
        hover:scale-105 active:scale-95 ${styles.hover} hover:text-white hover:border-transparent
      `}
    >
      <span className="text-xl sm:text-2xl font-bold mb-1">{amount}</span>
      <span className="text-xs sm:text-sm font-medium opacity-80">mL</span>
    </button>
  );
};
