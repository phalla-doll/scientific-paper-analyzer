import { GoogleGenAI, Type } from "@google/genai";
import { PaperAnalysis, Message } from "../types";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    paper_title: { type: Type.STRING },
    core_hypothesis: { type: Type.STRING },
    methodology_summary: { type: Type.STRING },
    methodology_steps: {
      type: Type.ARRAY,
      description: "Break down the methodology into 2-5 distinct experimental phases (e.g. Synthesis, Characterization, Data Analysis).",
      items: {
        type: Type.OBJECT,
        properties: {
          stage_name: { type: Type.STRING, description: "Title of the experimental phase (e.g., 'Sample Preparation')" },
          steps: {
             type: Type.ARRAY,
             items: { type: Type.STRING },
             description: "Sequential list of specific actions taken in this phase."
          }
        },
        required: ["stage_name", "steps"]
      }
    },
    key_results: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    conclusions: { type: Type.STRING },
    limitations: { type: Type.STRING },
    figures_data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          caption: { type: Type.STRING },
          type: { type: Type.STRING },
          purpose: { type: Type.STRING },
          findings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List 2-4 key visual observations, numerical trends, or pattern descriptions visible in the figure."
          },
          data_points: {
            type: Type.ARRAY,
            description: "For quantitative charts (bar, line, scatter), extract 3-5 representative data points. Return empty array for diagrams/images.",
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "X-axis label or category" },
                value: { type: Type.NUMBER, description: "Y-axis numerical value" },
                unit: { type: Type.STRING, description: "Unit of measurement if available" }
              }
            }
          }
        },
        required: ["caption", "type", "purpose", "findings", "data_points"]
      }
    }
  },
  required: ["paper_title", "core_hypothesis", "methodology_summary", "methodology_steps", "key_results", "conclusions", "limitations", "figures_data"]
};

export const analyzePaper = async (content: { images?: string[], text?: string }): Promise<PaperAnalysis> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }

  const parts: any[] = [];
  
  if (content.images && content.images.length > 0) {
    content.images.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: img
        }
      });
    });
  }

  if (content.text) {
    parts.push({ text: content.text });
  }

  const isTextOnly = (!content.images || content.images.length === 0);

  // Add the prompt as the last part
  const systemPrompt = `
    You are a precise scientific research assistant. Analyze the provided ${isTextOnly ? 'text' : 'images'} of a research paper. 
    Perform a multimodal analysis: extract text${isTextOnly ? '' : ' and visually interpret all figures, tables, and charts'}.
    
    Return a strictly valid JSON object matching the requested schema.
    
    For 'methodology_steps':
    - Group the methods into distinct chronological or logical phases (e.g., "1. Material Synthesis", "2. Device Fabrication", "3. Optical Characterization").
    - Within each phase, list the specific procedural steps.
    
    For 'figures_data':
    ${isTextOnly 
      ? "- Since no images are provided, strictly return an empty array []." 
      : "- 'findings': Provide a detailed list of observations. If it's a chart, cite values. If it's a micrograph, describe features.\n- 'data_points': If the figure is a chart (bar, line, scatter, etc.), extract representative data points."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          ...parts,
          { text: systemPrompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2, // Low temperature for factual extraction
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from model");

    return JSON.parse(textResponse) as PaperAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithPaper = async (
  currentAnalysis: PaperAnalysis, 
  userMessage: string, 
  history: Message[]
): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing.");

  // Construct a concise context from the structured analysis
  const context = `
    You are a helpful research assistant. You have already analyzed a paper. 
    Here is the structured data you extracted:
    Title: ${currentAnalysis.paper_title}
    Hypothesis: ${currentAnalysis.core_hypothesis}
    Key Results: ${currentAnalysis.key_results.join('; ')}
    Methodology: ${currentAnalysis.methodology_summary}
    Conclusions: ${currentAnalysis.conclusions}
    
    User Question: ${userMessage}
    
    Answer the user's question based strictly on the paper's data provided above. 
    Be concise, scientific, and direct. Do not make up facts not present in the analysis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: context }]
      }
    });

    return response.text || "I couldn't generate a response based on the paper's data.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};