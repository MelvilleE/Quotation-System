export const AUTH_COOKIE_NAME = "quotation_admin_session";
export const AUTH_COOKIE_VALUE = "quotation-admin-authenticated-v1";

export const TEMP_USERNAME = "admin";
export const TEMP_PASSWORD = "password123";

export function isValidTemporaryLogin(username: string, password: string) {
  return username === TEMP_USERNAME && password === TEMP_PASSWORD;
}
