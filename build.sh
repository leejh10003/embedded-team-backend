#!/bin/bash
cd /home/ubuntu
unzip embedded-team-backend.zip
rm embedded-team-backend.zip
source /home/ubuntu/.bashrc
nvm use 14.16.1
yarn install