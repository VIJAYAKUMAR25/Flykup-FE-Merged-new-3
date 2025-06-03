import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const alertConfig = {
  positive: {
    icon: CheckCircle,
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    textColor: 'text-green-800',
    iconColor: 'text-green-500'
  },
  negative: {
    icon: AlertCircle,
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    textColor: 'text-red-800',
    iconColor: 'text-red-500'
  },
  neutral: {
    icon: Info,
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500'
  },
  caution: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500'
  }
};

export const Alert = ({ alert, removeAlert }) => {
  const { id, type, message, duration = 6000 } = alert;
  const config = alertConfig[type] || alertConfig.neutral;
  const Icon = config.icon;

  // Set up auto-close timer using useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      removeAlert(id);
    }, duration);

    // Clear the timer when the component unmounts or when the alert changes
    return () => clearTimeout(timer);
  }, [id, duration, removeAlert]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg border-l-4 mb-2 ${config.borderColor} ${config.bgColor}`}
      role="alert"
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${config.iconColor}`} />
        <span className={`font-medium ${config.textColor}`}>{message}</span>
      </div>
      <button 
        className="ml-4 focus:outline-none hover:opacity-75 transition-opacity"
        onClick={() => removeAlert(id)}
      >
        <X className={`w-4 h-4 ${config.textColor}`} />
      </button>
    </motion.div>
  );
};