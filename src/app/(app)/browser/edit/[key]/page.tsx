'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchValue, setSelectedKey } from '@/store/slices/keysSlice';
import ValueEditor from '@/components/ValueEditor';

export default function EditKeyPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedKey, selectedValue, isLoadingValue } = useSelector(
    (state: RootState) => state.keys
  );
  const hasFetchedRef = useRef<string | null>(null);

  // Decodificar a chave da URL
  const keyName = decodeURIComponent(params.key as string);

  useEffect(() => {
    // Sempre buscar o valor ao acessar a página, para garantir dados atualizados
    // Usar ref para evitar chamadas duplicadas em Strict Mode
    if (keyName && hasFetchedRef.current !== keyName) {
      hasFetchedRef.current = keyName;
      // Limpar valor anterior para evitar mostrar valor errado
      dispatch(setSelectedKey(null));
      dispatch(setSelectedKey(keyName));
      dispatch(fetchValue(keyName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyName]);

  const handleBack = () => {
    router.push('/browser');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
          {keyName}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {isLoadingValue ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <ValueEditor onBack={handleBack} />
        )}
      </Box>
    </Box>
  );
}
