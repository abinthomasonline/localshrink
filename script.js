function compressImages() {
    const input = document.getElementById('imageInput');
    const files = input.files;
    const resizePercentage = document.getElementById('resizePercentage').value / 100;
    const jpegQuality = document.getElementById('jpegQuality').value / 100;
    const imagesContainer = document.getElementById('imagesContainer');
    imagesContainer.innerHTML = ''; // Clear previous results

    const compressedImages = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const fileContainer = document.createElement('div');
                fileContainer.className = 'file-container';
                imagesContainer.appendChild(fileContainer);

                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                fileContainer.appendChild(imageContainer);

                // Original image
                const originalDiv = createImageBox('Original', e.target.result, file.size / 1024);
                imageContainer.appendChild(originalDiv);

                // Compress image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width * resizePercentage;
                canvas.height = img.height * resizePercentage;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

                // Compressed image
                const compressedSize = atob(compressedDataUrl.split(',')[1]).length / 1024;
                const compressedDiv = createImageBox('Compressed', compressedDataUrl, compressedSize);
                imageContainer.appendChild(compressedDiv);

                // Store compressed image data
                compressedImages.push({
                    name: `compressed_${file.name}`,
                    dataUrl: compressedDataUrl
                });

                // Download button
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download Compressed Image';
                downloadBtn.className = 'download-btn';
                downloadBtn.onclick = function() {
                    downloadImage(compressedDataUrl, `compressed_${file.name}`);
                };
                fileContainer.appendChild(downloadBtn);

                // If all images are processed, add the "Download All" button only if more than one image
                if (compressedImages.length === files.length && files.length > 1) {
                    addDownloadAllButton(compressedImages);
                }
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
    // Track compression event
    gtag('event', 'compress', {
        'event_category': 'Image',
        'event_label': 'Compress Images'
    });
}

function createImageBox(title, src, size) {
    const div = document.createElement('div');
    div.className = 'image-box';
    div.innerHTML = `
        <h3>${title}</h3>
        <img src="${src}" alt="${title} image">
        <p>Size: ${size.toFixed(2)} KB</p>
    `;
    return div;
}

function addDownloadAllButton(images) {
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.textContent = 'Download All as ZIP';
    downloadAllBtn.className = 'download-all-btn';
    downloadAllBtn.onclick = function() {
        downloadAllImagesAsZip(images);
    };
    document.getElementById('imagesContainer').prepend(downloadAllBtn);
}

function downloadAllImagesAsZip(images) {
    const zip = new JSZip();
    const promises = [];

    images.forEach(image => {
        const promise = fetch(image.dataUrl)
            .then(response => response.blob())
            .then(blob => {
                zip.file(image.name, blob);
            });
        promises.push(promise);
    });

    Promise.all(promises).then(() => {
        zip.generateAsync({type: "blob"}).then(content => {
            const link = document.createElement('a');
            link.download = 'compressed_images.zip';
            link.href = URL.createObjectURL(content);
            link.click();
            URL.revokeObjectURL(link.href);

            // Track download all as ZIP event
            gtag('event', 'download_all_zip', {
                'event_category': 'Image',
                'event_label': 'Download All Images as ZIP'
            });
        });
    });
}

function downloadImage(dataUrl, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    // Track download event
    gtag('event', 'download', {
        'event_category': 'Image',
        'event_label': fileName
    });
}