import { NextRequest, NextResponse } from "next/server";

// Import the content store from the parent route
// In production, this would be a database query
const contentStore = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = params.id;
    
    // In production, query from PostgreSQL
    // For now, we'll return a mock response since we can't share the Map across files
    // The actual implementation would fetch from the same storage
    
    return NextResponse.json({
      id: contentId,
      title: "Sample Content",
      content: "This is sample content retrieved from the backend.",
      author: "0x0000000000000000000000000000000000000000",
      contentHash: "0x" + "0".repeat(64),
      timestamp: new Date().toISOString(),
      status: "published",
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}