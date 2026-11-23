#!/usr/bin/env bash
set -eu
exec bash "$(dirname "$0")/deploy-guarded-hostinger.sh" gitlab "$@"
