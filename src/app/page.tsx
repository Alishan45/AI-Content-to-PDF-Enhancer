"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { jsPDF } from "jspdf";

export default function Home() {
  const [inputType, setInputType] = useState<"text" | "url">("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [enhanceWithAI, setEnhanceWithAI] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  const MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast & Versatile)" },
    { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash-8B (Lightweight & Fast)" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Complex Tasks)" },
    { id: "gemini-pro", name: "Gemini Pro (Legacy)" },
  ];

  const generatePDF = async () => {
    setIsGenerating(true);
    setError("");

    let textToProcess = "";

    try {
      if (inputType === "text") {
        if (!content.trim()) {
          throw new Error("Please enter some text.");
        }
        textToProcess = content;
      } else {
        if (!url.trim() || !url.startsWith("http")) {
          throw new Error("Please enter a valid URL starting with http:// or https://");
        }

        const response = await fetch("/api/fetch-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch webpage content.");
        }

        textToProcess = data.text;
      }

      // AI Enhancement Step
      if (enhanceWithAI) {
        const response = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToProcess, modelName: selectedModel }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to enhance content with AI.");
        }

        textToProcess = data.enhancedText;
      }

      // PDF Generation Logic
      const doc = new jsPDF();

      // Simple configuration
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;
      const lineHeight = 7;
      let cursorY = margin;

      // Add a title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Generated AI Content", margin, cursorY);
      cursorY += lineHeight * 2;

      // Add body
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const lines = doc.splitTextToSize(textToProcess, maxLineWidth);

      lines.forEach((line: string) => {
        if (cursorY > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      doc.save("generated-content.pdf");

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-3xl w-full space-y-6 sm:space-y-8 bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-xl shadow-lg transition-colors duration-300 mt-10">
        <div>
          <h2 className="mt-2 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            AI Content-to-PDF Enhancer
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Convert generated text or webpage content into customizable, share-ready PDF documents.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
           <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
              <button
                onClick={() => { setInputType("text"); setError(""); }}
                className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  inputType === "text"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => { setInputType("url"); setError(""); }}
                className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  inputType === "url"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Webpage Link
              </button>
            </div>

            <div className="space-y-6">
              {inputType === "text" ? (
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content Text
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="content"
                      name="content"
                      rows={8}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3"
                      placeholder="Paste your generated content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                 <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Webpage URL
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      name="url"
                      id="url"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center mb-3 sm:mb-0">
                  <input
                    id="enhance-checkbox"
                    type="checkbox"
                    checked={enhanceWithAI}
                    onChange={(e) => setEnhanceWithAI(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="enhance-checkbox" className="ml-2 block text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
                    Enhance content using AI
                  </label>
                </div>

                {enhanceWithAI && (
                  <div className="w-full sm:w-auto">
                    <label htmlFor="model-select" className="sr-only">Choose AI Model</label>
                    <select
                      id="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? "Processing..." : "Generate PDF"}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
