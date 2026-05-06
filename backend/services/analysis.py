import google.generativeai as genai
import os
from PIL import Image
import io
import base64
from dotenv import load_dotenv
import warnings

# Suppress the deprecation warning for the old generativeai package for now
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

load_dotenv()

def analyze_image(image_bytes):
    """
    Use Google Gemini to analyze the colorized SAR image.
    Returns description, land type, and research insights.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {
            "description": "API key not configured.",
            "land_type": "Unknown",
            "insights": ["Please set GOOGLE_API_KEY in .env"]
        }

    genai.configure(api_key=api_key)
    # Using 'models/gemini-flash-latest' which was confirmed available on your system
    model = genai.GenerativeModel('models/gemini-flash-latest')

    prompt = """
    Analyze this colorized SAR (Synthetic Aperture Radar) satellite image. 
    Provide the following in a structured format:
    1. Description: A concise 1-2 sentence description of the scene.
    2. Land Type: Classify the predominant land type into EXACTLY ONE of these categories: (urban, vegetation, water, barren, mixed).
    3. Insights: Provide 2-3 research-style insights about the features.
    
    Format EXACTLY like this:
    Description: <text>
    Land Type: <category>
    Insights:
    - <insight 1>
    - <insight 2>
    """

    img = Image.open(io.BytesIO(image_bytes))
    
    try:
        response = model.generate_content([prompt, img])
        text = response.text
        
        # Parse the response (simple parsing based on the prompt format)
        description = ""
        land_type = ""
        insights = []
        
        lines = text.strip().split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.startswith("Description:"):
                description = line.replace("Description:", "").strip()
            elif line.startswith("Land Type:"):
                land_type = line.replace("Land Type:", "").strip()
            elif line.startswith("Insights:"):
                current_section = "insights"
            elif line.startswith("-") and current_section == "insights":
                insights.append(line.replace("-", "").strip())
                
        return {
            "description": description or "Satellite imagery showing varied terrain features.",
            "land_type": land_type or "Mixed",
            "insights": insights or ["Structure preservation is visible.", "Color distribution suggests distinct land features."]
        }
    except Exception as e:
        print(f"Gemini Analysis Error: {e}")
        return {
            "description": "Error analyzing image with AI.",
            "land_type": "Unavailable",
            "insights": ["Failed to connect to Gemini API."]
        }
