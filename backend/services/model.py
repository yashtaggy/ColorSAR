import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import ResNet50_Weights, DenseNet121_Weights
import os
from PIL import Image
import numpy as np
import cv2
from skimage.color import rgb2lab, lab2rgb
from torchvision import transforms

# --- Denoising Model (DnCNN) ---
class DnCNN(nn.Module):
    def __init__(self, depth=17, n_channels=64):
        super(DnCNN, self).__init__()
        layers = [nn.Conv2d(1, n_channels, kernel_size=3, padding=1), nn.ReLU(inplace=True)]
        for _ in range(depth - 2):
            layers.append(nn.Conv2d(n_channels, n_channels, kernel_size=3, padding=1))
            layers.append(nn.BatchNorm2d(n_channels))
            layers.append(nn.ReLU(inplace=True))
        layers.append(nn.Conv2d(n_channels, 1, kernel_size=3, padding=1))
        self.dncnn = nn.Sequential(*layers)

    def forward(self, x):
        return x - self.dncnn(x)

# --- Colorization Encoder ---
class EnsembleEncoder(nn.Module):
    def __init__(self):
        super(EnsembleEncoder, self).__init__()
        self.resnet50 = models.resnet50(weights=ResNet50_Weights.DEFAULT)
        self.densenet121 = models.densenet121(weights=DenseNet121_Weights.DEFAULT)

        self.resnet50 = nn.Sequential(*list(self.resnet50.children())[:-2])
        self.densenet121.classifier = nn.Identity()

        self.conv1x1_resnet50 = nn.ModuleList([
            nn.Conv2d(256, 128, kernel_size=1),
            nn.Conv2d(512, 256, kernel_size=1),
            nn.Conv2d(1024, 512, kernel_size=1),
            nn.Conv2d(2048, 1024, kernel_size=1)
        ])

        self.conv1x1_densenet121 = nn.ModuleList([
            nn.Conv2d(256, 128, kernel_size=1),
            nn.Conv2d(512, 256, kernel_size=1),
            nn.Conv2d(1024, 512, kernel_size=1),
            nn.Conv2d(1024, 1024, kernel_size=1)
        ])

        self.fusion_blocks = nn.ModuleList([
            self.fusion_block(128, 128),
            self.fusion_block(256, 256),
            self.fusion_block(512, 512),
            self.fusion_block(1024, 1024)
        ])

    def fusion_block(self, in_channels_resnet, in_channels_densenet):
        return nn.Sequential(
            nn.Conv2d(in_channels_resnet + in_channels_densenet, in_channels_resnet, kernel_size=1),
            nn.BatchNorm2d(in_channels_resnet),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        resnet_features = []
        resnet_input = x
        for i, layer in enumerate(self.resnet50.children()):
            resnet_input = layer(resnet_input)
            if i in [4, 5, 6, 7]:
                resnet_features.append(self.conv1x1_resnet50[i-4](resnet_input))

        densenet_features = []
        idx = 0
        densenet_input = x
        for i, layer in enumerate(self.densenet121.features):
            densenet_input = layer(densenet_input)
            if i in [4, 6, 8, 11]:
                densenet_features.append(self.conv1x1_densenet121[idx](densenet_input))
                idx += 1

        fused_features = []
        for i in range(4):
            fused = torch.cat((resnet_features[i], densenet_features[i]), dim=1)
            fused = self.fusion_blocks[i](fused)
            fused_features.append(fused)

        return fused_features

# --- Colorization Decoder ---
class Decoder(nn.Module):
    def __init__(self):
        super(Decoder, self).__init__()
        self.decode1 = nn.Sequential(
            nn.Conv2d(1024, 512, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )
        self.decode2 = nn.Sequential(
            nn.Conv2d(512 + 512, 256, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )
        self.decode3 = nn.Sequential(
            nn.Conv2d(256 + 256, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )
        self.decode4 = nn.Sequential(
            nn.Conv2d(128 + 128, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )
        self.decode5 = nn.Sequential(
            nn.Conv2d(64, 2, kernel_size=3, stride=1, padding=1),
            nn.Tanh(),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )

    def forward(self, features_7x7, features_14x14, features_28x28, features_56x56):
        x = self.decode1(features_7x7)
        x = torch.cat([x, features_14x14], dim=1)
        x = self.decode2(x)
        x = torch.cat([x, features_28x28], dim=1)
        x = self.decode3(x)
        x = torch.cat([x, features_56x56], dim=1)
        x = self.decode4(x)
        output = self.decode5(x)
        return output

# --- Full Colorization Model ---
class ColorizationModel(nn.Module):
    def __init__(self, encoder, decoder):
        super(ColorizationModel, self).__init__()
        self.encoder = encoder
        self.decoder = decoder

    def forward(self, x):
        features_56x56, features_28x28, features_14x14, features_7x7 = self.encoder(x)
        output = self.decoder(features_7x7, features_14x14, features_28x28, features_56x56)
        return output

# --- Inference Support ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_models(color_pth, dncnn_pth):
    encoder = EnsembleEncoder()
    decoder = Decoder()
    color_model = ColorizationModel(encoder, decoder).to(device)
    dncnn_model = DnCNN().to(device)
    
    if os.path.exists(color_pth):
        try:
            color_model.load_state_dict(torch.load(color_pth, map_location=device, weights_only=False))
        except:
            color_model = torch.load(color_pth, map_location=device, weights_only=False)
    
    if os.path.exists(dncnn_pth):
        try:
            dncnn_model.load_state_dict(torch.load(dncnn_pth, map_location=device, weights_only=False))
        except:
            dncnn_model = torch.load(dncnn_pth, map_location=device, weights_only=False)
            
    color_model.eval()
    dncnn_model.eval()
    return color_model, dncnn_model

def preprocess(image_bytes, target_size=(224, 224)):
    img_pil = Image.open(image_bytes).convert('L')
    original_size = img_pil.size
    img_np = np.array(img_pil)
    
    img_resized = cv2.resize(img_np, target_size)
    img_3ch = cv2.merge((img_resized, img_resized, img_resized))
    
    img_lab = rgb2lab(img_3ch).astype("float32")
    img_lab_tensor = transforms.ToTensor()(img_lab)
    
    L_channel = img_lab_tensor[[0], ...]
    L_scaled = 2 * (L_channel) / 100 - 1
    
    return L_scaled.unsqueeze(0).to(device), img_np, original_size

def infer(color_model, dncnn_model, L_scaled, img_original_np, original_size):
    with torch.no_grad():
        denoised_L = dncnn_model(L_scaled)
        denoised_L_3ch = torch.cat([denoised_L, denoised_L, denoised_L], dim=1)
        ab_pred = color_model(denoised_L_3ch)
        
        # Initial postprocess (combine with original high-res L)
        ab_pred_np = ab_pred.squeeze(0).cpu().numpy()
        ab_pred_np = (ab_pred_np + 1) * 127.5 - 128
        ab_pred_np = ab_pred_np.transpose(1, 2, 0)
        
        W, H = original_size
        ab_upscaled = cv2.resize(ab_pred_np, (W, H), interpolation=cv2.INTER_CUBIC)
        
        L_lab = img_original_np.astype("float32") * 100.0 / 255.0
        lab_high_res = np.zeros((H, W, 3), dtype="float32")
        lab_high_res[:, :, 0] = L_lab
        lab_high_res[:, :, 1:] = ab_upscaled
        
        with np.errstate(invalid='ignore'):
            rgb = lab2rgb(lab_high_res.astype("float64"))
        rgb = (rgb * 255).astype("uint8")
        
    return rgb
