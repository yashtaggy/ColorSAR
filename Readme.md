# ColorSAR - AI-Powered SAR Image Analysis Platform

A production-ready platform for colorizing Synthetic Aperture Radar (SAR) imagery and performing intelligent land analysis using GANs and Google Gemini Vision.

## 🚀 Features

- **Advanced SAR Colorization**: Uses a trained GAN (ResNet-DenseNet Ensemble) for high-fidelity grayscale to RGB conversion.
- **AI Enhancement Pipeline**: Multi-stage post-processing (CLAHE, Denoising, Sharpening) informed by AI analysis.
- **Intelligent Insights**: Leverages Google Gemini 1.5 Flash to describe scenes, classify land types, and provide research insights.
- **Professional Reports**: Automatically generate PDF analysis reports containing comparison images and AI-derived metadata.
- **Premium UI**: Modern dark-themed dashboard with glassmorphism and responsiveness.

## 🛠️ Tech Stack

- **Backend**: FastAPI, PyTorch, OpenCV, ReportLab, Google Generative AI
- **Frontend**: React, Vite, Framer Motion, Lucide Icons, Axios
- **AI Models**: Custom GAN for colorization, Gemini 1.5 Flash for Vision Analysis

## 📦 Installation

### Backend Setup
1. Navigate to the root directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file from `.env.example` and add your `GOOGLE_API_KEY`.
4. Run the server:
   ```bash
   cd backend
   python main.py
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```text
backend/
  ├── main.py            # FastAPI Entry Point
  ├── routes/            # API Route definitions
  └── services/
      ├── model.py       # GAN Model Inference
      ├── postprocess.py # Vision enhancement (OpenCV)
      ├── enhance.py     # AI-Informed enhancement
      ├── analysis.py    # Gemini Vision Integration
      └── report.py      # PDF Generation
frontend/
  ├── src/
  |   ├── App.jsx        # Main Dashboard
  |   └── index.css      # Premium Styling
  └── vite.config.js     # Proxy setup
```

## 🧪 Deployment

- **Frontend**: Deploy to Vercel/Netlify.
- **Backend**: Deploy to Render/Railway using the provided `requirements.txt`. Ensure `.pth` model files are uploaded or downloaded during build.

---
*Note: This project requires PyTorch and a Google Gemini API Key for full functionality.*
