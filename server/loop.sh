#!/usr/bin/env bash

while true; do
    node index.js 9000 db.db
    echo "Restarting"
done
