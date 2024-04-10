# NodeBackUp
## React and Node multiple site backup of backups tool
## Description
Node App runs on user-configured port (63001) and websockets port (63002). React app is installed on local server port 443 and is reverse proxied to the node app which enacts the sftp copy of the latest file in a specified backup folder and saves them in a specified local server.
## Why this App?
a) To show off my Node and React Skills
b) To solve a specific issue I have with my web client base: They each have nightly backups of their websites and once a week, I take an offline backup of those and store them on my servers. This can sometimes take up to 24 hours to backup all of them via sftp so I decided to automate the process. I also got bored staring at the numbers slowly creep around, so I introduced a random fact every 10 seconds just to keep me (and others) entertained.

## Installation
Can run within the same folder on a local webserver. This is my apache site-available config:
```
ServerName nodebackup.local
DocumentRoot /www/nodeBackUp/client/build
ErrorLog /var/log/apache2/error.log
CustomLog /var/log/apache2/access.log combined
ServerAdmin simon@rundell.org.uk

SSLEngine on
SSLCertificateFile /etc/ssl/nodebackup.local/cert.pem
SSLCertificateKeyFile /etc/ssl/nodebackup.local/key.pem

# Route API requests to the backend server
ProxyPass /api http://localhost:63001/api
ProxyPassReverse /api http://localhost:63001/api

# Route WebSocket requests to the WebSocket server
ProxyPass /ws ws://localhost:63002/
ProxyPassReverse /ws ws://localhost:63002/

<Directory "/www/nodeBackUp/client/build">
    Options None
    Require all granted
</Directory>
```
## Usage
Data is saved as you type to the servers.json data file.

## Configuration
I run this on my local server, accessed from a local client, which is why I have not built in any authentication or multiple user facility because it is intended as a local-only app. The React FE is sitting on port 443 and is reverse proxied to the BE Node app running under pm2 on a specified port (63001) with websockets on 63002.

Typical FE config.json
```
	{
    "backendUrl": "http:<server>:<port>",
    "websocketUrl": "ws://<server>:<port>",
    "requestTimeout": 5000,
    "retryAttempts": 3
}
```

Typical BE config.json
```
{
    "expressPort": 63001,
    "websocketPort": 63002,
    "factsFilePath": "facts.json",
    "serversFilePath": "servers.json",
    "allowedOrigins": "*",
    "factsSpeed": 10000
}
```

Typical servers.json entry:
```
[
{
    "sitename": "test",
    "host": "<server>",
    "port": 22,
    "user": "<user>",
    "pass": "<pass>",
    "remoteDir": "/path/to/backup/dir",
    "localDir": "/path/to/backups"
  }
]
```

## Contact Details
Simon Rundell, 20 Clifton Ave, Plymouth, UK, PL7 4BJ
+44 (0)7976802123
simon@codemonkey.design

## License
Prayerware - free for you to use and adapt. I'd welcome any job offers and your prayers would be appreciated.