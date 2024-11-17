import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel 
} from '@mui/material';

const ApiTester = ({ apiUrl: baseApiUrl }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [testMessage, setTestMessage] = useState('This is a test message to analyze sentiment.');
  const [isLoading, setIsLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/analyze'); // or whatever your endpoint is
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Ensure the base URL doesn't end with a slash
  const apiUrl = baseApiUrl ? baseApiUrl.replace(/\/$/, '') : '';

  // Function to validate URL structure
  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      // Check if URL matches expected API Gateway pattern
      const isApiGatewayUrl = /execute-api\.[a-z0-9-]+\.amazonaws\.com/.test(urlObj.host);
      return {
        isValid: true,
        isApiGateway: isApiGatewayUrl,
        host: urlObj.host,
        path: urlObj.pathname,
        stage: urlObj.pathname.split('/')[1], // Should be 'dev', 'prod', etc.
        resource: urlObj.pathname.split('/').slice(2).join('/') // The actual endpoint
      };
    } catch (e) {
      return { isValid: false };
    }
  };

  const urlInfo = validateUrl(apiUrl + endpoint);

  const testApi = async () => {
    try {
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }

      setError(null);
      setResult(null);
      setIsLoading(true);

      const fullUrl = `${apiUrl}${endpoint}`;
      console.log('Making request to:', fullUrl);
      console.log('URL analysis:', validateUrl(fullUrl));

      const headers = {
        'Content-Type': 'application/json',
      };

      if (API_KEY) {
        headers['x-api-key'] = API_KEY;
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ transcript: testMessage })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.message || errorData.Message || JSON.stringify(errorData)}`;
        } catch (e) {
          const errorText = await response.text();
          errorMessage += errorText ? ` - ${errorText}` : '';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Success response:', data);
      setResult(data);
    } catch (err) {
      console.error('API Gateway test failed:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        API Gateway Test Tool
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.main', color: 'info.contrastText' }}>
        <Typography variant="subtitle2" gutterBottom>
          URL Analysis:
        </Typography>
        <Typography variant="body2" component="div">
          {urlInfo.isValid ? (
            <>
              <strong>Full URL:</strong> {apiUrl + endpoint}<br />
              <strong>Host:</strong> {urlInfo.host}<br />
              <strong>Stage:</strong> {urlInfo.stage}<br />
              <strong>Resource Path:</strong> {urlInfo.resource || '/'}<br />
              {!urlInfo.isApiGateway && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Warning: URL doesn't match API Gateway pattern
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="error">
              Invalid URL format
            </Alert>
          )}
        </Typography>
      </Paper>

      <TextField
        fullWidth
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        label="Endpoint Path"
        margin="normal"
        helperText="e.g., /analyze or /sentiment"
      />
      
      <TextField
        fullWidth
        multiline
        rows={3}
        value={testMessage}
        onChange={(e) => setTestMessage(e.target.value)}
        label="Test Message"
        margin="normal"
      />

      <Button 
        variant="contained" 
        onClick={testApi}
        disabled={isLoading || !apiUrl}
        sx={{ mt: 2 }}
      >
        {isLoading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Testing API Gateway...
          </>
        ) : (
          'Test API Gateway'
        )}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>API Gateway Error (404):</strong> {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            404 Troubleshooting Steps:
            <ul>
              <li>Verify the stage name in the URL (dev, prod, etc.)</li>
              <li>Check if the resource path matches your API Gateway configuration</li>
              <li>Ensure the API has been deployed to the stage you're trying to access</li>
              <li>Confirm the HTTP method (POST) is enabled for this resource</li>
              <li>Try testing the endpoint in API Gateway's console test feature</li>
            </ul>
          </Typography>
        </Alert>
      )}

      {result && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            API Gateway Response:
          </Typography>
          <pre style={{ 
            overflow: 'auto', 
            maxHeight: '300px',
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
};

export default ApiTester;