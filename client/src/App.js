import React, { useState, useEffect } from 'react';
import Configuration from './components/configuration';
import './index.css';


function App({ config } ) {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [filename, setFilename] = useState('');
    const [sitename, setSitename] = useState('');
    const [error, setError] = useState('No error detected');


    useEffect(() => {

        console.log('Setting up WebSocket connection...');
        const ws = new WebSocket(config.websocketUrl);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            console.log('Received message:', message);
        
            switch (message.type) {
                case 'progress':
                    setProgress(message.progress);
                    break;
                case 'message':
                     setMessage(message.message);
                break;
                case 'sitename':
                     setSitename(message.sitename);
                break;
                case 'filename':
                    setFilename(message.filename);
                    break;
                case 'error':
                        setError(message.error);
                break;
                default:
                    setError(`Unknown message type: ${message.type}`);
            }
        };

        return () => {
            console.log('Cleaning up WebSocket connection...');
            ws.close();
        };

    }, []);


   
    return (
        <div>
            { message && (
            <div className='download-info'>
                <div>Site: {sitename}</div>
                <div>Download progress: {progress}%</div>
                <div>Message: {message}</div>
                <div>Filename: {filename}</div>
                <div>Error: {error}</div>
            </div>
            )}
            <Configuration config={config}/>
        </div>
        
    );
}

export default App;