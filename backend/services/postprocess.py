import cv2
import numpy as np

def apply_clahe(image):
    """Apply CLAHE to each channel of an RGB image."""
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    return cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)

def apply_sharpening(image):
    """Apply a sharpening filter."""
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    return cv2.filter2D(image, -1, kernel)

def apply_saturation_boost(image, factor=1.5):
    """Boost saturation in HSV space."""
    hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV).astype("float32")
    hsv[:,:,1] *= factor
    hsv[:,:,1] = np.clip(hsv[:,:,1], 0, 255)
    return cv2.cvtColor(hsv.astype("uint8"), cv2.COLOR_HSV2RGB)

def apply_denoising(image):
    """Apply OpenCV fastNlMeansDenoisingColored."""
    return cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)

def apply_histogram_equalization(image):
    """Apply histogram equalization."""
    # Convert to YCrCb
    ycrcb = cv2.cvtColor(image, cv2.COLOR_RGB2YCrCb)
    channels = list(cv2.split(ycrcb))
    channels[0] = cv2.equalizeHist(channels[0])
    ycrcb = cv2.merge(channels)
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB)

def run_postprocessing_pipeline(image, saturation=1.2, sharpness=1.0, contrast=1.0):
    """Run the mandatory post-processing pipeline with adjustable parameters."""
    img = image.copy()
    
    # 1. Denoising
    img = apply_denoising(img)
    
    # 2. CLAHE (Contrast)
    # Adjust clipLimit based on contrast
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0 * contrast, tileGridSize=(8, 8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2RGB)
    
    # 3. Sharpening
    if sharpness > 0:
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        img = cv2.filter2D(img, -1, kernel * sharpness)
    
    # 4. Saturation boost
    img = apply_saturation_boost(img, factor=saturation)
    
    return img
