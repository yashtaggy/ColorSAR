import os
import io
import torch
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from PIL import Image
from model_lib import ColorizationModel, EnsembleEncoder, Decoder, DnCNN
from utils import preprocess_image, postprocess_results
import numpy as np

app = FastAPI(title="ColorSAR API - High Res")

# Setup device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Model Global Variables
color_model = None
dncnn_model = None

@app.on_event("startup")
def load_models():
    global color_model, dncnn_model
    
    # Initialize architectures
    encoder = EnsembleEncoder()
    decoder = Decoder()
    color_model = ColorizationModel(encoder, decoder).to(device)
    dncnn_model = DnCNN().to(device)
    
    # Path to weights
    color_weights = "color_model.pth"
    dncnn_weights = "dcnn.pth"
    
    if os.path.exists(color_weights):
        try:
            color_model.load_state_dict(torch.load(color_weights, map_location=device, weights_only=False))
        except Exception:
            color_model = torch.load(color_weights, map_location=device, weights_only=False)
        print("Loaded Colorization Model weights.")
    else:
        print(f"Warning: {color_weights} not found. Running with random weights.")
        
    if os.path.exists(dncnn_weights):
        try:
           dncnn_model.load_state_dict(torch.load(dncnn_weights, map_location=device, weights_only=False))
        except Exception:
           dncnn_model = torch.load(dncnn_weights, map_location=device, weights_only=False)
        print("Loaded Denoising Model weights.")
    else:
        print(f"Warning: {dncnn_weights} not found. Running with random weights.")
    
    color_model.eval()
    dncnn_model.eval()

@app.post("/predict")
async def predict_color(file: UploadFile = File(...)):
    # Read the file
    content = await file.read()
    input_image_path = "temp_input.png"
    with open(input_image_path, "wb") as f:
        f.write(content)
        
    # Preprocess
    with torch.no_grad():
        # L_scaled is for the model, img_original_np is for the high-res base
        L_scaled, img_original_np, original_size = preprocess_image(input_image_path)
        L_scaled = L_scaled.to(device)
        
        # 1. Denoise the L channel
        denoised_L = dncnn_model(L_scaled)
        
        # 2. Colorize
        # Color model expects 3Ch input (expanded from denoised L)
        denoised_L_3ch = torch.cat([denoised_L, denoised_L, denoised_L], dim=1)
        ab_pred = color_model(denoised_L_3ch)
        
        # 3. High-Res Post-process (Combine AI colors with High-Res original texture)
        colorized_rgb = postprocess_results(img_original_np, ab_pred, original_size)
    
    # Convert RGB result to bytes for response
    colorized_img = Image.fromarray(colorized_rgb)
    buf = io.BytesIO()
    colorized_img.save(buf, format="PNG")
    byte_im = buf.getvalue()
    
    # Remove temp file
    if os.path.exists(input_image_path):
        os.remove(input_image_path)
        
    return Response(content=byte_im, media_type="image/png")

# Serve the static frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
