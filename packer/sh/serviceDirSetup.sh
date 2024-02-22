#!/bin/bash

set -e

DIR="/lib/systemd/system"
USER="packer"

sudo mkdir -p "${DIR}"

sudo chown -R "${USER}":"${USER}" "${DIR}"