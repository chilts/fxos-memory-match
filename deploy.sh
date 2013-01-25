#!/bin/bash
## --------------------------------------------------------------------------------------------------------------------

# install any required packages
npm install

# minify our stuff
grunt uglify cssmin

# set up Nginx
sudo cp etc/nginx/sites-enabled/memory-match /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/memory-match /etc/nginx/sites-enabled/
sudo service nginx reload

# set up the servers
sudo mkdir -p /var/log/memory-match/
sudo chown ubuntu:ubuntu /var/log/memory-match/

# add the upstart scripts
sudo cp etc/init/memory-match-web-1.conf /etc/init/

# restart the web service
sudo service memory-match-web-1 restart

## --------------------------------------------------------------------------------------------------------------------
