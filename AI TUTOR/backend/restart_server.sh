#!/bin/bash

echo "🛑 Fermando il server backend..."
pkill -f "uvicorn app.main:app"
sleep 2

echo "🚀 Riavviando il server backend con CORS abilitato..."
cd /Users/giacomoarchidi/Desktop/AI\ TUTOR/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload &

echo "✅ Server riavviato! Controlla che vedi 'Application startup complete'"

