import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

function Main() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/config.json')
      .then(response => response.json())
      .then(setConfig);
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main />);
