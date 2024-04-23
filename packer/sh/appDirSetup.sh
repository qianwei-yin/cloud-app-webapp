#!/bin/bash

set -e

USER="nologinusername"
DIR="/home/nologinusername/myapp"

sudo mkdir -p "${DIR}"

sudo chown -R "${USER}":"${USER}" "${DIR}"