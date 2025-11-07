'use client';

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface SeparatorSelectorProps {
  detectedSeparator: string;
  customSeparator?: string;
  onSeparatorChange: (separator: string) => void;
}

const COMMON_SEPARATORS = [
  { value: ':', label: 'Colon (:)', example: 'user:123:profile' },
  { value: '::', label: 'Double Colon (::)', example: 'user::123::profile' },
  { value: '/', label: 'Slash (/)', example: 'user/123/profile' },
  { value: '.', label: 'Dot (.)', example: 'user.123.profile' },
  { value: '-', label: 'Dash (-)', example: 'user-123-profile' },
  { value: '_', label: 'Underscore (_)', example: 'user_123_profile' },
  { value: '|', label: 'Pipe (|)', example: 'user|123|profile' },
  { value: 'custom', label: 'Custom', example: 'Define your own' },
];

export default function SeparatorSelector({
  detectedSeparator,
  customSeparator,
  onSeparatorChange,
}: SeparatorSelectorProps) {
  const [selectedValue, setSelectedValue] = useState(
    customSeparator || detectedSeparator
  );
  const [customValue, setCustomValue] = useState('');
  const [isCustom, setIsCustom] = useState(
    !COMMON_SEPARATORS.some(sep => sep.value === selectedValue && sep.value !== 'custom')
  );

  // Sincronizar com detectedSeparator quando não há customização manual
  useEffect(() => {
    if (!customSeparator) {
      setSelectedValue(detectedSeparator);
      setIsCustom(!COMMON_SEPARATORS.some(sep => sep.value === detectedSeparator && sep.value !== 'custom'));
    }
  }, [detectedSeparator, customSeparator]);

  const handleChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      setSelectedValue('custom');
    } else {
      setIsCustom(false);
      setSelectedValue(value);
      onSeparatorChange(value);
    }
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    onSeparatorChange(value);
  };

  const getCurrentSeparator = () => {
    return isCustom ? customValue : selectedValue;
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" alignItems="center" gap={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Key Separator</InputLabel>
          <Select
            value={isCustom ? 'custom' : selectedValue}
            label="Key Separator"
            onChange={(e) => handleChange(e.target.value)}
          >
            {COMMON_SEPARATORS.map((sep) => (
              <MenuItem key={sep.value} value={sep.value}>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" component="span">{sep.label}</Typography>
                  <Typography variant="caption" color="text.secondary" component="span">
                    {sep.example}
                  </Typography>
                </span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isCustom && (
          <TextField
            size="small"
            label="Custom Separator"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Enter separator"
            sx={{ width: 150 }}
          />
        )}

        <Box display="flex" gap={1} alignItems="center">
          <Chip
            label={`Detected: "${detectedSeparator}"`}
            size="small"
            variant="outlined"
            color="info"
          />
          {getCurrentSeparator() !== detectedSeparator && (
            <Chip
              label={`Using: "${getCurrentSeparator()}"`}
              size="small"
              color="primary"
            />
          )}
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" component="div">
        The separator is used to create the hierarchical tree structure from your Redis keys.
        Choose the one that best matches your key naming pattern.
      </Typography>
    </Box>
  );
}
