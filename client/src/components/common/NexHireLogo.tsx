import React from 'react';
import { Link } from 'react-router-dom';

interface NexHireLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withSubtitle?: boolean;
  isLink?: boolean;
  className?: string;
}

export const NexHireLogo: React.FC<NexHireLogoProps> = ({
  size = 'md',
  withSubtitle = true,
  isLink = true,
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      box: 'h-8 w-8 rounded-xl',
      iconSize: 18,
      title: 'text-base',
      subtitle: 'text-[10px]',
      gap: 'gap-2',
    },
    md: {
      box: 'h-10 w-10 rounded-2xl',
      iconSize: 22,
      title: 'text-xl',
      subtitle: 'text-[11px]',
      gap: 'gap-2.5',
    },
    lg: {
      box: 'h-12 w-12 rounded-2xl',
      iconSize: 26,
      title: 'text-2xl',
      subtitle: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      box: 'h-14 w-14 rounded-3xl',
      iconSize: 30,
      title: 'text-3xl',
      subtitle: 'text-sm',
      gap: 'gap-3.5',
    },
  }[size];

  const content = (
    <div className={`flex items-center ${sizeConfig.gap} ${className} group select-none`}>
      {/* Icon Badge */}
      <div
        className={`${sizeConfig.box} bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-md shadow-[#2E9D74]/25 ring-2 ring-white/80 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#2E9D74]/35 shrink-0`}
      >
        <svg
          width={sizeConfig.iconSize}
          height={sizeConfig.iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized N path with career trajectory upward apex */}
          <path
            d="M5 19V5L19 19V5"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="5" r="2.2" fill="#A7D6C0" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <span className={`${sizeConfig.title} font-extrabold tracking-tight text-[#143026] flex items-center`}>
          Nex<span className="text-[#2E9D74]">Hire</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2E9D74] ml-1"></span>
        </span>
        {withSubtitle && (
          <span className={`${sizeConfig.subtitle} text-[#527566] font-medium tracking-normal -mt-0.5`}>
            Campus Career &amp; Placement Platform
          </span>
        )}
      </div>
    </div>
  );

  if (isLink) {
    return (
      <Link to="/" className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-[#2E9D74] focus:ring-offset-2 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
};
