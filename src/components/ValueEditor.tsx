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
}

const ValueEditor = ({ keyName, value, onSave }: ValueEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [editedValue, setEditedValue] = useState<any>(value.value);
  const [ttl, setTtl] = useState<number>(value.ttl > 0 ? value.ttl : -1);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newField, setNewField] = useState({ key: '', value: '' });
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'json'>('json');

  useEffect(() => {
    setEditedValue(value.value);
    setTtl(value.ttl > 0 ? value.ttl : -1);
    setIsEditing(false);
    setError(null);
  }, [value]);

  const handleSave = async () => {
    try {
      await dispatch(
        updateValue({
          key: keyName,
          value: editedValue,
          type: value.type,
          ttl: ttl > 0 ? ttl : undefined,
        })
      ).unwrap();
      setIsEditing(false);
      setError(null);
      onSave();
    } catch (err) {
      setError(err as string);
    }
  };

  const handleCancel = () => {
    setEditedValue(value.value);
    setTtl(value.ttl > 0 ? value.ttl : -1);
    setIsEditing(false);
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" gap={1} alignItems="center">
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
            
            {!jsonResult.isJson && viewMode === 'json' && (
              <Chip label="Plain Text" size="small" color="default" />
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
              readOnly: !isEditing,
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Hash Fields</Typography>
        {isEditing && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Field
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Field</TableCell>
              <TableCell>Value</TableCell>
              {isEditing && <TableCell width={100}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(editedValue || {}).map(([field, fieldValue]) => (
              <TableRow key={field}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{field}</TableCell>
                <TableCell>
                  {isEditing ? (
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
                  ) : (
                    <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {String(fieldValue)}
                    </Typography>
                  )}
                </TableCell>
                {isEditing && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteField(field)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderListEditor = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">List Items</Typography>
        {isEditing && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Item
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={80}>Index</TableCell>
              <TableCell>Value</TableCell>
              {isEditing && <TableCell width={100}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(editedValue || []).map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{index}</TableCell>
                <TableCell>
                  {isEditing ? (
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
                  ) : (
                    <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {String(item)}
                    </Typography>
                  )}
                </TableCell>
                {isEditing && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteField(index)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSetEditor = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Set Members</Typography>
        {isEditing && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Member
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              {isEditing && <TableCell width={100}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(editedValue || []).map((member: any, index: number) => (
              <TableRow key={index}>
                <TableCell>
                  {isEditing ? (
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
                  ) : (
                    <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {String(member)}
                    </Typography>
                  )}
                </TableCell>
                {isEditing && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteField(index)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderEditor = () => {
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
        return (
          <Typography color="text.secondary">
            Editor for {value.type} type is not implemented yet
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Size: {value.size} | TTL: {formatTTL(value.ttl)}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {isEditing ? (
            <>
              <Button onClick={handleCancel} size="small">
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              size="small"
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {isEditing && (
        <Box mb={2}>
          <TextField
            label="TTL (seconds, -1 for no expiry)"
            type="number"
            value={ttl}
            onChange={(e) => setTtl(parseInt(e.target.value))}
            size="small"
            sx={{ width: 200 }}
          />
        </Box>
      )}

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
