declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FISHJAM_ID: string;
      FISHJAM_TOKEN: string;
      COMPOSITION_URL?: string;
    }
  }
}

export {};
