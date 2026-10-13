# Variables
DOCKER_USER ?= karthikeyaakhandam
VERSION ?= latest

# Project Paths
BACKEND_DIR = artifacts/api-server
FRONTEND_DIR = artifacts/permionics-bd-suite

.PHONY: firebase-emulator run-backend run-frontend build-backend start-backend docker-backend docker-frontend help

help:
	@echo "Available commands:"
	@echo "  make firebase-emulator  - Starts the Firebase Auth local emulator"
	@echo "  make run-backend        - Runs the API server in dev mode"
	@echo "  make run-frontend       - Runs the frontend React app in dev mode"
	@echo "  make build-backend      - Builds the API server for production"
	@echo "  make start-backend      - Starts the compiled API server in production"
	@echo "  make docker-backend     - Builds and pushes the backend Docker image"
	@echo "  make docker-frontend    - Builds and pushes the frontend Docker image"
	@echo ""
	@echo "Docker Versioning (defaults to 'latest'):"
	@echo "  make docker-backend VERSION=1.2.0"

firebase-emulator:
	npx firebase-tools emulators:start --only auth --project demo-permionics --import=./local/firebase-emulator/emulator-data --export-on-exit=./local/firebase-emulator/emulator-data

run-backend:
	pnpm --filter @workspace/api-server run dev

run-frontend:
	pnpm --filter @workspace/permionics-bd-suite run dev

build-backend:
	pnpm --filter @workspace/api-server run build

start-backend:
	pnpm --filter @workspace/api-server run start

docker-backend:
	docker build -t $(DOCKER_USER)/permionics-api:$(VERSION) -f $(BACKEND_DIR)/Dockerfile .
	docker tag $(DOCKER_USER)/permionics-api:$(VERSION) $(DOCKER_USER)/permionics-api:latest
	docker push $(DOCKER_USER)/permionics-api:$(VERSION)
	docker push $(DOCKER_USER)/permionics-api:latest

docker-frontend:
	docker build -t $(DOCKER_USER)/permionics-bd-suite:$(VERSION) -f $(FRONTEND_DIR)/Dockerfile .
	docker tag $(DOCKER_USER)/permionics-bd-suite:$(VERSION) $(DOCKER_USER)/permionics-bd-suite:latest
	docker push $(DOCKER_USER)/permionics-bd-suite:$(VERSION)
	docker push $(DOCKER_USER)/permionics-bd-suite:latest
