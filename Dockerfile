# --- Stage 1: Build Frontend ---
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build React app (output goes to /app/frontend/dist)
RUN npm run build

# --- Stage 2: Build Backend & Final Image ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (for OpenCV and other libs)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from Stage 1 to a specific folder for FastAPI
COPY --from=frontend-builder /app/frontend/dist ./frontend-dist

# Copy weights (assuming they are in the local repo during docker build)
# Note: Since they are in .gitignore, you may need to move them 
# manually or use a bypass logic for the build runner.
COPY backend/weights/ ./backend/weights/

# Set environment variables
ENV PORT=8080
ENV PYTHONPATH=/app/backend

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "backend/main.py"]
