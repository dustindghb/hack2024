// app/components/AudioRecorderButton.js
import React, { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';

const NON_CONSENT_PHRASES = [
  "i do not consent",
  "don't consent",
  "do not consent",
  "don't agree",
  "do not agree",
  "refuse to be recorded",
  "stop recording",
  "no recording",
  "cannot record",
  "can't record",
  "don't record"
];

const AudioRecorderButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recognition = useRef(null);

  const checkForNonConsent = (text) => {
    const lowerText = text.toLowerCase();
    return NON_CONSENT_PHRASES.some(phrase => lowerText.includes(phrase));
  };

  const handleNonConsent = () => {
    stopRecording();
    setSnackbarMessage('Recording stopped: Caller did not consent to being recorded');
    setSnackbarOpen(true);
    // Clear the audio URL and transcript
    setAudioURL('');
    setTranscript('');
  };

  useEffect(() => {
    // Initialize speech recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const newTranscript = currentTranscript.trim();
        setTranscript(newTranscript);

        // Check for non-consent phrases in the new text
        if (checkForNonConsent(newTranscript)) {
          handleNonConsent();
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Error with speech recognition: ' + event.error);
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    // Cleanup
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        audioChunks.current = [];
        
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
        setIsTranscribing(false);
      };

      // Start both recording and speech recognition
      mediaRecorder.current.start();
      if (recognition.current) {
        recognition.current.start();
      }
      setIsRecording(true);
      setIsTranscribing(true);
      setError('');
      setTranscript('');
      
      // Show recording started notification
      setSnackbarMessage('Recording started');
      setSnackbarOpen(true);
    } catch (error) {
      setError('Error accessing microphone. Please ensure you have granted permission.');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsRecording(false);
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 2,
      width: '100%',
      maxWidth: '600px'
    }}>
      <Button
        variant={isRecording ? "contained" : "outlined"}
        color={isRecording ? "error" : "primary"}
        onClick={handleClick}
        startIcon={isRecording ? <StopIcon /> : <MicIcon />}
        sx={{ minWidth: '200px' }}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      
      {isTranscribing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Transcribing...</Typography>
        </Box>
      )}

      {transcript && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mt: 2, 
            width: '100%', 
            maxHeight: '200px',
            overflowY: 'auto',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Transcript
          </Typography>
          <Typography>
            {transcript}
          </Typography>
        </Paper>
      )}
      
      {audioURL && (
        <Box sx={{ mt: 2, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Recording
          </Typography>
          <audio 
            src={audioURL} 
            controls 
            style={{ width: '100%' }}
          />
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AudioRecorderButton;