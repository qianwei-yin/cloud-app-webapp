#!/bin/bash

set -e

USER="packer"
DIR="/home/${USER}/myapp"

sudo mkdir -p "${DIR}"

sudo chown -R "${USER}":"${USER}" "${DIR}"