# Scientific Paper Analyzer

A "world-class" multimodal research assistant designed to analyze academic papers (PDFs or text) using Google's Gemini 2.5 Flash model. The application "derenders" documents to extract structured data, visualize methodologies, interpret figures, and generate synthetic insights in a premium, dark-mode HUD-style interface.

## ✨ Features

-   **Multimodal Analysis**: Upload PDF documents or paste raw text. The app rasterizes PDF pages into images to perform true visual analysis alongside text processing.
-   **Interactive Q&A**: After analysis, chat contextually with the paper. Ask follow-up questions like "Compare the sample size to standard protocols" or "Explain Figure 3 in simple terms," backed by the extracted knowledge graph.
-   **Structured Extraction**: Automatically extracts:
    -   Core Hypothesis
    -   Methodology (Visualized as a structured timeline)
    -   Key Results
    -   Conclusions & Limitations
    -   Figure Data (Captions, Types, Findings, Data Points)
-   **Data Visualization**:
    -   **Methodology Timeline**: Graphical representation of experimental phases (Synthesis, Characterization, Analysis, etc.) with context-aware icons.
    -   **Figure Interpretation**: Detects figure types (Charts, Micrographs, Diagrams) and generates text-based ASCII charts for extracted numerical data.
-   **Fault Tolerance**: Integrated React Error Boundaries wrap critical components (Visualization Engine, Chat Log) to ensure graceful failure handling. If a module crashes, users can reset it without losing the entire application state.
-   **Export**: Download the full analysis as a formatted Markdown (`.md`) report.
-   **Premium Dark Mode & HUD Aesthetic**: A sophisticated, fully dark-themed interface (Zinc/Black palette) designed with a technical, 0-radius "Head-Up Display" visual style. Features glowing accents, corner brackets, monospaced typography, and precise grid layouts for a professional research environment.

## 🛠 Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Styling**: Tailwind CSS
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
    -   **PDF**: Click the large drop-zone in the left panel to select a PDF research paper.
    -   **Text**: Paste an abstract or raw text snippet in the text area above the upload button.
2.  **Analyze**: Watch the multi-stage HUD loader as the app processes the document (Rasterization -> Inference -> Synthesis).
3.  **Review**: Explore the structured results in the right panel.
    -   Hover over figure cards to see detailed findings and ASCII charts.
    -   View the visual breakdown of methodology steps.
4.  **Interact**: Use the chat input in the left panel to ask specific questions about the analyzed paper.
5.  **Export**: Click "Export Report" to save the analysis as a Markdown file, or "Copy JSON" for raw data.

## 📂 Project Structure

```
├── components/
│   ├── Button.tsx         # Reusable button component
│   ├── JsonDisplay.tsx    # Main visualization component for analysis results
│   └── ErrorBoundary.tsx  # React Error Boundary for graceful crash handling
├── services/
│   └── geminiService.ts   # Google GenAI interaction logic & prompts
│   └── analytics.ts       # GA4 event tracking service
├── utils/
│   └── pdfUtils.ts        # PDF to Image conversion using PDF.js
├── App.tsx                # Main application layout, state management, and HUD Loader
├── types.ts               # TypeScript interfaces
├── index.html             # Entry HTML
└── index.tsx              # React Root
```

## 🧠 How It Works

1.  **PDF Rasterization**: The app uses `pdf.js` to convert the first 10 pages of a PDF into high-quality JPEG images within the browser.
2.  **Multimodal Prompting**: These images (or provided text) are sent to the **Gemini 2.5 Flash** model with a specific system instruction designed for scientific extraction.
3.  **Structured Output**: The model returns a strictly formatted JSON object adhering to a predefined schema (`PaperAnalysis`).
4.  **Contextual Chat**: The extracted JSON is fed back into the model context, allowing the user to query the structured data naturally.
5.  **Rendering**: The React frontend parses this JSON to render the interactive UI, categorizing figures by type and visualizing data arrays using a custom design system.

## 📄 License

MIT License.