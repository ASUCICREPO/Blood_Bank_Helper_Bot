import React from "react"
import { Box, Grid, Button, Typography } from "@mui/material"
import {
  MonitorHeartOutlined as BloodIcon,
  LocationOnOutlined as LocationIcon,
  ShieldOutlined as ShieldIcon,
  PersonAddAlt1Outlined as EligibilityIcon
} from "@mui/icons-material"
import {
  getCurrentText,
  MAROON,
  GOLD,
  WHITE
} from "../utilities/constants"

function FAQExamples({ currentLanguage, onFAQClick }) {
  const TEXT = getCurrentText(currentLanguage)

  const faqItems = [
    {
      icon: <BloodIcon />,
      iconBg: MAROON,
      iconColor: WHITE,
      title: currentLanguage === "en" ? "Blood Supply Status" : "Estado del Suministro de Sangre",
      description: currentLanguage === "en"
        ? "Get real-time updates on blood type availability and urgent needs in your community."
        : "Obtén actualizaciones en tiempo real sobre la disponibilidad de tipos de sangre y necesidades urgentes en tu comunidad.",
      question: TEXT.FAQ_QUESTIONS[3]
    },
    {
      icon: <EligibilityIcon />,
      iconBg: GOLD,
      iconColor: MAROON,
      title: currentLanguage === "en" ? "Learn About Eligibility" : "Aprende sobre Elegibilidad",
      description: currentLanguage === "en"
        ? "Discover if you qualify to donate blood and understand the requirements."
        : "Descubre si calificas para donar sangre y comprende los requisitos.",
      question: TEXT.FAQ_QUESTIONS[1]
    },
    {
      icon: <ShieldIcon />,
      iconBg: MAROON,
      iconColor: WHITE,
      title: currentLanguage === "en" ? "Safety Information" : "Información de Seguridad",
      description: currentLanguage === "en"
        ? "Learn about our rigorous safety protocols and why donating blood is safe."
        : "Aprende sobre nuestros rigurosos protocolos de seguridad y por qué donar sangre es seguro.",
      question: TEXT.FAQ_QUESTIONS[0]
    },
    {
      icon: <LocationIcon />,
      iconBg: GOLD,
      iconColor: MAROON,
      title: currentLanguage === "en" ? "Find Donation Centers" : "Encuentra Centros de Donación",
      description: currentLanguage === "en"
        ? "Locate the nearest blood donation center and schedule your appointment."
        : "Localiza el centro de donación de sangre más cercano y programa tu cita.",
      question: TEXT.FAQ_QUESTIONS[2]
    }
  ]

  return (
    <Box sx={{
      mb: 2,
      maxWidth: "1200px",
      mx: "auto",
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* 4 Cards - Responsive Layout */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {faqItems.map((item, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Button
              onClick={() => onFAQClick(item.question)}
              sx={{
                width: "100%",
                height: { xs: "150px", sm: "180px", md: "190px" },
                padding: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                backgroundColor: WHITE,
                border: "1px solid #ECECEC",
                borderRadius: "16px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: { xs: 0.75, sm: 1 },
                textTransform: "none",
                color: "inherit",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 6px 18px rgba(140, 29, 64, 0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {/* Circular icon badge + title row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  mb: { xs: 0.5, sm: 1 },
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: { xs: 36, sm: 42 },
                    height: { xs: 36, sm: 42 },
                    borderRadius: "50%",
                    backgroundColor: item.iconBg,
                    color: item.iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {React.cloneElement(item.icon, {
                    sx: { fontSize: { xs: "1.1rem", sm: "1.3rem" } }
                  })}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1rem" },
                    color: "#191919",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                    hyphens: "auto",
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  lineHeight: { xs: 1.3, sm: 1.4 },
                  fontSize: { xs: "0.72rem", sm: "0.8rem", md: "0.85rem" },
                  flex: 1,
                  wordBreak: "break-word",
                  hyphens: "auto",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 4, sm: 5, md: 5 },
                  WebkitBoxOrient: "vertical",
                }}
              >
                {item.description}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* Suggested question pills */}
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 }, textAlign: "center" }}>
        <Box sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: { xs: 1, sm: 1.25, md: 1.5 },
          justifyContent: "center",
          px: { xs: 1, sm: 0 },
        }}>
          {[
            currentLanguage === "en" ? "Am I eligible to donate?" : "¿Soy elegible para donar?",
            currentLanguage === "en" ? "Where can I donate?" : "¿Dónde puedo donar?",
            currentLanguage === "en" ? "How is the blood supply today?" : "¿Cómo está el suministro de sangre hoy?",
            currentLanguage === "en" ? "Advocacy & legislation" : "Defensa y legislación",
            currentLanguage === "en" ? "Is it safe to donate?" : "¿Es seguro donar?",
          ].map((question, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => onFAQClick(question)}
              sx={{
                borderColor: MAROON,
                color: MAROON,
                borderRadius: "999px",
                textTransform: "none",
                fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
                padding: { xs: "5px 14px", sm: "6px 18px" },
                minWidth: "auto",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: MAROON,
                  color: WHITE,
                  backgroundColor: MAROON,
                },
              }}
            >
              {question}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default FAQExamples
