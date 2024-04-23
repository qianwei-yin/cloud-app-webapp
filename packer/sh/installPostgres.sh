#!/bin/bash

set -e

USER="randomname"

sudo dnf module enable postgresql:16 -y

sudo dnf install postgresql-server -y

sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql -c "CREATE DATABASE ${USER};"
sudo -u postgres psql -c "CREATE ROLE ${USER} SUPERUSER LOGIN PASSWORD '123456';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${USER} TO ${USER};"

cd /
CONF_LOCATION="/var/lib/pgsql/data/pg_hba.conf"
sudo sed -i "s/\bident\b/md5/g" "${CONF_LOCATION}"
sudo systemctl restart postgresql