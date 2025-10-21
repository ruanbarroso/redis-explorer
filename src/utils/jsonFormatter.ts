export interface JsonFormatResult {
  isJson: boolean;
  formatted: string;
  parsed?: any;
  error?: string;
}

export function tryParseAndFormatJson(value: string): JsonFormatResult {
  if (!value || typeof value !== 'string') {
    return {
      isJson: false,
      formatted: String(value || ''),
    };
  }

  // Remove leading/trailing whitespace
  const trimmed = value.trim();
  
  // Quick check if it looks like JSON
  if (
    !(trimmed.startsWith('{') && trimmed.endsWith('}')) &&
    !(trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return {
      isJson: false,
      formatted: value,
    };
  }

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(trimmed);
    
    // Format with proper indentation
    const formatted = JSON.stringify(parsed, null, 2);
    
    return {
      isJson: true,
      formatted,
      parsed,
    };
  } catch (error) {
    return {
      isJson: false,
      formatted: value,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export function detectJsonType(parsed: any): string {
  if (parsed === null) return 'null';
  if (Array.isArray(parsed)) return 'array';
  if (typeof parsed === 'object') return 'object';
  if (typeof parsed === 'string') return 'string';
  if (typeof parsed === 'number') return 'number';
  if (typeof parsed === 'boolean') return 'boolean';
  return 'unknown';
}

export function getJsonStats(parsed: any): { keys?: number; items?: number; depth: number } {
  const getDepth = (obj: any, currentDepth = 0): number => {
    if (obj === null || typeof obj !== 'object') {
      return currentDepth;
    }
    
    if (Array.isArray(obj)) {
      return Math.max(currentDepth, ...obj.map(item => getDepth(item, currentDepth + 1)));
    }
    
    const values = Object.values(obj);
    if (values.length === 0) return currentDepth + 1;
    
    return Math.max(currentDepth + 1, ...values.map(value => getDepth(value, currentDepth + 1)));
  };

  const depth = getDepth(parsed);
  
  if (Array.isArray(parsed)) {
    return { items: parsed.length, depth };
  }
  
  if (parsed && typeof parsed === 'object') {
    return { keys: Object.keys(parsed).length, depth };
  }
  
  return { depth };
}
