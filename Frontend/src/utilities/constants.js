// Color constants - ASU Theme (Maroon & Gold)
export const PRIMARY_MAIN = "#8C1D40"; // ASU Maroon
export const SECONDARY_MAIN = "#FFC627"; // ASU Gold
export const DARK_BLUE = "#8C1D40"; // Maroon (kept name for backward compatibility)
export const MAROON = "#8C1D40";
export const GOLD = "#FFC627";
export const LIGHT_BACKGROUND = "#FAFAFA";
export const WHITE = "#FFFFFF";
export const LIGHT_GRAY = "#F8F9FA";

// Background colors
export const CHAT_LEFT_PANEL_BACKGROUND = WHITE;
export const CHAT_BODY_BACKGROUND = WHITE;
export const BOTMESSAGE_BACKGROUND = "#F5EDEF";
export const USERMESSAGE_BACKGROUND = "#FBF3D6";
export const HEADER_TEXT_GRADIENT = MAROON;

// Text colors
export const ABOUT_US_TEXT = MAROON;
export const FAQ_TEXT = MAROON;
export const primary_50 = "rgba(140, 29, 64, 0.1)";

// Text content
export const getCurrentText = (language) => {
  const texts = {
    en: {
      APP_HEADER_TITLE: "Artificial Intelligence Cloud Innovation Center",
      CHAT_HEADER_TITLE: "Blood Bank Project",
      ABOUT_US_TITLE: "About us",
      ABOUT_US:
        "Welcome to the Blood Bank Project AI Assistant. We help connect you with vital blood donation information and services.",
      FAQ_TITLE: "FAQs",
      FAQS: [
        "How often can I donate blood?",
        "What are the eligibility requirements?",
        "Where can I find a blood center near me?",
        "What is the current blood supply status?",
        "Is it safe to donate blood?",
        "What should I do before donating?",
      ],
      FAQ_QUESTIONS: [
        "How often can I donate blood?",
        "What are the eligibility requirements?",
        "Where can I find a blood center near me?",
        "What is the current blood supply status?",
      ],
      CHAT_PLACEHOLDER: "Ask a question about blood donation...",
      SEND_BUTTON: "Send",
      LANGUAGE_TOGGLE: "ES",
    },
    es: {
      APP_HEADER_TITLE:
        "Centro de Innovación en la Nube de Inteligencia Artificial",
      CHAT_HEADER_TITLE: "Proyecto del Banco de Sangre",
      ABOUT_US_TITLE: "Acerca de nosotros",
      ABOUT_US:
        "Bienvenido al Asistente de IA del Proyecto del Banco de Sangre. Te ayudamos a conectarte con información y servicios vitales de donación de sangre.",
      FAQ_TITLE: "Preguntas Frecuentes",
      FAQS: [
        "¿Con qué frecuencia puedo donar sangre?",
        "¿Cuáles son los requisitos de elegibilidad?",
        "¿Dónde puedo encontrar un centro de sangre cerca de mí?",
        "¿Cuál es el estado actual del suministro de sangre?",
        "¿Es seguro donar sangre?",
        "¿Qué debo hacer antes de donar?",
      ],
      FAQ_QUESTIONS: [
        "¿Con qué frecuencia puedo donar sangre?",
        "¿Cuáles son los requisitos de elegibilidad?",
        "¿Dónde puedo encontrar un centro de sangre cerca de mí?",
        "¿Cuál es el estado actual del suministro de sangre?",
      ],
      CHAT_PLACEHOLDER: "Pregunta sobre donación de sangre...",
      SEND_BUTTON: "Enviar",
      LANGUAGE_TOGGLE: "EN",
    },
  };
  return texts[language] || texts.en;
};
