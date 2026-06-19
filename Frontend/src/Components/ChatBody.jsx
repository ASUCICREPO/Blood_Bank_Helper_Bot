import { useState, useRef, useEffect } from "react"
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  ButtonGroup,
  Button,
  useMediaQuery
} from "@mui/material"
import { Send as SendIcon, Menu as MenuIcon } from "@mui/icons-material"
import FAQExamples from "./FAQExamples"
import BotReply from "./BotReply"
import UserReply from "./UserReply"
import {
  getCurrentText,
  WHITE,
  PRIMARY_MAIN,
  LIGHT_BACKGROUND,
  MAROON
} from "../utilities/constants"

function ChatBody({ currentLanguage, toggleLanguage, showLeftNav, setLeftNav }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const isSmallScreen = useMediaQuery("(max-width:600px)")
  const TEXT = getCurrentText(currentLanguage)

  const scrollToBottom = () => {
    // Use native page scroll instead of internal container scroll
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (messageText = null) => {
    const messageToSend = messageText || inputValue.trim()
    if (!messageToSend || isLoading) return

    setInputValue("")
    setMessages(prev => [...prev, { type: "user", content: messageToSend }])
    setIsLoading(true)

    // Add placeholder bot message for streaming
    const botMessageIndex = messages.length + 1
    setMessages(prev => [...prev, {
      type: "bot",
      content: "",
      sources: [],
      isStreaming: true
    }])

    try {
      const apiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_CHAT_ENDPOINT

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          language: currentLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      // Check if response is streaming (Server-Sent Events)
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/event-stream")) {
        // Handle streaming response
        await handleStreamingResponse(response, botMessageIndex)
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json()
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[botMessageIndex] = {
            type: "bot",
            content: data.message || "I'm sorry, I couldn't process your request.",
            sources: data.sources || [],
            isStreaming: false
          }
          return newMessages
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[botMessageIndex] = {
          type: "bot",
          content: "I'm sorry, there was an error processing your request. Please try again.",
          sources: [],
          isStreaming: false
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamingResponse = async (response, messageIndex) => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''
    let sources = []

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          try {
            const jsonStr = line.substring(6) // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr)

            if (data.type === 'metadata') {
              // Store sources from metadata
              sources = data.sources || []
              console.log('Received metadata with sources:', sources.length, sources)
            } else if (data.type === 'content') {
              // Append text chunk
              fullText += data.text

              // Update message with streaming text
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[messageIndex] = {
                  type: "bot",
                  content: fullText,
                  sources: sources,
                  isStreaming: true
                }
                return newMessages
              })
            } else if (data.type === 'complete') {
              // Final update with complete response and sources
              console.log('Received complete event with sources:', data.sources?.length || sources.length, data.sources || sources)
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[messageIndex] = {
                  type: "bot",
                  content: data.fullResponse || fullText,
                  sources: data.sources || sources, // Use sources from complete event if available
                  isStreaming: false
                }
                console.log('Final message with sources:', newMessages[messageIndex].sources.length)
                return newMessages
              })
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e)
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[messageIndex] = {
          type: "bot",
          content: fullText || "I'm sorry, there was an error processing your request.",
          sources: sources,
          isStreaming: false
        }
        return newMessages
      })
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleFAQClick = (question) => {
    // Directly send the FAQ question as a message
    handleSendMessage(question)
  }

  return (
    <Box
      sx={{
        minHeight: "100vh", // Use full viewport height
        display: "flex",
        flexDirection: "column",
        backgroundColor: LIGHT_BACKGROUND,
        // Remove overflow hidden to allow natural page scroll
      }}
    >
      {/* Integrated Header with Logo and Language Toggle */}
      <Box
        sx={{
          padding: { xs: "0.5rem 1rem", sm: "0.75rem 1.5rem", md: "1rem 2rem" }, // Reduced top padding
          paddingBottom: { xs: "0.5rem", sm: "1rem" },
        }}
      >
        {/* Top Row: Logo (left) and Language Toggle (right) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 1, sm: 1.5 },
            ml: !isSmallScreen && !showLeftNav ? "50px" : "10px", // Add left margin when floating menu is visible
          }}
        >
          {/* Left side: Mobile Menu + Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            {/* Mobile Menu Button */}
            {isSmallScreen && (
              <IconButton
                onClick={() => setLeftNav && setLeftNav(true)}
                sx={{
                  color: PRIMARY_MAIN,
                  padding: "5px",
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <img
              src="/logo.png"
              alt="ASU Artificial Intelligence Cloud Innovation Center"
              width={isSmallScreen ? "56" : "72"}
              height={isSmallScreen ? "56" : "72"}
              style={{ objectFit: "contain" }}
            />

            <Typography
              sx={{
                fontWeight: 700,
                color: "#191919",
                fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                lineHeight: 1.2,
              }}
            >
              {TEXT.APP_HEADER_TITLE}
            </Typography>
          </Box>

          {/* Right side: Language Toggle */}
          <ButtonGroup
            variant="outlined"
            size="small"
            sx={{
              borderRadius: "8px",
              overflow: "hidden",
              "& .MuiButton-root": {
                minWidth: "44px",
                padding: "6px 14px",
                fontSize: "0.875rem",
                fontWeight: "bold",
                border: `1px solid ${MAROON}`,
                color: MAROON,
                backgroundColor: WHITE,
                "&:hover": {
                  backgroundColor: MAROON,
                  color: WHITE,
                },
              },
              "& .MuiButton-root.active": {
                backgroundColor: MAROON,
                color: WHITE,
                "&:hover": {
                  backgroundColor: MAROON,
                },
              },
            }}
          >
            <Button
              className={currentLanguage === "en" ? "active" : ""}
              onClick={() => currentLanguage !== "en" && toggleLanguage()}
            >
              EN
            </Button>
            <Button
              className={currentLanguage === "es" ? "active" : ""}
              onClick={() => currentLanguage !== "es" && toggleLanguage()}
            >
              ES
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Messages Area - Use full viewport height with native scroll */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          // Remove overflow hidden to use native page scroll
        }}
      >
        {/* Content Container */}
        <Box
          sx={{
            flex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
            // padding: { xs: "0.75rem", sm: "1rem", md: "1.5rem 2rem" },
            padding: { xs: "0 rem", sm: "0rem", md: "0rem 0rem" },
            paddingBottom: 0,
          }}
        >
          {/* Show Welcome Content only when no messages */}
          {messages.length === 0 && (
            <Box sx={{
              paddingTop: { xs: "0rem", sm: "0rem", md: "0rem" }, // Reduced from 2rem/3rem/4rem
            }}>
              {/* Welcome Title and Subtitle */}
              <Box sx={{
                textAlign: "center",
                mb: { xs: 3, sm: 4, md: 5 },
                px: { xs: 2, sm: 3, md: 4 } // Match FAQExamples padding
              }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                    fontWeight: "bold",
                    color: MAROON,
                    mb: 2,
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {TEXT.CHAT_HEADER_TITLE}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                    color: "#666",
                    maxWidth: "600px",
                    margin: "0 auto",
                    lineHeight: 1.5,
                  }}
                >
                  {currentLanguage === "en"
                    ? "Learn about the blood supply, eligibility, and how you can save lives."
                    : "Aprende sobre el suministro de sangre, elegibilidad y cómo puedes salvar vidas."
                  }
                </Typography>
              </Box>

              <FAQExamples
                currentLanguage={currentLanguage}
                onFAQClick={handleFAQClick}
              />
            </Box>
          )}

          {/* Chat Messages - Simple layout without nested scroll */}
          {messages.length > 0 && (
            <Box sx={{ paddingBottom: "1rem" }}>
              {messages.map((message, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  {message.type === "user" ? (
                    <UserReply message={message.content} />
                  ) : (
                    <BotReply
                      message={message.content}
                      sources={message.sources}
                      currentLanguage={currentLanguage}
                    />
                  )}
                </Box>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                  <CircularProgress size={24} sx={{ color: PRIMARY_MAIN }} />
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Input Area - Seamlessly integrated */}
      <Box
        sx={{
          backgroundColor: LIGHT_BACKGROUND, // Same as ChatBody background
          padding: { xs: "0.75rem", sm: "1rem", md: "1.5rem 2rem" }, // More responsive padding
          paddingTop: messages.length === 0 ? { xs: "0.5rem", sm: "0.75rem", md: "1rem" } : { xs: "1rem", sm: "1.5rem", md: "2rem" }, // Responsive dynamic padding
          flexShrink: 0, // Don't shrink the input area
        }}
      >
        <Box sx={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
        }}>
          <TextField
            fullWidth
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown} // Use onKeyDown instead of deprecated onKeyPress
            placeholder={TEXT.CHAT_PLACEHOLDER}
            variant="outlined"
            disabled={isLoading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "25px",
                backgroundColor: WHITE,
                border: "1px solid #E0E0E0",
                paddingRight: { xs: "50px", sm: "60px" }, // Responsive padding for send button
                "& fieldset": {
                  border: "none",
                },
                "&:hover": {
                  backgroundColor: WHITE,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
                "&.Mui-focused": {
                  backgroundColor: WHITE,
                  boxShadow: `0 0 0 2px ${PRIMARY_MAIN}20, 0 2px 8px rgba(0,0,0,0.1)`,
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: { xs: "12px 16px", sm: "14px 20px" }, // Responsive padding
                fontSize: { xs: "0.9rem", sm: "1rem" }, // Responsive font size
              },
            }}
          />
          <IconButton
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            sx={{
              backgroundColor: PRIMARY_MAIN,
              color: WHITE,
              width: { xs: "40px", sm: "44px" }, // Responsive size
              height: { xs: "40px", sm: "44px" }, // Responsive size
              position: "absolute",
              right: { xs: "3px", sm: "4px" }, // Responsive positioning
              top: "50%",
              transform: "translateY(-50%)",
              "&:hover": {
                backgroundColor: PRIMARY_MAIN,
                opacity: 0.9,
              },
              "&:disabled": {
                backgroundColor: "#E0E0E0",
                color: "#999",
              },
            }}
          >
            <SendIcon sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }} /> {/* Responsive icon size */}
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default ChatBody