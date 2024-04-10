const Client = require('ssh2-sftp-client');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const WebSocket = require('ws');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const wss = new WebSocket.Server({ port: config.websocketPort });

// read in random facts
const facts = JSON.parse(fs.readFileSync(config.factsFilePath, 'utf8'));

let ws = null;
wss.on('connection', (websocket) => {
    ws = websocket;
    console.log('Websocket connected');
});

app.use(bodyParser.json());

app.use(cors({ origin: config.allowedOrigins }));

app.get('/api/servers', (req, res) => {
    fs.readFile(config.serversFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send(err);
            return;
        }

        res.send(data);
    });
});

app.post('/api/save', (req, res) => {
const servers = req.body;

fs.writeFile('servers.json', JSON.stringify(servers), (err) => {
    if (err) {
        console.error('Error writing to file:', err);
        res.status(500).send('Server error');
        return;
    }

    res.send('Data saved successfully');
});
});


app.post('/backup', async (req, res) => {
    const backupServerIndex = req.body.backupServer;

    fs.readFile('servers.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send(err);
            return;
        }

        const servers = JSON.parse(data);
        const serverToBackup = servers[backupServerIndex];

        if (!serverToBackup) {
            res.status(404).send('Server not found');
            if (ws && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'error', error: 'Server Not Found'}));
            }
            return;
        }

        downloadLatestFile(serverToBackup)
            .then(() => res.send('Backup completed successfully'))
            .catch(error => {
                console.error('Error in backup:', error);
                res.status(500).send('Error in backup');
            });
    });
});


app.listen(config.expressPort, () => {
    console.log(`Server listening on port ${config.expressPort}`);
});

async function downloadLatestFile(server) {
    const sftp = new Client('sftp');
    const remoteDir = server.remoteDir.endsWith('/') ? server.remoteDir.slice(0, -1) : server.remoteDir;
    const localDir = server.localDir.endsWith('/') ? server.localDir.slice(0, -1) : server.localDir;

    // setup random fact timer when downloading
    // Check if `factsSpeed` is defined
    if (config.factsSpeed === undefined) {
        console.error('Error: factsSpeed is not defined in config');
        return;
    }
    
    // Check if `factsSpeed` is a number
    if (typeof config.factsSpeed !== 'number') {
        console.error('Error: factsSpeed is not a number');
        return;
    }
    
    // Check if `factsSpeed` is too small
    if (config.factsSpeed < 1000) { // Adjust this as needed
        console.error('Error: factsSpeed is too small');
        return;
    }
    
    // If everything is okay, start the timer
    const factInterval = setInterval(sendRandomFact, config.factsSpeed);


    try {
        await sftp.connect({
            host: server.host,
            port: server.port,
            username: server.user,
            password: server.pass
        });

        const files = await sftp.list(remoteDir);
        if (files.length === 0) {
            if (ws && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'error', error: 'No files found in directory'}));
            } else {
                // console.log('WebSocket is not open. Unable to send message.');
            }
        }

        files.sort((a, b) => b.modifyTime - a.modifyTime);
        const latestFile = files[0];
        // console.log('File Info:\n', JSON.stringify(latestFile));

        if (ws && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'message', message: `File Size: ${latestFile.size} bytes`}));
            ws.send(JSON.stringify({ type: 'sitename', sitename: server.sitename}));
            ws.send(JSON.stringify({ type: 'filename', filename: latestFile.name}));
        } else {
            // console.log('WebSocket is not open. Unable to send message.');
        }

        const remoteFilePath = path.join(remoteDir, latestFile.name);
        const localFilePath = path.join(localDir, latestFile.name);

        let receivedBytes = 0;

        await sftp.fastGet(remoteFilePath, localFilePath, {
            step: (totalTransferred, chunk, total) => {
                receivedBytes += chunk;
                const progress = (receivedBytes / total) * 100;
                if (ws && ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'progress', progress: progress.toFixed(2) }));
                } else {
                    // console.log('WebSocket is not open. Unable to send progress update.');
                }
            }
        });
    } finally {
        await sftp.end();
        if (ws && ws.readyState === ws.OPEN) {
            clearInterval(factInterval);
            ws.send(JSON.stringify({ type: 'message', message: `Completed Backup for ${server.sitename}`}));
            ws.send(JSON.stringify({ type: 'progress', progress: null}));

        } else {
            // console.log('WebSocket is not open. Unable to send message.');
        }
    }
}

const sendRandomFact = () => {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'message', message: randomFact.fact }));
    } else {
        // console.log('WebSocket is not open. Could not send random fact.');
    }
  };