#!/bin/sh
# This is tested on CentOS 7

# Install node
curl --silent --location https://rpm.nodesource.com/setup > install_node.sh
chmod +x install_node.sh

# XXX this is super ghetto
sudo ./install_node.sh
sudo yum install -y gcc-c++ make nodejs
sudo npm install -g strongloop


