import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import FlykupLoader from './components/resources/FlykupLoader';

const ShipperProtectedPage = ({ children }) => {
  const { user, loading } = useAuth();

  if(loading) {
    return (
      <FlykupLoader text="Loading Live Auctions..." />
    )
  }

  if (!user || user.role !== 'dropshipper') {
    return <Navigate to="/auth/" replace />;
  }
  return children;
};

export default ShipperProtectedPage;
