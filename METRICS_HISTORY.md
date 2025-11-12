# Sistema de Histórico de Métricas

Este documento descreve o sistema de histórico e visualização gráfica de métricas do Redis Explorer.

## 📊 Visão Geral

O sistema coleta e armazena métricas do Redis ao longo do tempo, permitindo visualização gráfica e análise temporal de performance. Os dados são mantidos por até 24 horas e automaticamente limpos.

## 🎯 Métricas com Gráficos (12 total)

### **Tier 1 - Métricas Críticas (6)**
1. **Cache Hit Ratio** (`cacheHitRatio`) - Percentual de acertos no cache
2. **Memory Usage** (`memoryUsagePercentage`) - Uso de memória em percentual
3. **Memory Fragmentation** (`memoryFragmentationRatio`) - Razão de fragmentação
4. **CPU Usage** (`cpuPercentage`) - Uso de CPU do processo Redis
5. **Latency P50** (`latencyP50`) - Mediana de latência
6. **Latency P95** (`latencyP95`) - 95º percentil de latência

### **Tier 2 - Métricas de Performance (4)**
7. **Operations/sec** (`opsPerSec`) - Throughput de operações
8. **Connected Clients** (`connectedClients`) - Número de clientes conectados
9. **Eviction Rate** (`evictedPerSec`) - Taxa de eviction por segundo
10. **Expiration Rate** (`expiredPerSec`) - Taxa de expiração por segundo

### **Tier 3 - Métricas de Atividade (2)**
11. **Network Input** (`networkInputKbps`) - Taxa de entrada de rede
12. **Network Output** (`networkOutputKbps`) - Taxa de saída de rede

### **❌ Métricas SEM Gráficos**
- **Uptime** - Não faz sentido temporal (sempre crescente)
- **Replication Role** - Texto, não numérico
- **Total Keys** - Opcional (cresce linearmente)
- **Server Info** - Dados estáticos

## 🏗️ Arquitetura

### **Backend**

#### 1. **Persistência de Dados** (`metrics-storage.ts`)
- Armazena métricas em arquivos JSON no diretório `/app/data/metrics`
- Um arquivo por conexão: `metrics-{connectionId}.json`
- Estrutura:
  ```json
  {
    "cacheHitRatio": [
      { "timestamp": 1234567890, "value": 95.5 },
      ...
    ],
    "memoryUsagePercentage": [...],
    ...
  }
  ```

#### 2. **Coleta Automática** (`metrics.ts`)
- Toda vez que métricas são calculadas, os valores são persistidos
- Método `persistMetrics()` extrai valores relevantes e salva
- Integrado ao fluxo existente de cálculo de métricas

#### 3. **Endpoints de API**
- `GET /api/redis/metrics/history` - Todas as métricas
- `GET /api/redis/metrics/history/[metricName]` - Métrica específica
- Query params:
  - `period`: `1h`, `6h`, `12h`, `24h` (padrão: 24h)

#### 4. **Limpeza Automática** (`metrics-cleanup-job.ts`)
- Job executado a cada 1 hora
- Remove dados com mais de 24 horas
- Limita máximo de 1440 pontos por métrica (1 por minuto)

### **Frontend**

#### 1. **Hook Customizado** (`useMetricHistory.ts`)
- Busca dados históricos de uma métrica
- Gerencia loading e error states
- Suporta refetch manual

#### 2. **Modal de Gráfico** (`MetricChartModal.tsx`)
- Exibe gráfico de linha temporal usando Recharts
- Seletor de período (1h, 6h, 12h, 24h)
- Tooltip com valores detalhados
- Formatação automática de eixos

#### 3. **Cards Clicáveis** (`MetricCard.tsx`)
- Cards com métricas gráficas são clicáveis
- Hover effect e cursor pointer
- Abre modal ao clicar

## 📦 Estrutura de Arquivos

