import { useState } from 'react';

// Define your API endpoint and constants for retry logic
const API_ENDPOINT = 'https://rpa8u8ue84.execute-api.us-west-2.amazonaws.com/production/analyze-sentiment';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // Delay in milliseconds

// Custom React hook for sentiment analysis
export const useSentimentAnalysis = () => {
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    // Helper function for introducing a delay
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Main function to call the API and handle retries
    const analyzeSentiment = async (transcript) => {
        setIsAnalyzing(true);
        setError(null);

        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
            try {
                // API call
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transcript }),
                });

                // Check if response is successful
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Parse JSON response
                const data = await response.json();
                setAnalysisResults(data);
                setIsAnalyzing(false);
                return data; // Return result if successful
            } catch (err) {
                console.error(`Attempt ${attempt} failed:`, err);

                // If the last attempt fails, set the error state and stop retrying
                if (attempt === RETRY_ATTEMPTS) {
                    setError('Failed to analyze sentiment. Please try again later.');
                    setIsAnalyzing(false);
                    throw err;
                }

                // Wait before retrying
                await sleep(RETRY_DELAY * attempt);
            }
        }
    };

    // Function to clear results and errors
    const clearAnalysis = () => {
        setAnalysisResults(null);
        setError(null);
    };

    // Return hook state and functions
    return {
        analyzeSentiment,
        clearAnalysis,
        analysisResults,
        isAnalyzing,
        error,
    };
};