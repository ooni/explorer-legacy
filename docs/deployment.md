# Setup

The production deployment relies on systemd for running the node service and is
fronted by nginx.

The requirements for deploying ooni-explorer in production are the same as those
for running it in a development environment.

You will need to have installed recent versions of:

* [Node with npm](https://nodejs.org/en/download/)

* [Bower](http://bower.io/#install-bower)

Once these are installed you should setup a user to run the explorer as.

You should clone the repository of the explorer in the home of the user:

```
git clone https://github.com/TheTorProject/ooni-explorer.git
```

Install the node and bower requirements:

```
bower install
npm install
```

Edit the `server/datasources.production.js` to include the details of your
database.

To build the production version of the application run:

```
grunt build
```

Then configure a systemd service with a file like this (assuming the user is
called ooni-explorer):

`$ cat /etc/systemd/system/node-ooni-explorer.service`
```
[Service]
ExecStart=/usr/bin/node /home/ooni-explorer/ooni-explorer/server.js
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=node-ooni-explorer
User=ooni-explorer
Group=ooni-explorer
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

By default ooni-explorer will bind on port 3000, so you can either use nginx to
proxy connection to port 3000 (recommended) or use an iptables rule if you don't
need TLS.

This is how the nginx configuration should look like
(`/etc/nginx/sites-enabled/ooni-explorer`):

```
server {
        listen 80;
        server_name explorer.ooni.torproject.org explorer.ooni.io;
        root /usr/share/nginx/html/;

        location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
        }
        location ~ /.well-known {
          allow all;
        }

}
server {
# SSL configuration
  listen 443 ssl;
  server_name explorer.ooni.torproject.org explorer.ooni.io;
  ssl_certificate /path/to/fullchain.pem;
  ssl_certificate_key /path/to/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  root /usr/share/nginx/html/;

  location ~ /.well-known {
    allow all;
  }

}
```

# Starting and stopping

To start the service run:

```
service node-ooni-explorer start
```

To stop the service run:

```
service node-ooni-explorer stop
```

# Updating

```
cd /home/ooni-explorer/ooni-explorer/
git pull
grunt build
service node-ooni-explorer restart
```
