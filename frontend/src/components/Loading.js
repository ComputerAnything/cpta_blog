import React from 'react';
import '../styles/Loading.css'; // Add styles for the loading page


const Loading = () => {
  return (
    <div className="loading-page">
      <div className="spinner"></div>
      <p>Loading, please wait...</p>
    </div>
  );
};

export default Loading;
