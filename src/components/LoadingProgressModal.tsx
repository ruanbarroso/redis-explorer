'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  LinearProgress,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface LoadingProgressModalProps {
  open: boolean;
  phase: 'starting' | 'scanning' | 'processing' | 'completing' | 'complete';
  message: string;
  progress: number;
  total: number;
  current: number;
  startTime?: number;
  onCancel: () => void;
}

const LoadingProgressModal = ({
  open,
  phase,
  message,
  progress,
  total,
  current,
  startTime,
  onCancel,
}: LoadingProgressModalProps) => {
  const getPhaseTitle = (phase: string) => {
    switch (phase) {
      case 'starting':
        return '🚀 Iniciando...';
      case 'scanning':
        return '🔍 Buscando Chaves';
      case 'processing':
        return '⚙️ Processando Dados';
      case 'completing':
        return '✨ Finalizando';
      case 'complete':
        return '✅ Concluído';
      default:
        return '📊 Carregando';
    }
  };

  const getPhaseColor = () => {
    return '#4caf50'; // Always green - clean and professional
  };

  const isComplete = phase === 'complete';
  const canCancel = !isComplete;

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!isComplete}
      onClose={isComplete ? onCancel : undefined}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            {getPhaseTitle(phase)}
          </Typography>
          {isComplete && (
            <IconButton onClick={onCancel} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ width: '100%' }}>
          {/* Main Message */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              {(() => {
                // Add estimated time to the message if available
                if (phase === 'processing' && total > 0 && startTime) {
                  const batchMatch = message.match(/lote (\d+)\/(\d+)/);
                  
                  if (batchMatch) {
                    const currentBatch = parseInt(batchMatch[1]);
                    const totalBatches = parseInt(batchMatch[2]);
                    
                    // Rule 1: If 5 batches or less, don't show time
                    if (totalBatches <= 5) {
                      return message;
                    }
                    
                    // Rule 2: Show clean message until batch 3
                    if (currentBatch < 3) {
                      return message;
                    }
                    
                    // Rule 3: Show estimated time from batch 3+
                    const now = Date.now();
                    const elapsedMs = now - startTime;
                    const elapsedMinutes = elapsedMs / 60000;
                    
                    if (progress > 10 && progress < 95 && elapsedMinutes > 0.1) {
                      const progressRate = progress / elapsedMinutes;
                      const remainingProgress = 100 - progress;
                      const estimatedRemainingMinutes = remainingProgress / progressRate;
                      
                      if (estimatedRemainingMinutes > 0 && estimatedRemainingMinutes < 120) {
                        const totalSeconds = Math.ceil(estimatedRemainingMinutes * 60);
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                        
                        if (minutes > 0) {
                          return `${message} (~${minutes}m ${seconds}s restantes)`;
                        } else {
                          return `${message} (~${seconds}s restantes)`;
                        }
                      }
                    }
                    
                    return message;
                  }
                }
                
                return message;
              })()}
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getPhaseColor(),
                  borderRadius: 6,
                },
              }}
            />
          </Box>

          {/* Progress Details */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {phase === 'processing' && total > 0 ? (
                <>
                  <strong>{current.toLocaleString()}</strong> de{' '}
                  <strong>{total.toLocaleString()}</strong> chaves processadas
                </>
              ) : (
                ''
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {progress}%
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {canCancel ? (
          <Button
            onClick={onCancel}
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            fullWidth
          >
            Cancelar Operação
          </Button>
        ) : (
          <Button onClick={onCancel} variant="contained" color="success" fullWidth>
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LoadingProgressModal;
