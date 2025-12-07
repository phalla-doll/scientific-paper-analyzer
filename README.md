# Scientific Paper Analyzer

A "world-class" multimodal research assistant designed to analyze academic papers (PDFs or text) using Google's Gemini 2.5 Flash model. The application "derenders" documents to extract structured data, visualize methodologies, interpret figures, and generate synthetic insights in a premium, dual-theme HUD-style interface.

![App Screenshot](https://via.placeholder.com/1200x600?text=Scientific+Paper+Analyzer+v3)

## ✨ Features

-   **Multimodal Analysis**: Upload PDF documents or paste raw text. The app rasterizes PDF pages into images to perform true visual analysis alongside text processing.
-   **Batch Processing**: Upload multiple PDF files simultaneously. The system aggregates content from all documents to perform a comprehensive batched analysis.
-   **Interactive Q&A**: After analysis, chat contextually with the paper. Ask follow-up questions like "Compare the sample size to standard protocols" or "Explain Figure 3 in simple terms," backed by the extracted knowledge graph.
-   **Dual-Theme HUD UI**: A sophisticated design system featuring **Light** and **Dark** modes. The interface uses a technical, 0-radius "Head-Up Display" aesthetic with glowing accents, corner brackets, and precise grid layouts.
-   **Structured Extraction**: Automatically extracts:
    -   **Executive Summary**: A synthesis of Hypothesis, Findings, and Conclusions.
    -   **Methodology**: Visualized as a structured timeline with context-aware icons.
    -   **Figures & Data**: Detects figure types (Charts, Micrographs, Diagrams) and extracts numerical data points.
-   **Adaptive Visualization**:
    -   **ASCII Charts**: Generates text-based bar charts for extracted data.
    -   **Logarithmic Scaling**: Automatically detects high-dynamic-range data and switches visualization to a logarithmic scale for better readability.
-   **Fault Tolerance & Diagnostics**: 
    -   **Graceful Recovery**: Integrated Error Boundaries wrap critical components.
    -   **Detailed Diagnostics**: Displays raw JSON error responses for debugging analysis failures.
-   **SEO & Social Ready**: Optimized with Open Graph tags, Twitter Cards, and PWA metadata.
-   **Export**: Download the full analysis as a formatted Markdown (`.md`) report.

## 🛠 Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Styling**: Tailwind CSS, CSS Animations
-   **AI/LLM**: Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash
-   **PDF Processing**: `pdfjs-dist` (Client-side rasterization)
-   **Icons**: `lucide-react`
-   **Analytics**: Google Analytics 4 (GA4)

## 🚀 Getting Started

### Prerequisites

You need a Google Gemini API Key to run the analysis.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/scientific-paper-analyzer.git
    cd scientific-paper-analyzer
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Ensure `process.env.API_KEY` is available in your environment variables.

4.  **Run the application**
    ```bash
    npm run dev
    ```

## 📖 Usage

1.  **Upload or Input**:
    -   **PDF**: Drag & drop one or multiple PDF research papers into the upload zone.
    -   **Text**: Paste an abstract or raw text snippet in the text area.
2.  **Analyze**: 
    -   Click "Start Analysis".
    -   Watch the multi-stage HUD loader (Rasterization -> Inference -> Synthesis).
    -   Use "Cancel Process" if you need to abort the operation.
3.  **Review**: Explore the structured results in the right panel.
    -   Toggle between **Light** and **Dark** modes using the sun/moon icon in the header.
    -   Hover over figure cards to see detailed findings and charts.
4.  **Interact**: Use the chat input to ask specific questions about the analyzed content.
5.  **Export**: Click "Export Report" to save as Markdown, or use the copy buttons for JSON/Summary text.

## 📂 Project Structure

```
├── components/
│   ├── LeftPanel.tsx      # Sidebar: Chat, Input, File Management
│   ├── RightPanel.tsx     # Main View: Analysis Results, Visualization
│   ├── JsonDisplay.tsx    # Data Rendering Engine (Charts, Methodology)
│   ├── AnalysisLoader.tsx # Multi-stage animated loading state
│   ├── CornerAccents.tsx  # Shared HUD UI decorator
│   ├── Button.tsx         # Reusable button component
│   └── ErrorBoundary.tsx  # Fault tolerance wrapper
├── services/
│   ├── geminiService.ts   # Google GenAI interaction logic & prompts
│   └── analytics.ts       # GA4 event tracking service
├── utils/
│   └── pdfUtils.ts        # PDF to Image conversion
├── App.tsx                # Main Controller (State Management)
├── types.ts               # TypeScript interfaces
├── index.html             # Entry HTML (Fonts, Tailwind Config)
└── index.tsx              # React Root
```

## 🧠 How It Works

1.  **PDF Rasterization**: The app uses `pdf.js` to convert the first 10 pages of uploaded PDFs into high-quality JPEG images within the browser.
2.  **Multimodal Prompting**: Images and text are sent to the **Gemini 2.5 Flash** model with a specific system instruction designed for scientific extraction.
3.  **Structured Output**: The model returns a strictly formatted JSON object adhering to a predefined schema (`PaperAnalysis`).
4.  **Contextual Chat**: The extracted JSON is fed back into the model context, allowing the user to query the structured data naturally.
5.  **Rendering**: The React frontend parses this JSON to render the interactive UI, applying adaptive scaling logic to charts and formatting technical data.

## 📄 License

MIT License.
