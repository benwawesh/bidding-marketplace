#!/bin/bash

# Kill existing Daphne process if running
pkill -f daphne

# Activate virtual environment
source ~/bidding-marketplace/venv/bin/activate

# Start Daphne WITHOUT verbose flag (silent mode)
cd ~/bidding-marketplace
nohup daphne -b 127.0.0.1 -p 8000 config.asgi:application > /dev/null 2>&1 &

echo "✅ Daphne started in silent mode (no logs to terminal)"
echo "🔍 Check errors only: tail -f ~/bidding-marketplace/logs/django.log"
