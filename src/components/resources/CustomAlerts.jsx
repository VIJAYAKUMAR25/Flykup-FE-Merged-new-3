import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const AdvancedAlert = ({ 
  type = "info", 
  message, 
  duration = 5000, 
  position = "top-right",
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const alertConfigs = {
    success: {
      theme: "bg-green-50 border-l-4 border-green-500",
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      progressColor: "bg-green-500",
      textColor: "text-green-800"
    },
    error: {
      theme: "bg-red-50 border-l-4 border-red-500",
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      progressColor: "bg-red-500",
      textColor: "text-red-800"
    },
    warning: {
      theme: "bg-amber-50 border-l-4 border-amber-500",
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      progressColor: "bg-amber-500",
      textColor: "text-amber-800"
    },
    info: {
      theme: "bg-blue-50 border-l-4 border-blue-500",
      icon: <Info className="w-6 h-6 text-blue-500" />,
      progressColor: "bg-blue-500",
      textColor: "text-blue-800"
    }
  };

  const positionClasses = {
    "top-right": "top-20 right-5",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4"
  };

  const { theme, icon, progressColor, textColor } = alertConfigs[type] || alertConfigs.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed z-[9999]
        ${positionClasses[position]} 
        w-72 md:w-96 
        transition-all duration-300 ease-in-out
        transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      <div className={`
        ${theme}
        rounded-lg shadow-lg
        p-4
        relative
        backdrop-blur-sm
        backdrop-filter
        overflow-hidden
      `}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${textColor} leading-5`}>
              {message}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button 
              onClick={handleClose}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          className={`
            absolute bottom-0 left-0 h-1 
            ${progressColor}
            rounded-full
          `}
          style={{
            width: '100%',
            animation: `progress-bar ${duration}ms linear`
          }}
        />
      </div>
    </div>
  );
};

const styles = `
@keyframes progress-bar {
  from { 
    width: 100%;
    opacity: 1;
  }
  to { 
    width: 0%;
    opacity: 0.5;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;

const StyleInjector = () => (
  <style>{styles}</style>
);

AdvancedAlert.StyleInjector = StyleInjector;

export default AdvancedAlert;