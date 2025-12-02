import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
} from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Define the tool for the model to report expansion state
const updateExpansionTool: FunctionDeclaration = {
  name: "updateExpansion",
  parameters: {
    type: Type.OBJECT,
    description: "Sets the particle expansion level based on hand gestures.",
    properties: {
      expansion: {
        type: Type.NUMBER,
        description: "A value between 0.0 (closed/relaxed) and 1.0 (fully expanded/tense).",
      },
    },
    required: ["expansion"],
  },
};

export class LiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private onExpansionUpdate: (value: number) => void;
  private active: boolean = false;

  constructor(onExpansionUpdate: (value: number) => void) {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
    this.onExpansionUpdate = onExpansionUpdate;
  }

  async connect(videoStream: MediaStream, audioStream: MediaStream) {
    if (!API_KEY) {
      throw new Error("API Key not found in environment variables.");
    }

    this.active = true;

    const config = {
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected");
          this.startStreaming(videoStream);
        },
        onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message);
        },
        onclose: () => {
            console.log("Gemini Live Closed");
            this.active = false;
        },
        onerror: (err: any) => {
            console.error("Gemini Live Error", err);
            this.active = false;
        },
      },
      config: {
        responseModalities: [Modality.AUDIO], // Required by API
        tools: [{ functionDeclarations: [updateExpansionTool] }],
        systemInstruction: `
          You are a high-speed, real-time gesture controller.
          Your task is to estimate an 'expansion' value (0.0 to 1.0) based on the user's hand movements in the video stream.

          CALCULATION LOGIC:
          1. **Distance Mode (Two Hands)**:
             - Visually measure the distance between the user's palms.
             - HANDS TOUCHING = 0.0.
             - HANDS SHOULDER-WIDTH APART (approx 40-50cm) = 1.0.
             - Linearly interpolate the value for distances in between.
             - If hands go wider than shoulders, keep at 1.0.

          2. **Tension Mode (One Hand/Fallback)**:
             - If only one hand is clear:
             - CLOSED FIST = 0.0.
             - RELAXED HAND = 0.5.
             - WIDE OPEN FINGERS (Tension) = 1.0.

          PERFORMANCE RULES:
          - React IMMEDIATELY to every frame.
          - Output the tool call 'updateExpansion' for every significant change.
          - Do not smooth the data; output the raw estimated value.
          - REMAIN SILENT. Do not generate audio. Only use the tool.
        `,
      },
    };

    try {
      this.sessionPromise = this.ai.live.connect(config);
      await this.sessionPromise;
    } catch (e) {
      this.active = false;
      throw e;
    }
  }

  private handleMessage(message: LiveServerMessage) {
    // Handle Tool Calls
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === "updateExpansion") {
          const val = fc.args['expansion'] as number;
          if (typeof val === 'number') {
             this.onExpansionUpdate(val);
          }
          
          // Send response back
          if (this.sessionPromise) {
             this.sessionPromise.then((session) => {
                session.sendToolResponse({
                    functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "ok" }
                    }
                 });
             });
          }
        }
      }
    }
  }

  private startStreaming(videoStream: MediaStream) {
    const videoEl = document.createElement("video");
    videoEl.srcObject = videoStream;
    videoEl.muted = true;
    videoEl.play().catch(e => console.error("Video play error", e));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Increased frame rate for better responsiveness (approx 4 FPS)
    const INTERVAL = 250; 

    const intervalId = setInterval(async () => {
      if (!this.active || !this.sessionPromise) {
        clearInterval(intervalId);
        videoEl.pause();
        videoEl.srcObject = null;
        return;
      }

      try {
        if (videoEl.readyState >= 2 && ctx) {
            canvas.width = videoEl.videoWidth / 4; // Downscale for performance
            canvas.height = videoEl.videoHeight / 4;
            
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
            
            this.sessionPromise.then((session) => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'image/jpeg',
                        data: base64
                    }
                });
            });
        }
      } catch (err) {
        console.warn("Frame capture skipped", err);
      }
    }, INTERVAL);
  }

  disconnect() {
    this.active = false;
    if (this.sessionPromise) {
        this.sessionPromise.then(session => {
            if (typeof session.close === 'function') {
                session.close();
            }
        }).catch(e => console.error("Error closing session", e));
    }
    this.sessionPromise = null;
  }
}
