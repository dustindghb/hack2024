'use client'

import { useState } from 'react';
import AudioRecorderButton from './components/AudioRecorderButton';
import { Container, Box, Tabs, Tab } from '@mui/material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        minHeight: '100vh',
        py: 4 
      }}>
        <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Audio Recorder" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <AudioRecorderButton />
        </TabPanel>
      </Box>
    </Container>
  );
}