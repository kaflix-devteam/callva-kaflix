#!/usr/bin/env bash
# SSH tunnel to the GPU model server's loopback-only ports (LLM / TTS / ASR).
# Host and ports come from .env (never hardcode internal hosts in this public repo).
#   VOICE_HOST=user@host          (required)
#   VOICE_LLM_REMOTE_PORT=11435   VOICE_LLM_LOCAL_PORT=11435
#   VOICE_TTS_REMOTE_PORT=8601    VOICE_TTS_LOCAL_PORT=18601
#   VOICE_ASR_REMOTE_PORT=8602    VOICE_ASR_LOCAL_PORT=18602
# Usage: scripts/voice-tunnel.sh   (foreground, auto-reconnect; Ctrl-C to stop)
set -u
cd "$(dirname "$0")/.."
if [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${VOICE_HOST:?set VOICE_HOST=user@host in .env (see .env.example)}"
LLM_R="${VOICE_LLM_REMOTE_PORT:-11435}"; LLM_L="${VOICE_LLM_LOCAL_PORT:-11435}"
TTS_R="${VOICE_TTS_REMOTE_PORT:-8601}";  TTS_L="${VOICE_TTS_LOCAL_PORT:-18601}"
ASR_R="${VOICE_ASR_REMOTE_PORT:-8602}";  ASR_L="${VOICE_ASR_LOCAL_PORT:-18602}"
while true; do
  ssh -N -o BatchMode=yes -o ExitOnForwardFailure=yes -o ServerAliveInterval=20 -o ServerAliveCountMax=3 \
    -L "127.0.0.1:${LLM_L}:127.0.0.1:${LLM_R}" \
    -L "127.0.0.1:${TTS_L}:127.0.0.1:${TTS_R}" \
    -L "127.0.0.1:${ASR_L}:127.0.0.1:${ASR_R}" \
    "$VOICE_HOST"
  echo "[voice-tunnel] disconnected (exit $?), retrying in 3s" >&2
  sleep 3
done
