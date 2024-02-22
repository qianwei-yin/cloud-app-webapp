#!/bin/bash

set -e

echo $PATH
sudo ls -l /usr/bin/systemctl

# sudo yum install systemd -y

# echo $PATH
# sudo ls /usr/bin/systemctl

sudo systemctl daemon-reload

sudo systemctl start webapp

sudo systemctl enable webapp