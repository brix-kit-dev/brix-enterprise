#!/bin/bash
for i in $(seq 1 30); do
  S=$(docker ps --filter name=brix-host-shell --format '{{.Status}}')
  echo "[$i] $S"
  if echo "$S" | grep -q healthy; then break; fi
  sleep 5
done
