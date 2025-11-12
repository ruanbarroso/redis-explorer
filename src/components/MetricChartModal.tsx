import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { ChartableMetricName, MetricPeriod, CHARTABLE_METRICS } from '@/types/metrics-history';
import { useMetricHistory } from '@/hooks/useMetricHistory';
import { useState } from 'react';

interface MetricChartModalProps {
  open: boolean;
  onClose: () => void;
  metricName: ChartableMetricName | null;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  const theme = useTheme();

  if (!active || !payload || !payload.length) {
    return null;
  }

  const date = new Date(label);
  const value = payload[0].value;
  const unit = payload[0].unit || '';

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: 1.5,
        boxShadow: theme.shadows[3],
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {date.toLocaleString('pt-BR')}
      </Typography>
      <Typography variant="body1" fontWeight={600} color={payload[0].color}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit}
      </Typography>
    </Box>
  );
};

export const MetricChartModal = ({ open, onClose, metricName }: MetricChartModalProps) => {
  const theme = useTheme();
  const [period, setPeriod] = useState<MetricPeriod>('24h');

  const metricConfig = metricName ? CHARTABLE_METRICS[metricName] : null;
  const { data, isLoading, error } = useMetricHistory(metricName, period, open);

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: MetricPeriod | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    value: point.value,
  }));

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (period === '1h') {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatYAxis = (value: number) => {
    if (!metricConfig) return value.toString();
    return `${value.toFixed(1)}${metricConfig.unit}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" component="div">
            {metricConfig?.title || 'Métrica'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Histórico de valores ao longo do tempo
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange} size="small">
            <ToggleButton value="1h">1h</ToggleButton>
            <ToggleButton value="6h">6h</ToggleButton>
            <ToggleButton value="12h">12h</ToggleButton>
            <ToggleButton value="24h">24h</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {!isLoading && !error && chartData.length === 0 && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography color="text.secondary">Nenhum dado disponível para este período</Typography>
          </Box>
        )}

        {!isLoading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metricConfig?.color || theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                unit={metricConfig?.unit}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Dica:</strong> Os dados são mantidos por até 24 horas. Clique em diferentes períodos para
            visualizar intervalos específicos.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
