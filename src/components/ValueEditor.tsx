'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Code as CodeIcon,
  TextFields as TextIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { updateValue } from '@/store/slices/keysSlice';
import { RedisValue, RedisDataType } from '@/types/redis';
import { tryParseAndFormatJson, detectJsonType, getJsonStats } from '@/utils/jsonFormatter';
import { formatTTL } from '@/utils/timeFormatter';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface ValueEditorProps {
  keyName: string;
  value: RedisValue;
  onSave: () => void;
  onDelete?: () => void;
}

const ValueEditor = ({ keyName, value, onSave, onDelete }: ValueEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  // Detectar se é uma chave nova (não existe)
  const isNewKey = value.value === null && value.type === 'none';
  const [editedValue, setEditedValue] = useState<any>(isNewKey ? '' : value.value);
  const [ttl, setTtl] = useState<number>(value.ttl);
  const [isEditingTTL, setIsEditingTTL] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newField, setNewField] = useState({ key: '', value: '' });
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'json'>('json');
  const [hasChanges, setHasChanges] = useState(isNewKey);

  const calculateSize = () => {
    if (editedValue === null || editedValue === undefined) return 0;
    if (typeof editedValue === 'string') return editedValue.length;
    return JSON.stringify(editedValue).length;
  };

  useEffect(() => {
    const isNew = value.value === null && value.type === 'none';
    setEditedValue(isNew ? '' : value.value);
    setTtl(value.ttl);
    setIsEditingTTL(false);
    setHasChanges(isNew);
    setError(null);
  }, [value]);

  useEffect(() => {
    const valueChanged = JSON.stringify(editedValue) !== JSON.stringify(value.value);
    const ttlChanged = ttl !== (value.ttl > 0 ? value.ttl : -1);
    setHasChanges(valueChanged || ttlChanged);
  }, [editedValue, ttl, value]);

  const handleSave = async () => {
    try {
      // Se for chave nova, salvar como string
      const typeToSave = isNewKey ? 'string' : value.type;
      await dispatch(
        updateValue({
          key: keyName,
          value: editedValue,
          type: typeToSave,
          ttl: ttl > 0 ? ttl : undefined,
        })
      ).unwrap();
      setHasChanges(false);
      setError(null);
      onSave();
    } catch (err) {
      setError(err as string);
    }
  };

  const handleCancel = () => {
    setEditedValue(value.value);
    setTtl(value.ttl > 0 ? value.ttl : -1);
    setHasChanges(false);
    setError(null);
  };

  const handleAddField = () => {
    if (value.type === 'hash') {
      setEditedValue({
        ...editedValue,
        [newField.key]: newField.value,
      });
    } else if (value.type === 'list') {
      setEditedValue([...editedValue, newField.value]);
    } else if (value.type === 'set') {
      setEditedValue([...editedValue, newField.value]);
    }
    setNewField({ key: '', value: '' });
    setDialogOpen(false);
  };

  const handleDeleteField = (key: string | number) => {
    if (value.type === 'hash') {
      const newValue = { ...editedValue };
      delete newValue[key];
      setEditedValue(newValue);
    } else if (value.type === 'list' || value.type === 'set') {
      const newValue = [...editedValue];
      newValue.splice(key as number, 1);
      setEditedValue(newValue);
    }
  };


  const renderStringEditor = () => {
    const jsonResult = tryParseAndFormatJson(editedValue || '');
    const displayValue = viewMode === 'json' && jsonResult.isJson ? jsonResult.formatted : (editedValue || '');
    const language = viewMode === 'json' && jsonResult.isJson ? 'json' : 'text';

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" gap={1} alignItems="center">
            {/* Só mostra os botões de alternância se o conteúdo for JSON válido */}
            {jsonResult.isJson && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="json">
                  <Tooltip title="JSON Format">
                    <CodeIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="raw">
                  <Tooltip title="Raw Text">
                    <TextIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            
            {jsonResult.isJson && (
              <Box display="flex" gap={1}>
                <Chip 
                  label={`JSON ${detectJsonType(jsonResult.parsed)}`} 
                  size="small" 
                  color="success" 
                />
                {jsonResult.parsed && (
                  <Chip 
                    label={`${getJsonStats(jsonResult.parsed).keys || getJsonStats(jsonResult.parsed).items || 0} ${
                      Array.isArray(jsonResult.parsed) ? 'items' : 'keys'
                    }`}
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            )}
            
            {!jsonResult.isJson && (
              <Chip label="Plain Text" size="small" color="default" />
            )}
          </Box>
          
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title="Time to Live (seconds). Use -1 for no expiry">
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                TTL:
              </Typography>
            </Tooltip>
            {isEditingTTL ? (
              <TextField
                type="number"
                value={ttl}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTtl(isNaN(val) ? -1 : val);
                }}
                onBlur={() => setIsEditingTTL(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTTL(false);
                  }
                }}
                size="small"
                autoFocus
                sx={{ width: 100 }}
              />
            ) : (
              <Chip
                label={formatTTL(ttl)}
                size="small"
                onClick={() => setIsEditingTTL(true)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              />
            )}
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <MonacoEditor
            height="100%"
            language={language}
            theme="vs-dark"
            value={displayValue}
            onChange={(value) => setEditedValue(value || '')}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: jsonResult.isJson,
              formatOnType: jsonResult.isJson,
            }}
          />
        </Box>
      </Box>
    );
  };

  const renderHashEditor = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Hash Fields</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Time to Live (seconds). Use -1 for no expiry">
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
              TTL:
            </Typography>
          </Tooltip>
          {isEditingTTL ? (
            <TextField
              type="number"
              value={ttl}
              onChange={(e) => setTtl(parseInt(e.target.value))}
              onBlur={() => setIsEditingTTL(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTTL(false);
                }
              }}
              size="small"
              autoFocus
              sx={{ width: 100 }}
            />
          ) : (
            <Chip
              label={formatTTL(ttl)}
              size="small"
              onClick={() => setIsEditingTTL(true)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          )}
          {hasChanges ? (
            <>
              <Button 
                onClick={handleCancel} 
                size="small"
                variant="outlined"
                color="warning"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
                color="success"
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                size="small"
                variant="outlined"
              >
                Add Field
              </Button>
              {onDelete && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                  size="small"
                  color="error"
                >
                  Remove
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Field</TableCell>
              <TableCell>Value</TableCell>
              <TableCell width={100}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(editedValue || {}).map(([field, fieldValue]) => (
              <TableRow key={field}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{field}</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={fieldValue as string}
                    onChange={(e) =>
                      setEditedValue({
                        ...editedValue,
                        [field]: e.target.value,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteField(field)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderListEditor = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">List Items</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Time to Live (seconds). Use -1 for no expiry">
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
              TTL:
            </Typography>
          </Tooltip>
          {isEditingTTL ? (
            <TextField
              type="number"
              value={ttl}
              onChange={(e) => setTtl(parseInt(e.target.value))}
              onBlur={() => setIsEditingTTL(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTTL(false);
                }
              }}
              size="small"
              autoFocus
              sx={{ width: 100 }}
            />
          ) : (
            <Chip
              label={formatTTL(ttl)}
              size="small"
              onClick={() => setIsEditingTTL(true)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          )}
          {hasChanges ? (
            <>
              <Button 
                onClick={handleCancel} 
                size="small"
                variant="outlined"
                color="warning"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
                color="success"
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                size="small"
                variant="outlined"
              >
                Add Item
              </Button>
              {onDelete && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                  size="small"
                  color="error"
                >
                  Remove
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={80}>Index</TableCell>
              <TableCell>Value</TableCell>
              <TableCell width={100}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(editedValue || []).map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{index}</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={item}
                    onChange={(e) => {
                      const newValue = [...editedValue];
                      newValue[index] = e.target.value;
                      setEditedValue(newValue);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteField(index)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSetEditor = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Set Members</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Time to Live (seconds). Use -1 for no expiry">
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
              TTL:
            </Typography>
          </Tooltip>
          {isEditingTTL ? (
            <TextField
              type="number"
              value={ttl}
              onChange={(e) => setTtl(parseInt(e.target.value))}
              onBlur={() => setIsEditingTTL(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTTL(false);
                }
              }}
              size="small"
              autoFocus
              sx={{ width: 100 }}
            />
          ) : (
            <Chip
              label={formatTTL(ttl)}
              size="small"
              onClick={() => setIsEditingTTL(true)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          )}
          {hasChanges ? (
            <>
              <Button 
                onClick={handleCancel} 
                size="small"
                variant="outlined"
                color="warning"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
                color="success"
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                size="small"
                variant="outlined"
              >
                Add Member
              </Button>
              {onDelete && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                  size="small"
                  color="error"
                >
                  Remove
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell width={100}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(editedValue || []).map((member: any, index: number) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={member}
                    onChange={(e) => {
                      const newValue = [...editedValue];
                      newValue[index] = e.target.value;
                      setEditedValue(newValue);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteField(index)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderFallbackEditor = () => {
    const stringValue = typeof editedValue === 'string' 
      ? editedValue 
      : JSON.stringify(editedValue, null, 2);

    const typeLabel = value.type ? value.type.toUpperCase() : 'UNKNOWN';

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip 
            label={`${typeLabel} - Read Only`} 
            size="small" 
            color="warning" 
          />
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <MonacoEditor
            height="100%"
            language="text"
            theme="vs-dark"
            value={stringValue}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </Box>
      </Box>
    );
  };

  const renderEditor = () => {
    // Se for chave nova, renderizar como string editor
    if (isNewKey) {
      return renderStringEditor();
    }
    
    switch (value.type) {
      case 'string':
        return renderStringEditor();
      case 'hash':
        return renderHashEditor();
      case 'list':
        return renderListEditor();
      case 'set':
        return renderSetEditor();
      default:
        return renderFallbackEditor();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 0.5 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="body2" color="text.secondary">
          Size: {calculateSize()} bytes
        </Typography>
        <Box display="flex" gap={1}>
          {hasChanges ? (
            <>
              {/* Não mostrar botão Cancel se for chave nova */}
              {!isNewKey && (
                <Button 
                  onClick={handleCancel} 
                  size="small"
                  variant="outlined"
                  color="warning"
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
                color="success"
              >
                Save
              </Button>
            </>
          ) : (
            /* Não mostrar botão Delete se for chave nova */
            !isNewKey && onDelete && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
                size="small"
                color="error"
              >
                Remove
              </Button>
            )
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {renderEditor()}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Add {value.type === 'hash' ? 'Field' : 'Item'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {value.type === 'hash' && (
              <TextField
                label="Field Name"
                value={newField.key}
                onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                fullWidth
              />
            )}
            <TextField
              label="Value"
              value={newField.value}
              onChange={(e) => setNewField({ ...newField, value: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddField}
            variant="contained"
            disabled={
              !newField.value ||
              (value.type === 'hash' && !newField.key)
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValueEditor;
