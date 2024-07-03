#!/usr/bin/env bash

iters="$1"
shift
delay="$1"
shift

for tag in $@; do
    node client https://gigamonkey-test-lite-fs.fly.dev $tag "$iters" "$delay" &
done
