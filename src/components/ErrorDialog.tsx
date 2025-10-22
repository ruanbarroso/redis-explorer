'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ErrorDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

const ErrorDialog = ({ 
  open, 
  title = "Erro de Conexão", 
  message, 
  onClose 
}: ErrorDialogProps) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <ErrorIcon color="error" />
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1 }}>
        <Alert 
          severity="error" 
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="body1">
            {message}
          </Typography>
        </Alert>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Possíveis soluções:</strong>
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Verifique se o servidor Redis está rodando
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Confirme o endereço e porta da conexão
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Teste a conexão usando o botão "Testar Conexão"
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Verifique se há firewall bloqueando a conexão
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          sx={{ minWidth: 100 }}
        >
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog;
