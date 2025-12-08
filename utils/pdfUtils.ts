import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to a matching version from unpkg which mirrors npm structure reliably.
// We explicitly use 4.10.38 to match the import map in index.html and avoid version mismatch errors.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

interface ConversionResult {
  images: string[];
  truncated: boolean;
  processedPages: number;
  totalPages: number;
}

export const convertPdfToImages = async (file: File, maxPages: number = 20): Promise<ConversionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Loading the document.
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const pagesToProcess = Math.min(totalPages, maxPages);
  const truncated = totalPages > maxPages;
  
  const images: string[] = [];
  const scale = 1.5; // Good balance between quality (for text/figures) and token usage

  for (let i = 1; i <= pagesToProcess; i++) {
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
    
    // Convert to JPEG base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    images.push(base64);
  }

  return {
    images,
    truncated,
    processedPages: images.length,
    totalPages
  };
};