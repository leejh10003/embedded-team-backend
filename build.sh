#!/bin/bash
cd /home/ubuntu
unzip embedded-team-backend.zip
rm embedded-team-backend.zip
\. ~/.nvm/nvm.sh
\. ~/.profile
\. ~/.bashrc
nvm use 14.16.1
yarn install
pm2 restart index.js