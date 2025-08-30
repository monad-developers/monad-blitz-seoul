import { NextRequest, NextResponse } from "next/server";
import { keccak256, toHex } from "viem";

// In-memory storage for demo (replace with actual database in production)
const contentStore = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { title, body, author, contentType = "post", community, tags } = requestBody;

    if (!title || !body || !author) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique ID
    const contentId = Date.now().toString();
    const timestamp = Date.now();

    // Create content hash using keccak256 (compatible with smart contract)
    const contentString = JSON.stringify({ 
      title, 
      body, 
      author, 
      contentType,
      community,
      tags,
      timestamp 
    });
    const contentHash = keccak256(toHex(contentString));

    // Store content (in production, use PostgreSQL)
    const contentData = {
      id: contentId,
      title,
      content: body,
      author,
      contentType,
      community,
      tags,
      contentHash,
      timestamp: new Date(timestamp).toISOString(),
      status: "published",
    };

    contentStore.set(contentId, contentData);

    // Return hash for on-chain storage
    return NextResponse.json({
      success: true,
      id: contentId,
      contentHash,
      uri: `/api/content/${contentId}`,
    });
  } catch (error) {
    console.error("Error storing content:", error);
    return NextResponse.json(
      { error: "Failed to store content" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("id");

    if (contentId) {
      const content = contentStore.get(contentId);
      if (!content) {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(content);
    }

    // Return all content
    const allContent = Array.from(contentStore.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(allContent);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}