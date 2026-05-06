# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-builder

# Set build-time arguments for Vite (mandatory for React to see them)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Make them available as ENV during 'npm run build'
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

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
