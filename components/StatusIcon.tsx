import React from 'react';
import { CheckStatus } from '@/types';

const StatusIcon: React.FC<{ status: CheckStatus }> = ({ status }) => {
  switch (status) {
    case CheckStatus.ONLINE:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case CheckStatus.OFFLINE:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case CheckStatus.CHECKING:
      return (
        <svg className="animate-spin h-6 w-6 text-[#0071E3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    case CheckStatus.ERROR:
       return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

export default StatusIcon;

