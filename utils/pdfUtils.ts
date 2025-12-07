import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to a matching version from unpkg which mirrors npm structure reliably.
// We explicitly use 4.10.38 to match the import map in index.html and avoid version mismatch errors.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

export const convertPdfToImages = async (file: File, maxPages: number = 10): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Loading the document.
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pageCount = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];

  const scale = 1.5; // Good balance between quality (for text/figures) and token usage

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    
    // Convert to JPEG base64 (without prefix for Gemini API usage if needed, but API usually accepts base64 string)
    // The canvas.toDataURL returns "data:image/jpeg;base64,..."
    // We strip the prefix for the API call in the service usually, but let's return raw base64 data part here.
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    images.push(base64);
  }

  return images;
};