const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const colorizeBtn = document.getElementById('colorize-btn');
const inputPreview = document.getElementById('input-preview');
const outputPreview = document.getElementById('output-preview');
const resultSection = document.getElementById('result-section');
const loader = document.getElementById('loader');

let currentFile = null;

// Handle Drag and Drop events
dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
};

dropZone.ondragleave = () => {
    dropZone.classList.remove('active');
};

dropZone.onclick = () => {
    fileInput.click();
};

fileInput.onchange = (e) => {
    handleFile(e.target.files[0]);
};

dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    handleFile(e.dataTransfer.files[0]);
};

function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        currentFile = file;
        colorizeBtn.disabled = false;

        // Show input preview
        const reader = new FileReader();
        reader.onload = (e) => {
            inputPreview.src = e.target.result;
            resultSection.style.display = 'block';
            outputPreview.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

colorizeBtn.onclick = async () => {
    if (!currentFile) return;

    // Show loader
    loader.style.display = 'block';
    outputPreview.style.display = 'none';
    colorizeBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            outputPreview.src = url;
            outputPreview.style.display = 'block';
        } else {
            alert('Error during colorization: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not connect to the API server.');
    } finally {
        loader.style.display = 'none';
        colorizeBtn.disabled = false;
    }
};
