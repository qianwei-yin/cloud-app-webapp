#!/bin/bash

set -e

sudo adduser csye6225 --shell /usr/sbin/nologin

sudo chmod -R g+rwx /home/csye6225
sudo chmod -R o+rwx /home/csye6225

ls -alF /home