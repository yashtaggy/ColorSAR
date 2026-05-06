# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-builder

# Arguments passed from gcloud builds submit --substitutions
ARG _API_KEY
ARG _AUTH_DOMAIN
ARG _PROJECT_ID
ARG _STORAGE_BUCKET
ARG _SENDER_ID
ARG _APP_ID

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./

# Create .env file dynamically during build to ensure Vite captures it
RUN echo "VITE_FIREBASE_API_KEY=${_API_KEY}" > .env && \
    echo "VITE_FIREBASE_AUTH_DOMAIN=${_AUTH_DOMAIN}" >> .env && \
    echo "VITE_FIREBASE_PROJECT_ID=${_PROJECT_ID}" >> .env && \
    echo "VITE_FIREBASE_STORAGE_BUCKET=${_STORAGE_BUCKET}" >> .env && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${_SENDER_ID}" >> .env && \
    echo "VITE_FIREBASE_APP_ID=${_APP_ID}" >> .env

# Build React app (Vite will now pick up the .env we just created)
RUN npm run build

# --- Stage 2: Build Backend & Final Image ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (for OpenCV and other libs)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Pre-download ResNet/DenseNet weights to avoid runtime download ---
# This ensures the container starts FAST on Cloud Run
RUN python3 -c "import torchvision.models as models; models.resnet50(weights='ResNet50_Weights.DEFAULT'); models.densenet121(weights='DenseNet121_Weights.DEFAULT')"

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
