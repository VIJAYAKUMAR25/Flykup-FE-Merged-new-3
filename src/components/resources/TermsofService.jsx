import React from 'react';
import Terms from "../../../public/TermsofService.html?url"; 
// Reusing the same styles
const pageStyles = {
    height: '100vh',
    width: '100vw',
    border: 'none',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
};

const TermsOfServicePage = () => {
  return (
    <div>
      <iframe
        src={Terms}
        title="Flykup Terms of Service"
        style={pageStyles}
      />
    </div>
  );
};

export default TermsOfServicePage;