declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FISHJAM_ID: string;
      FISHJAM_TOKEN?: string;
      GEMINI_API_KEY?: string;
    }
  }
}

export {};
