#!/usr/bin/env bash
# wait-for.sh -- wait for dependencies to become available

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

if [ -z "$host" ] || [ -z "$port" ]; then
  echo "Usage: wait-for.sh host port [-- command args]"
  exit 1
fi

echo "Waiting for $host:$port..."

until nc -z "$host" "$port"; do
  >&2 echo "Waiting for $host:$port..."
  sleep 1
done

echo "$host:$port is available"

if [ -n "$cmd" ]; then
  exec $cmd
fi
