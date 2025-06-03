import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from './useAlert';
import { Alert } from './Alert';

export const AlertsContainer = () => {
  const { alerts, removeAlert } = useAlert();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md space-y-2 px-2">
      <AnimatePresence initial={false}>
        {alerts.map(alert => (
          <Alert 
            key={alert.id} 
            alert={alert} 
            removeAlert={removeAlert}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};