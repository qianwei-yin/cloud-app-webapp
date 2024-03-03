#!/bin/bash

set -e

USER="csye6225"
DIR="/home/csye6225/myapp"

sudo mkdir -p "${DIR}"

sudo chown -R "${USER}":"${USER}" "${DIR}"