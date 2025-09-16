declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FISHJAM_ID?: string;
      FISHJAM_URL?: string;
      FISHJAM_TOKEN?: string;
    }
  }
}

export {};
