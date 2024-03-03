#!/bin/bash

set -e

USER="csye6225"
DIR="/home/csye6225/myapp"

sudo chown -R "${USER}":"${USER}" "${DIR}"
sudo chmod -R 755 ${DIR}