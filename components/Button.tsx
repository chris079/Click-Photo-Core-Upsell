import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  // Updated rounding to rounded-md to match "Book Now" style
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md";
  
  const variants = {
    // New Primary Blue #0047BB
    primary: "bg-[#0047BB] text-white hover:bg-[#003bb5] focus:ring-[#0047BB] shadow-lg shadow-blue-900/10",
    // Secondary is slightly lighter blue or white with blue text
    secondary: "bg-blue-50 text-[#0047BB] hover:bg-blue-100 focus:ring-[#0047BB]",
    // Outline uses the primary blue
    outline: "border-2 border-[#0047BB] text-[#0047BB] hover:bg-blue-50 focus:ring-[#0047BB]",
    ghost: "text-slate-600 hover:text-[#0047BB] hover:bg-blue-50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : children}
    </button>
  );
};