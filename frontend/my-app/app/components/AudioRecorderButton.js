import React, { useState, useRef, useEffect } from 'react';
import { useSentimentAnalysis } from '../hooks/useSentimentAnalysis';
import { 
    Button, Box, Alert, Paper, Typography, 
    CircularProgress, Snackbar, LinearProgress, Chip
} from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon } from '@mui/icons-material';

const NON_CONSENT_PHRASES = [
    "i do not consent", "don't consent", "do not agree", "refuse to be recorded",
    "stop recording", "no recording", "cannot record", "can't record", "don't record"
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

    const {
        analyzeSentiment,
        clearAnalysis,
        analysisResults,
        isAnalyzing,
        error: analysisError
    } = useSentimentAnalysis();

    const checkForNonConsent = (text) => {
        const lowerText = text.toLowerCase();
        return NON_CONSENT_PHRASES.some(phrase => lowerText.includes(phrase));
    };

    const handleNonConsent = () => {
        stopRecording();
        setSnackbarMessage('Recording stopped: Caller did not consent to being recorded');
        setSnackbarOpen(true);
        setAudioURL('');
        setTranscript('');
    };

    useEffect(() => {
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

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                audioChunks.current = [];

                stream.getTracks().forEach(track => track.stop());
                setIsTranscribing(false);

                if (transcript) {
                    try {
                        await analyzeSentiment(transcript);
                    } catch (error) {
                        console.error('Error analyzing sentiment:', error);
                    }
                }
            };

            mediaRecorder.current.start();
            if (recognition.current) {
                recognition.current.start();
            }
            setIsRecording(true);
            setIsTranscribing(true);
            setError('');
            setTranscript('');

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

    const renderSentimentResults = () => {
        if (!analysisResults) return null;

        const { sentiment, keyPhrases, entities } = analysisResults;
        const sentimentColors = {
            POSITIVE: '#4caf50',
            NEGATIVE: '#f44336',
            NEUTRAL: '#9e9e9e',
            MIXED: '#ff9800'
        };

        if (!sentiment) {
            return (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No sentiment data available.
                </Alert>
            );
        }

        return (
            <Paper elevation={2} sx={{ p: 2, mt: 2, width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                    Analysis Results
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Overall Sentiment:
                        <span style={{ color: sentimentColors[sentiment.overall], marginLeft: '8px', fontWeight: 'bold' }}>
                            {sentiment.overall}
                        </span>
                    </Typography>

                    {Object.entries(sentiment.scores).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {key}: {(value * 100).toFixed(1)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={value * 100}
                                sx={{
                                    height: 8,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: sentimentColors[key.toUpperCase()]
                                    }
                                }}
                            />
                        </Box>
                    ))}
                </Box>

                {keyPhrases.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Key Phrases
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {keyPhrases.map((phrase, index) => (
                                <Chip key={index} label={phrase.text} variant="outlined" size="small" />
                            ))}
                        </Box>
                    </Box>
                )}

                {entities.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Entities
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {entities.map((entity, index) => (
                                <Chip key={index} label={`${entity.text} (${entity.type})`} variant="outlined" size="small" />
                            ))}
                        </Box>
                    </Box>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', maxWidth: '600px' }}>
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

            {isAnalyzing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>Analyzing sentiment...</Typography>
                </Box>
            )}

            {analysisError && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                    {analysisError}
                </Alert>
            )}

            {transcript && (
                <Paper elevation={2} sx={{ p: 2, mt: 2, width: '100%', maxHeight: '200px', overflowY: 'auto', bgcolor: 'grey.50' }}>
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
                    <audio src={audioURL} controls style={{ width: '100%' }} />
                </Box>
            )}

            {renderSentimentResults()}

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