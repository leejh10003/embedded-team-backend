#!/bin/bash
[ -e /home/ubuntu/node_modules ] && rm -r /home/ubuntu/node_modules
[ -e /home/ubuntu/README.md ] && rm /home/ubuntu/README.md
[ -e /home/ubuntu/buildspec.yml ] && rm /home/ubuntu/buildspec.yml
[ -e /home/ubuntu/index.js ] && rm  /home/ubuntu/index.js
[ -e /home/ubuntu/package.json ] && rm  /home/ubuntu/package.json
[ -e /home/ubuntu/yarn.lock ] && rm  /home/ubuntu/yarn.lock