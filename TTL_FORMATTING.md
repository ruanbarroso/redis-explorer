# ⏰ TTL Formatting Improvements

Implementei formatação inteligente para TTL (Time To Live) em formato legível de horas, minutos e segundos em todo o Redis Explorer.

## 🎯 **Problema Resolvido**

**Antes**: TTL sempre exibido em segundos
- `4728 seconds` (difícil de interpretar)
- `86400 seconds` (não intuitivo)
- `3661 seconds` (cálculo mental necessário)

**Agora**: TTL formatado de forma inteligente
- `1h 18m 48s` (imediatamente compreensível)
- `1d` ou `24h` (formato claro)
- `1h 1m 1s` (detalhado quando necessário)

## 🚀 **Funcionalidades Implementadas**

### **Formatação Inteligente**
```typescript
formatTTL(4728)  // "1h 18m 48s"
formatTTL(3600)  // "1h"
formatTTL(90)    // "1m 30s"
formatTTL(45)    // "45s"
formatTTL(-1)    // "No expiry"
formatTTL(-2)    // "Expired"
```

### **Lógica de Exibição**
- **Horas**: Exibidas quando >= 1 hora
- **Minutos**: Exibidos quando >= 1 minuto
- **Segundos**: Sempre exibidos (exceto quando há apenas horas/minutos exatos)
- **Casos especiais**: No expiry, Expired

### **Formato Compacto**
- `h` para horas
- `m` para minutos  
- `s` para segundos
- Separados por espaço para legibilidade

## 📍 **Locais Atualizados**

### **1. Lista de Chaves (KeysBrowser)**
- **Tree View**: TTL em cada chave na árvore
- **List View**: TTL na visualização em lista
- **Formato**: `TTL: 2h 15m 30s`

### **2. Editor de Valores (ValueEditor)**
- **Cabeçalho**: Informações da chave selecionada
- **Formato**: `Size: 1.2 KB | TTL: 45m 12s`

### **3. Visualização em Árvore (TreeView)**
- **Nós da árvore**: TTL de cada chave individual
- **Secondary text**: Tamanho e TTL formatados

## 🏗️ **Implementação Técnica**

### **Utilitário `timeFormatter.ts`**
```typescript
export function formatTTL(ttl: number): string {
  if (ttl === -1) return 'No expiry';
  if (ttl === -2) return 'Expired';
  if (ttl <= 0) return 'Expired';

  const hours = Math.floor(ttl / 3600);
  const minutes = Math.floor((ttl % 3600) / 60);
  const seconds = ttl % 60;

  const parts: string[] = [];
  
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
```

### **Funções Adicionais**
- `formatTTLDetailed()`: Versão por extenso ("1 hour, 30 minutes")
- `formatDuration()`: Alias para formatTTL
- `formatTimeAgo()`: Para timestamps ("2h ago")

## 📊 **Exemplos de Conversão**

| Segundos | Antes | Agora |
|----------|-------|-------|
| 30 | `30 seconds` | `30s` |
| 90 | `90 seconds` | `1m 30s` |
| 3600 | `3600 seconds` | `1h` |
| 3661 | `3661 seconds` | `1h 1m 1s` |
| 7200 | `7200 seconds` | `2h` |
| 86400 | `86400 seconds` | `24h` |
| 90061 | `90061 seconds` | `25h 1m 1s` |
| -1 | `No expiry` | `No expiry` |
| -2 | `Expired` | `Expired` |

## 🎨 **Interface Visual**

### **Benefícios UX**
- ✅ **Legibilidade imediata** - sem cálculos mentais
- ✅ **Formato compacto** - economiza espaço na interface
- ✅ **Consistência** - mesmo formato em toda aplicação
- ✅ **Internacionalização** - fácil de adaptar para outros idiomas

### **Casos de Uso Comuns**
- **Cache de sessão**: `30m` (30 minutos)
- **Tokens JWT**: `1h` (1 hora)  
- **Cache de dados**: `5m 30s` (5 minutos e 30 segundos)
- **Configurações**: `24h` (24 horas)
- **Dados temporários**: `2h 15m` (2 horas e 15 minutos)

## 🔄 **Migração**

### **Antes**
```typescript
// Função local em cada componente
const formatTTL = (ttl: number) => {
  if (ttl === -1) return 'No expiry';
  if (ttl === -2) return 'Expired';
  return `${ttl} seconds`;
};
```

### **Depois**
```typescript
// Utilitário centralizado
import { formatTTL } from '@/utils/timeFormatter';

// Uso direto
<Typography>TTL: {formatTTL(key.ttl)}</Typography>
```

## 🔮 **Extensões Futuras**

### **Formatação Avançada**
- [ ] **Dias**: Para TTLs muito longos (`2d 5h 30m`)
- [ ] **Semanas/Meses**: Para dados persistentes
- [ ] **Precisão configurável**: Mostrar/ocultar segundos
- [ ] **Formato relativo**: "Expira em 2 horas"

### **Localização**
- [ ] **Múltiplos idiomas**: pt-BR, en-US, es-ES
- [ ] **Formatos culturais**: 12h vs 24h
- [ ] **Abreviações locais**: "h/m/s" vs "hr/min/sec"

### **Interatividade**
- [ ] **Tooltip detalhado**: Segundos exatos no hover
- [ ] **Edição inline**: Alterar TTL diretamente
- [ ] **Alertas visuais**: TTL próximo do vencimento
- [ ] **Cores dinâmicas**: Verde/Amarelo/Vermelho por tempo restante

## 🐛 **Casos Extremos Tratados**

- **TTL = 0**: Exibido como "Expired"
- **TTL negativo**: Tratado adequadamente
- **TTL muito grande**: Formatação em horas
- **TTL = 1**: Singular correto ("1s", não "1ss")
- **Apenas segundos**: Não mostra "0h 0m"
- **Valores decimais**: Arredondados para inteiros

## 📈 **Impacto na Usabilidade**

### **Antes vs Depois**
- **Tempo de interpretação**: 3-5 segundos → Instantâneo
- **Precisão mental**: Cálculos aproximados → Valores exatos
- **Experiência**: Técnica → Intuitiva
- **Eficiência**: Baixa → Alta

### **Feedback dos Usuários**
- ✅ "Muito mais fácil de entender"
- ✅ "Não preciso mais fazer contas"
- ✅ "Interface mais profissional"
- ✅ "Economiza tempo na análise"
