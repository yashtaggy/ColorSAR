import cv2
import numpy as np
from .analysis import analyze_image
from .postprocess import run_postprocessing_pipeline, apply_saturation_boost

def apply_color_matching(image, land_type):
    """
    Advanced Optical Emulation (AOE) system.
    Forces SAR output to match professional optical satellite palettes.
    """
    # 1. Start with a clean copy and convert to float for precision
    img = image.astype("float32") / 255.0
    land_type = land_type.lower()
    
    # 2. Semantic Color Mapping (Optical Sentinel-2 Profiles)
    if "vegetation" in land_type:
        # Target: Lush emerald greens, muted earthy browns
        # Increase Green, Neutralize Blue, Moderate Red
        img[:,:,0] *= 0.85 # Red
        img[:,:,1] *= 1.55 # Green (Vibrant vegetation)
        img[:,:,2] *= 0.70 # Blue (Deep shadows)
    elif "water" in land_type:
        # Target: Deep Navy or Turquoise
        img[:,:,0] *= 0.60
        img[:,:,1] *= 0.90
        img[:,:,2] *= 1.75 # High blue/cyan
    elif "urban" in land_type:
        # Target: Concrete gray with artificial highlights
        img[:,:,0] *= 1.15 # Slight red tint for roofs/roads
        img[:,:,1] *= 1.05
        img[:,:,2] *= 1.05
    elif "barren" in land_type or "mixed" in land_type:
        # Target: Sand/Clay beiges
        img[:,:,0] *= 1.40 # High red for earth tones
        img[:,:,1] *= 1.20 # Medium green for dry grass
        img[:,:,2] *= 0.80

    # 3. Dynamic Range Expansion
    img = np.clip(img, 0, 1)
    
    # 4. Convert back to uint8 for final CV2 passes
    img_uint8 = (img * 255).astype("uint8")
    
    # 5. LAB Space Enhancement (Contrast & Vibrancy)
    lab = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    
    # High-intensity CLAHE for 'depth'
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(16, 16))
    l = clahe.apply(l)
    
    # Saturation boost in AB channels
    a = cv2.multiply(a, 1.2)
    b = cv2.multiply(b, 1.2)
    
    merged_lab = cv2.merge((l, a, b))
    final_rgb = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2RGB)
    
    # 6. Subtle Unsharp Mask for 'High-Res' effect
    blurred = cv2.GaussianBlur(final_rgb, (0, 0), 3)
    final_rgb = cv2.addWeighted(final_rgb, 1.5, blurred, -0.5, 0)
    
    return final_rgb

def enhance_image_with_ai(image_np, image_bytes, saturation=1.2, sharpness=1.0, contrast=1.0):
    """
    AI Enhancement step that bridges the gap between SAR model and Optical reality.
    """
    try:
        # 1. Get AI Analysis
        analysis = analyze_image(image_bytes)
        land_type = analysis.get("land_type", "mixed")
        
        # 2. Base enhancement with user options
        enhanced_img = run_postprocessing_pipeline(image_np, saturation=saturation, sharpness=sharpness, contrast=contrast)
        
        # 3. Semantic Color Correction (The 'Excellent' part)
        enhanced_img = apply_color_matching(enhanced_img, land_type)
        
        return enhanced_img, analysis
    except Exception as e:
        print(f"AI Enhancement Fallback: {e}")
        return run_postprocessing_pipeline(image_np, saturation=saturation, sharpness=sharpness, contrast=contrast), None
