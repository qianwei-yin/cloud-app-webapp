#!/bin/bash

set -e

DIR="/etc/systemd/system"
USER="packer"

sudo mkdir -p "${DIR}"
sudo chown -R "${USER}":"${USER}" "${DIR}"
# sudo chmod -R g+rwx ${DIR}
# sudo chmod -R o+rwx ${DIR}

