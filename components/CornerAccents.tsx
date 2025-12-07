import React from 'react';

interface CornerAccentsProps {
  className?: string;
  size?: string;
  color?: string;
}

export const CornerAccents: React.FC<CornerAccentsProps> = ({ 
  className = "", 
  size = "w-1.5 h-1.5",
  color 
}) => {
  // Allow passing specific border color classes via className or color prop for backwards compatibility
  const borderClass = color ? color : className;

  return (
    <>
      <div className={`absolute top-0 left-0 ${size} border-l border-t ${borderClass}`} />
      <div className={`absolute top-0 right-0 ${size} border-r border-t ${borderClass}`} />
      <div className={`absolute bottom-0 left-0 ${size} border-l border-b ${borderClass}`} />
      <div className={`absolute bottom-0 right-0 ${size} border-r border-b ${borderClass}`} />
    </>
  );
};