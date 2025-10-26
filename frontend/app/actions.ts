"use server";

export async function uploadToLambda(formData: FormData) {
  const file = formData.get("file-input") as File;

  if (!file) {
    return {
      success: false,
      error: "No file provided",
    };
  }

  try {
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Get the Analyze Image API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL + "/analyze";
    console.log("NEXT_PUBLIC_BACKEND_URL", process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log("apiUrl", apiUrl);

    if (!apiUrl) {
      return {
        success: false,
        error:
          "API URL not configured. Please set NEXT_PUBLIC_BACKEND_URL in .env.local",
      };
    }

    // Send to backend
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: base64,
      }),
    });

    console.log("response", response);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Upload failed: ${response.status} ${errorText}`,
      };
    }

    const diagnosis = await response.text();

    return {
      success: true,
      diagnosis: diagnosis, // The diagnosis from Lambda
      message: diagnosis,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL + "/chat";

    if (!apiUrl) {
      return {
        success: false,
        error:
          "Chatbot API URL not configured. Please set NEXT_PUBLIC_BACKEND_URL in .env.local",
      };
    }

    // Send to backend chatbot (non-streaming version)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Chat request failed: ${response.status} ${errorText}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      response: result.response,
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
