import React from 'react';
import privacyUrl from "../../../public/PrivacyPolicy.html?url"; 

const pageStyles = {
    height: '100vh',
    width: '100vw',
    border: 'none',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
};

const PrivacyPolicyPage = () => {
  return (
    <div>
      <iframe
        src={privacyUrl} 
        title="Flykup Privacy Policy"
        style={pageStyles}
      />
    </div>
  );
};

export default PrivacyPolicyPage;