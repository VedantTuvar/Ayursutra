import React from 'react';

export function LoadingSpinner({
  size = 'md',
  color = 'brand'
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'white';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };
  
  const colorClasses = {
    brand: 'border-brand-700 border-r-transparent text-brand-700',
    white: 'border-white border-r-transparent text-white'
  };

  return (
    <div className="flex items-center justify-center p-6 w-full">
      <div
        className={`animate-spin rounded-full border-solid ${sizeClasses[size]} ${colorClasses[color]} shrink-0`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
export default LoadingSpinner;
