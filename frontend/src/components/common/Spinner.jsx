import React from 'react';

const Spinner = ({ size = "w-5 h-5", color = "border-white" }) => {
  return (
    <div className={`${size} border-2 ${color} border-t-transparent rounded-full animate-spin`} />
  );
};

export default Spinner;
