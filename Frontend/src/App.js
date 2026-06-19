import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@mui/material/styles"
import { CssBaseline } from "@mui/material"
import theme from "./theme"
import MainChat from "./Components/MainChat"
import { AdminWrapper } from "./admin"

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<MainChat />} />
          <Route path="/admin/*" element={<AdminWrapper />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App