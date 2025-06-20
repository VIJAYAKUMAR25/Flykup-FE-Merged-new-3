import React from 'react';
import Terms from "../../assets/TermsOfService.html?url";

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