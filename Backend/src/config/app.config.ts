import { getENV } from "../utils/helper";

const appConfig = () => ({
  NODE_ENV: getENV("NODE_ENV", "development"),
  APP_ORIGIN: getENV("APP_ORIGIN", "localhost"),
  PORT: getENV("PORT", "4000"),
  BASE_PATH: getENV("BASE_PATH", "/api"),
  JWT: {
    SECRET: getENV("JWT_SECRET", "my_jwt_secret"),
    EXPIRES_IN: getENV("JWT_EXPIRES_IN", "15m"),
    REFRESH_SECRET: getENV("JWT_REFRESH_SECRET", "my_jwt_refresh_secret"),
    REFRESH_EXPIRES_IN: getENV("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  MONGO_URI: getENV("MONGO_URI", "mongodb://localhost:27017/project_auth_kit"),
  RESEND_API_KEY: getENV(
    "RESEND_API_KEY",
    "re_etNKmc6T_MDRrQK6trfjVFsTiHicA9bfh"
  ),
  MAILER_SENDER: getENV("MAILER_SENDER", "onboarding@gmail.com"),
});

export const config = appConfig();
