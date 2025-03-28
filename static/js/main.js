let currentImageData = null;

// Run when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get HTML elements
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('imageInput');
    const preview = document.getElementById('imagePreview');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const resultsSection = document.getElementById('results-section');
    const boxesContainer = document.getElementById('boundingBoxes');
    const analysisSection = document.getElementById('analysis-section');
    
    // Hide sections initially
    resultsSection.style.display = 'none';
    analysisSection.style.display = 'none';
    
    // Show image when selected
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                boxesContainer.innerHTML = '';
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Handle form submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select an image first');
            return;
        }
        
        // Show loading spinner
        loadingDiv.style.display = 'block';
        resultsDiv.innerHTML = '';
        boxesContainer.innerHTML = '';
        
        // Create data to send
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            // Step 1: Detect dates
            const response = await fetch('/detect', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            currentImageData = data;
            resultsSection.style.display = 'block';
            
            if (response.ok) {
                if (data.detections && data.detections.length > 0) {
                    // Show results
                    let html = '<h3>Detection Results</h3>';
                    
                    data.detections.forEach((item, index) => {
                        html += `
                            <div class="result-item">
                                <div class="date-text">Date ${index + 1}: ${item.paddle_text || 'Unknown'}</div>
                                <div class="confidence">Detection: ${(item.detection_confidence * 100).toFixed(1)}%</div>
                                <div class="confidence ${item.paddle_confidence < 50 ? 'low-confidence' : ''}">
                                    OCR: ${item.paddle_confidence.toFixed(1)}%
                                    ${item.paddle_confidence < 50 ? 'Low confidence' : ''}
                                </div>
                            </div>
                        `;
                    });
                    
                    resultsDiv.innerHTML = html;
                    
                    // Draw boxes on image
                    drawBoxes(data.detections, data.image_width, data.image_height);
                } else {
                    resultsDiv.innerHTML = '<div class="error">No dates detected</div>';
                }
                
                // Step 2: Analyze text
                analyzeImage(file);
                
            } else {
                resultsDiv.innerHTML = `<div class="error">Error: ${data.error || 'Failed to process'}</div>`;
            }
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error">Error: ${error.message || 'Connection failed'}</div>`;
        } finally {
            loadingDiv.style.display = 'none';
        }
    });
    
    // Fix boxes when window size changes
    window.addEventListener('resize', function() {
        if (currentImageData) {
            drawBoxes(
                currentImageData.detections, 
                currentImageData.image_width, 
                currentImageData.image_height
            );
        }
    });
});

// Draw boxes on image
function drawBoxes(detections, imageWidth, imageHeight) {
    const container = document.getElementById('boundingBoxes');
    container.innerHTML = '';
    
    const img = document.getElementById('imagePreview');
    const scale = img.offsetWidth / imageWidth;
    
    detections.forEach((item, index) => {
        const [x1, y1, x2, y2] = item.bbox;
        
        // Create box
        const box = document.createElement('div');
        box.className = 'box';
        box.style.left = `${x1 * scale}px`;
        box.style.top = `${y1 * scale}px`;
        box.style.width = `${(x2 - x1) * scale}px`;
        box.style.height = `${(y2 - y1) * scale}px`;
        
        // Add label
        const label = document.createElement('div');
        label.className = 'box-label';
        label.textContent = `Date ${index + 1}`;
        box.appendChild(label);
        
        container.appendChild(box);
    });
}

// Get text analysis
async function analyzeImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show results
            document.getElementById('originalText').textContent = data.original_text || 'No text found';
            document.getElementById('translatedText').textContent = data.translated_text || 'No text found';
            document.getElementById('analysisResult').textContent = data.analysis || 'No analysis available';
            
            document.getElementById('analysis-section').style.display = 'block';
        } else {
            document.getElementById('analysisResult').textContent = `Error: ${data.error || 'Analysis failed'}`;
        }
    } catch (error) {
        document.getElementById('analysisResult').textContent = 'Error: Server connection failed';
    }
} 