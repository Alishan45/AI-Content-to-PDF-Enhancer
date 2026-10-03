import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, modelName } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required and must be a string." }, { status: 400 });
    }

    if (!modelName || typeof modelName !== "string") {
      return NextResponse.json({ error: "Model name is required and must be a string." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Choose the model provided by the user. Ensure it is a valid free model like gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Please enhance and format the following text to make it suitable for a PDF document. Make it well-structured, clear, and professional. Here is the text:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text();

    return NextResponse.json({ enhancedText });

  } catch (error: any) {
    console.error("Error enhancing text with Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enhance text." },
      { status: 500 }
    );
  }
}
