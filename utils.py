import torch
import numpy as np
import cv2
from PIL import Image
from skimage.color import rgb2lab, lab2rgb
from torchvision import transforms

def preprocess_image(image_path, target_size=(224, 224)):
    """
    Preprocess a SAR image for inference.
    1. Read original grayscale.
    2. Convert original L to a tensor for inference (but keep a backup for reconstruction).
    3. Scale L channel to [-1, 1].
    """
    img_pil = Image.open(image_path).convert('L')
    original_size = img_pil.size  # (W, H)
    img_np = np.array(img_pil)
    
    # Save the original L channel for high-res output
    # (Optional: we can normalize this high-res L if needed)
    
    # Resize for the model
    img_resized = cv2.resize(img_np, target_size)
    
    # We need a 3-channel input for the encoder because it's based on ResNet (RGB)
    img_3ch = cv2.merge((img_resized, img_resized, img_resized))
    
    # Lab conversion for the model
    img_lab = rgb2lab(img_3ch).astype("float32")
    img_lab_tensor = transforms.ToTensor()(img_lab)
    
    L_channel = img_lab_tensor[[0], ...]
    
    # Standard scaling used in the notebook:
    # L scaling: 2 * (L - 0) / (100 - 0) - 1
    L_scaled = 2 * (L_channel) / 100 - 1
    
    return L_scaled.unsqueeze(0), img_np, original_size

def postprocess_results(L_original_np, ab_pred_tensor, original_size, saturation_factor=1.5):
    """
    Combine predicted AB channels (upscaled) back with the original high-res L channel.
    Adds a saturation factor to make the AI-predicted colors more vibrant (Optical-like).
    """
    # 1. Upscale ab_pred to original_size (W, H)
    ab_pred = ab_pred_tensor.squeeze(0).cpu().numpy() # [2, 224, 224]
    
    # Boost saturation/vibrancy by multiplying the a* and b* channels
    # These channels represent color differences from neutral gray.
    # Multiplying them by a factor > 1 makes the colors more intense.
    ab_pred = ab_pred * saturation_factor
    
    # Rescale back to Lab range (-128 to 127)
    ab_pred = (ab_pred + 1) * 127.5 - 128
    
    # ab_pred is [C, H, W] -> [H, W, C]
    ab_pred = ab_pred.transpose(1, 2, 0)
    
    # Resize predicted colors back to the original image dimensions
    W, H = original_size
    ab_upscaled = cv2.resize(ab_pred, (W, H), interpolation=cv2.INTER_CUBIC)
    
    # 2. Get the original L channel (normalize correctly)
    # Original L is 0-255, but we need Lab L (0-100)
    L_lab = L_original_np.astype("float32") * 100.0 / 255.0
    
    # 3. Combine
    lab_high_res = np.zeros((H, W, 3), dtype="float32")
    lab_high_res[:, :, 0] = L_lab
    lab_high_res[:, :, 1:] = ab_upscaled
    
    # 4. Convert Lab to RGB
    # Note: clipping is handled inside lab2rgb, but we can ensure stability
    with np.errstate(invalid='ignore'):
        rgb = lab2rgb(lab_high_res.astype("float64"))
        
    rgb = (rgb * 255).astype("uint8")
    
    return rgb
