import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/modals/AuthModal';
import FlykupLoader from './components/resources/FlykupLoader';

const PublicWithAuthGate = ({ element }) => {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Check if user is authenticated based on localStorage tokens and user data
  const isAuthenticated = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken && user);
  };

  // Function to check if user is authenticated before performing actions
  const requireAuth = (actionCallback, actionData = null) => {
    if (loading) return false; // Don't do anything while loading
    
    if (!isAuthenticated()) {
      // Store the pending action to execute after authentication
      setPendingAction(() => actionCallback);
      setIsAuthModalOpen(true);
      return false; // Action not executed
    }
    
    // User is authenticated, execute the action
    if (typeof actionCallback === 'function') {
      actionCallback(actionData);
    }
    return true; // Action executed
  };

  // Handle successful authentication
  const handleAuthSuccess = (userData) => {
    setIsAuthModalOpen(false);
    
    // Execute the pending action if there is one
    if (pendingAction && typeof pendingAction === 'function') {
      // Small delay to ensure user data is properly set
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 100);
    }
  };

  // Handle auth modal close
  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  if (loading) {
    return <FlykupLoader text="Loading..." />;
  }

  // Clone the element and pass the requireAuth function and auth state as props
  const elementWithAuthGate = element && typeof element === 'object' ? 
    {
      ...element,
      props: {
        ...element.props,
        requireAuth,
        isAuthenticated: isAuthenticated(),
        currentUser: user,
        // Additional helper functions
        checkAuth: () => isAuthenticated(),
        openAuthModal: () => setIsAuthModalOpen(true)
      }
    } : element;

  return (
    <>
      {elementWithAuthGate}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default PublicWithAuthGate;