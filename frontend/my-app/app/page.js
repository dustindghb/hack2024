'use client'

import AudioRecorderButton from './components/recorderButton';
import Box from '@mui/material/Box';

export default function Home() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      p: 3
    }}>
      <AudioRecorderButton />
    </Box>
  );
}