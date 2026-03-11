# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY catalog.json /build/catalog.json
COPY templates/ /build/templates/
RUN npm run build

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

# Install uv
RUN pip install uv --no-cache-dir

# Copy backend and install dependencies
COPY backend/ ./backend/
RUN cd backend && uv sync --frozen

# Copy static data
COPY catalog.json .
COPY templates/ ./templates/

# Copy built frontend static files
COPY --from=frontend-builder /build/frontend/out ./frontend/out

EXPOSE 8000
CMD ["uv", "run", "--project", "backend", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend"]
