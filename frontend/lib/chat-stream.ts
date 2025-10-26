/**
 * Client-side utility for handling streaming chat responses from Lambda
 */

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamCallback = (chunk: string) => void;

/**
 * Send a chat message and handle streaming response
 * @param message - The user's message
 * @param history - Previous chat messages
 * @param diagnosis - The patient's diagnosis
 * @param onChunk - Callback for each chunk of text received
 * @param apiUrl - The backend API URL
 */
export async function sendChatMessageStream(
  message: string,
  history: ChatMessage[],
  diagnosis: string,
  onChunk: StreamCallback,
  apiUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        diagnosis,
        message,
        history,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Request failed: ${response.status}`,
      };
    }

    // Check if this is a streaming response
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("text/event-stream") || response.body) {
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        return {
          success: false,
          error: "No response body",
        };
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE (Server-Sent Events) format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove "data: " prefix
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                onChunk(parsed.text);
              } else if (parsed.done) {
                // Stream complete
                break;
              } else if (parsed.error) {
                return {
                  success: false,
                  error: parsed.error,
                };
              }
            } catch {
              // Not JSON, might be plain text
              onChunk(data);
            }
          }
        }
      }

      return { success: true };
    } else {
      // Handle non-streaming response
      const result = await response.json();
      if (result.response) {
        onChunk(result.response);
        return { success: true };
      } else if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }
      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a chat message without streaming (waits for complete response)
 * @param message - The user's message
 * @param history - Previous chat messages
 * @param diagnosis - The patient's diagnosis
 * @param apiUrl - The backend API URL
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  diagnosis: string,
  apiUrl: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        diagnosis,
        message,
        history,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Request failed: ${response.status} ${errorText}`,
      };
    }

    const result = await response.json();

    if (result.response) {
      return {
        success: true,
        response: result.response,
      };
    } else if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: false,
      error: "Unexpected response format",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

