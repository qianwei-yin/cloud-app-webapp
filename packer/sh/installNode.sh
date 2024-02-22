#!/bin/bash

set -e

sudo dnf module enable nodejs:18 -y

sudo dnf install nodejs -y