declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI?: string;
    MONGODB_DB?: string;

    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;

    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;
    SMTP_TO?: string;
  }
}


