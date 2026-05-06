import os
import io
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from pydantic import BaseModel
from typing import Optional

from contextlib import asynccontextmanager
from services.model import load_models, preprocess, infer, ColorizationModel, EnsembleEncoder, Decoder, DnCNN
from services.postprocess import run_postprocessing_pipeline
from services.enhance import enhance_image_with_ai
from services.analysis import analyze_image
from services.report import generate_pdf_report

import firebase_admin
from firebase_admin import credentials, auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin
try:
    if os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    elif os.getenv("FIREBASE_SERVICE_ACCOUNT"):
        import json
        service_account_info = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin: Initialized using environment variable.")
    else:
        print("Firebase Admin Warning: No service account key found (file or env var).")
except Exception as e:
    print(f"Firebase Admin Warning: {e}")

security = HTTPBearer()

async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(res.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Global model state (Lazy Loaded)
models = {"color": None, "dncnn": None}
import threading
model_lock = threading.Lock()

def get_models():
    """Thread-safe lazy loader for models."""
    global models
    if models["color"] is not None:
        return models["color"], models["dncnn"]
    
    with model_lock:
        if models["color"] is None:
            print("Startup: First request received. Loading heavy AI models...")
            # Search paths for weights
            search_paths = [
                "weights",
                "backend/weights",
                "../weights",
                "backend/weights",
                "/app/backend/weights",
                ".",
                ".."
            ]
            
            color_pth = None
            dncnn_pth = None
            
            for path in search_paths:
                c_test = os.path.join(path, "color_model.pth")
                d_test = os.path.join(path, "dcnn.pth")
                if os.path.exists(c_test) and not color_pth:
                    color_pth = c_test
                if os.path.exists(d_test) and not dncnn_pth:
                    dncnn_pth = d_test
                    
            if not color_pth: color_pth = "color_model.pth"
            if not dncnn_pth: dncnn_pth = "dcnn.pth"
                
            models["color"], models["dncnn"] = load_models(color_pth, dncnn_pth)
            print(f"Models loaded successfully from {color_pth} and {dncnn_pth}")
            
    return models["color"], models["dncnn"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Instant startup: We don't load models here anymore to avoid Cloud Run timeouts
    print("Health: Server is up and listening.")
    yield
    # Clean up
    models["color"] = None
    models["dncnn"] = None

app = FastAPI(title="SAR Image Analysis Platform", lifespan=lifespan)

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process_image(
    file: UploadFile = File(...), 
    enhanced: bool = False,
    saturation: float = 1.2,
    contrast: float = 1.0,
    sharpness: float = 1.0,
    current_user: dict = Depends(get_current_user)
):
    try:
        content = await file.read()
        
        # 1. Preprocess
        L_scaled, img_original_np, original_size = preprocess(io.BytesIO(content))
        
        # 2. Model Inference
        color_model, dncnn_model = get_models()
        colorized_rgb = infer(color_model, dncnn_model, L_scaled, img_original_np, original_size)
        
        analysis = None
        final_image_rgb = colorized_rgb
        
        # 3. Post-processing / AI Enhancement
        if enhanced:
            # We need bytes for Gemini analysis
            temp_buf = io.BytesIO()
            Image.fromarray(colorized_rgb).save(temp_buf, format="PNG")
            colorized_bytes = temp_buf.getvalue()
            
            final_image_rgb, analysis = enhance_image_with_ai(
                colorized_rgb, colorized_bytes, 
                saturation=saturation, contrast=contrast, sharpness=sharpness
            )
        else:
            final_image_rgb = run_postprocessing_pipeline(
                colorized_rgb, 
                saturation=saturation, contrast=contrast, sharpness=sharpness
            )
        
        # 4. Prepare Response
        final_img_pil = Image.fromarray(final_image_rgb)
        buf = io.BytesIO()
        final_img_pil.save(buf, format="PNG")
        byte_im = buf.getvalue()
        
        # Return base64 encoded image and analysis data
        import base64
        img_base64 = base64.b64encode(byte_im).decode('utf-8')
        
        return JSONResponse(content={
            "image": f"data:image/png;base64,{img_base64}",
            "analysis": analysis
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-report")
async def generate_report(
    input_file: UploadFile = File(...),
    output_file: UploadFile = File(...),
    description: str = Form(""),
    land_type: str = Form(""),
    insights: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    try:
        input_content = await input_file.read()
        output_content = await output_file.read()
        
        import json
        try:
            insights_list = json.loads(insights)
        except:
            insights_list = [i.strip() for i in insights.split(",") if i.strip()]
            
        analysis_data = {
            "description": description,
            "land_type": land_type,
            "insights": insights_list
        }
        
        pdf_bytes = generate_pdf_report(input_content, output_content, analysis_data)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=SAR_Analysis_Report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.staticfiles import StaticFiles

# ... (keep existing codes) ...

# Mount static files (at the end of your app definitions)
# Ensure this folder exists in your deployment
if os.path.exists("frontend-dist"):
    app.mount("/", StaticFiles(directory="frontend-dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
