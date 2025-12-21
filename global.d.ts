import hr from "./messages/hr.json";

type Messages = typeof hr;

declare global {
  // Use type safe message keys with `auto-complete`
  interface IntlMessages extends Messages {}
}

