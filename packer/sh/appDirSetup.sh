#!/bin/bash

set -e

USER="csye6225"
DIR="/home/csye6225/myapp"

sudo mkdir -p "${DIR}"

sudo chown -R "${USER}":"${USER}" "${DIR}"
sudo chmod -R g+rwx ${DIR}
sudo chmod -R o+rwx ${DIR}

sudo ls -alF /home/csye6225