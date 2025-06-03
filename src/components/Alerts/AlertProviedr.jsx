import { useState } from 'react';
import { AlertContext } from './AlertContext';

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

const addAlert = (type, message, duration = 3000) => {
  const id = Date.now();
  setAlerts(prev => [...prev, { id, type, message, duration }]);
  return id;
};

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const value = {
    alerts,
    addAlert,
    removeAlert,
    positive: (message, duration) => addAlert('positive', message, duration),
    negative: (message, duration) => addAlert('negative', message, duration),
    neutral: (message, duration) => addAlert('neutral', message, duration),
    caution: (message, duration) => addAlert('caution', message, duration)
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};