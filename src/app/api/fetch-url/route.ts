import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import * as ip from "ip";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return NextResponse.json({ error: "Invalid URL provided." }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Basic SSRF protection (prevent local requests)
    if (hostname === "localhost" || ip.isPrivate(hostname) || hostname.endsWith(".local")) {
         return NextResponse.json({ error: "Fetching from internal or private networks is not allowed." }, { status: 403 });
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch the URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style tags
    $("script, style").remove();

    // Try to extract main content, otherwise fall back to body
    let text = $("main, article, .content, .main").text();
    if (!text || text.trim().length === 0) {
      text = $("body").text();
    }

    // Clean up whitespace
    text = text.replace(/\s+/g, " ").trim();

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error("Error fetching URL:", error);
    return NextResponse.json({ error: "Failed to extract text from URL." }, { status: 500 });
  }
}
