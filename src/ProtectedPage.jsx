import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 
import FlykupLoader from './components/resources/FlykupLoader'; 

const ProtectedPage = ({ element }) => {
  const { user, loading } = useAuth();

  if(loading) {
    return (
      <FlykupLoader text="Please wait!" />
    )
  }

  if (!user) {
    return <Navigate to="/auth/" replace />;
  }
  return element;
};

export default ProtectedPage;