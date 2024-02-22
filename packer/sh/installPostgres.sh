#!/bin/bash

set -e

sudo dnf module enable postgresql:16 -y

sudo dnf install postgresql-server -y

sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql -c "CREATE DATABASE conway;"
# sudo -u postgres psql -c "CREATE USER conway WITH PASSWORD '123456';"
sudo -u postgres psql -c "CREATE ROLE conway SUPERUSER LOGIN PASSWORD '123456';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE conway TO conway;"
# sudo -u postgres psql -c "GRANT USAGE ON SCHEMA public TO conway;"
# sudo -u postgres psql -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO conway;"

cd /
CONF_LOCATION="/var/lib/pgsql/data/pg_hba.conf"
sudo sed -i "s/\bident\b/md5/g" "${CONF_LOCATION}"
sudo systemctl restart postgresql