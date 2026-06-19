import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Pagination,
  AppBar,
  Toolbar,
  Container,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import MarkdownContent from '../Components/MarkdownContent';
import { PRIMARY_MAIN, DARK_BLUE } from '../utilities/constants';

const AdminPage = ({ onLogout }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Chat history state
  const [conversations, setConversations] = useState([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  // Modal state for viewing full conversation
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Sync selection state
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState('both');

  // Get API URL from environment
  const API_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_CHAT_ENDPOINT;

  // Fetch chat history with page-based pagination
  const fetchChatHistory = useCallback(async (page = 1, filters = {}) => {
    setIsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...filters
      });

      const response = await fetch(`${API_URL}/admin/conversations?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setConversations(data.conversations || []);
      setTotalConversations(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(page);

    } catch (error) {
      setStatus('Error loading chat history');
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, pageSize]);

  // Load chat history when tab changes or filters change
  useEffect(() => {
    if (activeTab === 0) { // Chat History tab (now first tab)
      const filters = {};
      if (dateFilter) filters.date = dateFilter;
      if (languageFilter) filters.language = languageFilter;
      fetchChatHistory(1, filters); // Always start from page 1 when filters change
      setCurrentPage(1);
    }
  }, [activeTab, dateFilter, languageFilter, fetchChatHistory]);

  // Handle page change
  const handlePageChange = (event, page) => {
    const filters = {};
    if (dateFilter) filters.date = dateFilter;
    if (languageFilter) filters.language = languageFilter;
    fetchChatHistory(page, filters);
  };

  const triggerDataSync = async (syncType, dataSourceType = null) => {
    setIsLoading(true);
    setStatus('');

    try {
      const requestBody = {
        sync_type: syncType,
        data_source_type: dataSourceType || (syncType === 'daily' ? 'daily' : selectedDataSource)
      };

      const response = await fetch(`${API_URL}/admin/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        let message = data.message;
        if (data.started_jobs && data.started_jobs.length > 0) {
          const jobNames = data.started_jobs.map(job => job.dataSourceName).join(', ');
          message += `\n\nData sources syncing: ${jobNames}`;

          if (data.failed_jobs && data.failed_jobs.length > 0) {
            const failedNames = data.failed_jobs.map(job => job.dataSourceName).join(', ');
            message += `\n\nFailed: ${failedNames}`;
          }
        }
        setStatus(message);
      } else {
        setStatus(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error starting ${syncType} sync: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSyncDialogOpen(false);
    }
  };

  const handleManualSyncClick = () => {
    setSyncDialogOpen(true);
  };

  const handleSyncDialogClose = () => {
    setSyncDialogOpen(false);
  };

  const handleConfirmSync = () => {
    triggerDataSync('manual');
  };

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedConversation(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: DARK_BLUE }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Blood Bank Project - Admin Dashboard
          </Typography>
          <Button
            color="inherit"
            onClick={() => window.location.href = '/'}
            sx={{ ml: 2 }}
          >
            Back to Chat
          </Button>
          <Button
            color="inherit"
            onClick={onLogout}
            sx={{ ml: 1 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your chatbot settings and view conversation history
            </Typography>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => handleTabChange(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem'
              }
            }}
          >
            <Tab
              icon={<HistoryIcon />}
              label="Chat History"
              iconPosition="start"
            />
            <Tab
              icon={<SettingsIcon />}
              label="Settings & Sync"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Chat History Tab */}
        {activeTab === 0 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Chat History
            </Typography>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Filter by date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: 150 }}
              />
              <TextField
                select
                label="Language"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
              </TextField>
            </Box>

            {/* Conversations Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Question</strong></TableCell>
                    <TableCell><strong>Answer</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Language</strong></TableCell>
                    <TableCell><strong>Details</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conversations.map((conversation, index) => (
                    <TableRow key={conversation.id || index} hover>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" title={conversation.message}>
                          {truncateText(conversation.message || conversation.question, 80)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 400 }}>
                        <Typography variant="body2" color="textSecondary" title={conversation.response || conversation.answer}>
                          {truncateText(conversation.response || conversation.answer, 150)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(conversation.timestamp || conversation.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={conversation.language === 'es' ? 'Español' : 'English'}
                          size="small"
                          color={conversation.language === 'es' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewConversation(conversation)}
                          title="View full conversation"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {conversations.length === 0 && !isLoading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  No conversations found
                </Typography>
              </Box>
            )}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}

            {/* Summary */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {totalConversations > 0 ? (
                  <>
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalConversations)} of {totalConversations} conversations
                  </>
                ) : (
                  'No conversations to display'
                )}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Settings Tab */}
        {activeTab === 1 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              System Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Data Synchronization
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Sync knowledge base with latest data sources. This updates the chatbot's knowledge with new information.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={handleManualSyncClick}
                        disabled={isLoading}
                        sx={{ backgroundColor: PRIMARY_MAIN, minWidth: 200 }}
                      >
                        Manual Sync (Choose Sources)
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => triggerDataSync('daily')}
                        disabled={isLoading}
                        sx={{ backgroundColor: PRIMARY_MAIN, minWidth: 200 }}
                      >
                        Daily Sync (Blood Supply Updates)
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => window.open('https://console.aws.amazon.com/bedrock/home#/knowledge-bases', '_blank')}
                        sx={{ minWidth: 150 }}
                      >
                        AWS Console
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {status && (
              <Alert
                severity={status.includes('Error') ? 'error' : 'info'}
                sx={{
                  mt: 3,
                  whiteSpace: 'pre-line' // Allow line breaks in status messages
                }}
              >
                {status}
              </Alert>
            )}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Processing...
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* Full Conversation Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Full Conversation
          </Typography>
          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedConversation && (
            <Box>
              {/* Question */}
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Question:
                </Typography>
                <Typography variant="body1">
                  {selectedConversation.message || selectedConversation.question}
                </Typography>
              </Paper>

              {/* Answer */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Answer:
                </Typography>
                <MarkdownContent
                  content={selectedConversation.response || selectedConversation.answer}
                />
              </Paper>

              {/* Metadata */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label={`Language: ${selectedConversation.language === 'es' ? 'Español' : 'English'}`}
                  size="small"
                  color={selectedConversation.language === 'es' ? 'secondary' : 'primary'}
                />
                <Typography variant="body2" color="textSecondary">
                  {formatDate(selectedConversation.timestamp || selectedConversation.created_at)}
                </Typography>
                {selectedConversation.sessionId && (
                  <Typography variant="body2" color="textSecondary">
                    Session: {selectedConversation.sessionId.substring(0, 8)}...
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Source Selection Dialog */}
      <Dialog
        open={syncDialogOpen}
        onClose={handleSyncDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Select Data Sources to Sync
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Choose which data sources you want to synchronize with the latest content:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              onClick={() => setSelectedDataSource('both')}
              sx={{
                p: 2,
                border: selectedDataSource === 'both' ? `2px solid ${PRIMARY_MAIN}` : '1px solid #e0e0e0',
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: selectedDataSource === 'both' ? `${PRIMARY_MAIN}10` : 'transparent',
                '&:hover': {
                  backgroundColor: selectedDataSource === 'both' ? `${PRIMARY_MAIN}20` : '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                📄 All Sources (Recommended)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sync both PDF documents and website content
              </Typography>
            </Box>

            <Box
              onClick={() => setSelectedDataSource('pdf')}
              sx={{
                p: 2,
                border: selectedDataSource === 'pdf' ? `2px solid ${PRIMARY_MAIN}` : '1px solid #e0e0e0',
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: selectedDataSource === 'pdf' ? `${PRIMARY_MAIN}10` : 'transparent',
                '&:hover': {
                  backgroundColor: selectedDataSource === 'pdf' ? `${PRIMARY_MAIN}20` : '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                📄 PDF Documents Only
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sync only PDF documents (blood donation guides, eligibility info)
              </Typography>
            </Box>

            <Box
              onClick={() => setSelectedDataSource('web')}
              sx={{
                p: 2,
                border: selectedDataSource === 'web' ? `2px solid ${PRIMARY_MAIN}` : '1px solid #e0e0e0',
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: selectedDataSource === 'web' ? `${PRIMARY_MAIN}10` : 'transparent',
                '&:hover': {
                  backgroundColor: selectedDataSource === 'web' ? `${PRIMARY_MAIN}20` : '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                🌐 Website Content Only
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sync only Blood Bank website content
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSyncDialogClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSync}
            color="primary"
            variant="contained"
            disabled={isLoading}
            sx={{ backgroundColor: PRIMARY_MAIN }}
          >
            {isLoading ? 'Starting Sync...' : 'Start Sync'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;