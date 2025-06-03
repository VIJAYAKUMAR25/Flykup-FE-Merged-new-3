import { createContext } from 'react';

export const AlertContext = createContext({
  alerts: [],
  addAlert: () => {},
  removeAlert: () => {},
  positive: () => {},
  negative: () => {},
  neutral: () => {},
  caution: () => {},
});