'use client';

import { Box, Typography, Divider, Grid } from '@mui/material';
import { MetricCardSkeleton } from './MetricCard';

export default function LoadingScreen() {
  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Critical Metrics Section */}
      <Typography variant="h6" fontWeight={600} mb={2} color="error.main">
        Métricas Críticas
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Performance Section */}
      <Typography variant="h6" fontWeight={600} mb={2} color="warning.main">
        Performance
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[...Array(4)].map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={`perf-${index}`}>
            <MetricCardSkeleton />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Stats Section */}
      <Typography variant="h6" fontWeight={600} mb={2} color="info.main">
        Estatísticas
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              height: 300,
              bgcolor: 'background.paper',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            Gráfico de desempenho
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              height: 300,
              bgcolor: 'background.paper',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            Estatísticas
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
