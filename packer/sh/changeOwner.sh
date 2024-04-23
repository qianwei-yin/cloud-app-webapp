#!/bin/bash

set -e

USER="nologinusername"
DIR="/home/nologinusername/myapp"

sudo chown -R "${USER}":"${USER}" "${DIR}"
sudo chmod -R 755 ${DIR}