import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import Google from '../../../assets/images/google.png';
import Facebook from '../../../assets/images/facebook.png';

const SocialLoginButtons = ({ onGoogleSuccess, onGoogleError, onFacebookSuccess, isLoading }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <GoogleLogin
        render={renderProps => (
          <button
            type="button"
            onClick={renderProps.onClick}
            disabled={renderProps.disabled || isLoading}
            
            className="flex bg-black text-white font-bold items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed w-full"
          >
            <img src={Google} className="h-5 w-5" alt="Google" />
            Google
          </button>
        )}
        onSuccess={onGoogleSuccess}
        onError={onGoogleError}
      />

      <FacebookLogin
        appId="616361470760257" 
        render={renderProps => (
          <button
            type="button"
            onClick={renderProps.onClick}
            disabled={isLoading}
            className="flex items-center font-bold bg-black text-white justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed w-full"
          >
            <img src={Facebook} className="h-5 w-5" alt="Facebook" />
            Facebook
          </button>
        )}
        onSuccess={onFacebookSuccess}
        onFail={(error) => {
          console.log('Facebook Login Failed:', error);
        }}
        className="w-full"
      />
    </div>
  );
};

export default SocialLoginButtons;