```
src/
├── services/
│   ├── metrics-storage.ts          # Persistência de métricas
│   ├── metrics-cleanup-job.ts      # Job de limpeza
│   └── metrics.ts                  # Cálculo e persistência
├── app/api/redis/metrics/
│   └── history/
│       ├── route.ts                # GET histórico geral
│       └── [metricName]/
│           └── route.ts            # GET métrica específica
├── components/
│   ├── MetricChartModal.tsx        # Modal com gráfico
│   ├── MetricCard.tsx              # Card clicável
│   └── Dashboard.tsx               # Integração
├── hooks/
│   └── useMetricHistory.ts         # Hook para dados
├── types/
│   └── metrics-history.ts          # Types e configs
└── lib/
    └── init-server.ts              # Inicialização do servidor
```

## 💾 Armazenamento

### **Localização**
- Diretório: `/app/data/metrics` (mesmo volume persistente do Docker)
- Arquivo por conexão: `metrics-{connectionId}.json`

### **Limites**
- **Tempo**: Máximo 24 horas de dados
- **Pontos**: Máximo 1440 pontos por métrica (1 por minuto)
- **Limpeza**: Automática a cada 1 hora

### **Tamanho Estimado**
- ~1KB por métrica por hora
- ~12KB por conexão por hora (12 métricas)
- ~288KB por conexão em 24h

## 🔧 Configuração

### **Variáveis de Ambiente**
```env
REDIS_EXPLORER_DATA_DIR=/app/data  # Diretório de dados
```

### **Docker Volume**
```bash
docker run -d \
  -p 3000:3000 \
  -v redis-explorer-data:/app/data \
  ruanbarroso/redis-explorer:latest
```

## 📊 Uso

### **Frontend**
1. Acesse o Dashboard
2. Clique em qualquer card de métrica com gráfico
3. Modal abre com gráfico temporal
4. Selecione período desejado (1h, 6h, 12h, 24h)

### **API**
```bash
# Obter histórico de uma métrica específica
curl http://localhost:3000/api/redis/metrics/history/cacheHitRatio?period=24h

# Obter histórico de todas as métricas
curl http://localhost:3000/api/redis/metrics/history?period=24h
```

## 🎨 Customização

### **Adicionar Nova Métrica**

1. **Adicionar ao tipo** (`metrics-history.ts`):
```typescript
export type ChartableMetricName = 
  | 'existingMetric'
  | 'newMetric'; // Nova métrica

export const CHARTABLE_METRICS = {
  // ...
  newMetric: {
    name: 'newMetric',
    title: 'Nova Métrica',
    unit: 'unit',
    color: '#color',
    chartable: true,
  },
};
```

2. **Persistir valor** (`metrics.ts`):
```typescript
const metricsData = {
  // ...
  newMetric: metrics.path.to.value,
};
```

3. **Adicionar card no Dashboard** (`Dashboard.tsx`):
```tsx
<MetricCard
  title="Nova Métrica"
  value={metrics.path.to.value}
  metricName="newMetric"
  onClick={() => handleMetricClick('newMetric')}
  // ...
/>
```

## 🔍 Troubleshooting

### **Gráficos não aparecem**
- Aguarde alguns minutos para coletar dados
- Verifique se há conexão ativa no Redis
- Verifique logs do servidor

### **Dados não persistem após restart**
- Verifique se o volume Docker está montado
- Confirme que `REDIS_EXPLORER_DATA_DIR` está correto
- Verifique permissões do diretório

### **Performance lenta**
- Reduza período de visualização (use 1h ao invés de 24h)
- Verifique se limpeza automática está rodando
- Monitore tamanho dos arquivos JSON

## 🚀 Melhorias Futuras

- [ ] Agregação de dados (média a cada 5min para períodos longos)
- [ ] Exportar dados históricos (CSV, JSON)
- [ ] Comparação entre múltiplas conexões
- [ ] Alertas baseados em tendências históricas
- [ ] Compressão de dados antigos
- [ ] Suporte a múltiplos databases Redis

## 📚 Referências

- [Recharts Documentation](https://recharts.org/)
- [Redis INFO Command](https://redis.io/commands/info/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
