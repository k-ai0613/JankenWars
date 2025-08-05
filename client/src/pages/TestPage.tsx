import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function TestPage() {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('Navigating to home...');
    navigate('/');
  };

  return (
    <div>
      <h1>Test Page</h1>
      <p>This is a test page.</p>
      <button onClick={handleClick}>Go to Home</button>
      <br />
      <Link to="/">Go to Home (Link)</Link>
    </div>
  );
}
