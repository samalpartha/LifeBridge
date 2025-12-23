.PHONY: up down api web

up:
	docker compose up --build

down:
	docker compose down

api:
	cd apps/api && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

web:
	cd apps/web && npm install && npm run dev -- -p 3000
