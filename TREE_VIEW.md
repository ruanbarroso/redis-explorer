# 🌳 Tree View Feature

A visualização em árvore do Redis Explorer permite navegar pelas chaves Redis de forma hierárquica, similar ao RedisInsight, organizando as chaves baseadas em separadores comuns.

## ✨ Funcionalidades

### 🔍 **Detecção Automática de Separador**
- Analisa automaticamente as chaves para detectar o separador mais comum
- Suporta separadores: `:`, `/`, `.`, `-`, `_`
- Exibe o separador detectado na interface

### 🌲 **Visualização Hierárquica**
- Organiza chaves em estrutura de pastas e arquivos
- Pastas representam prefixos comuns
- Chaves individuais são mostradas como folhas da árvore

### 🎛️ **Controles Interativos**
- **Toggle List/Tree**: Alterna entre visualização em lista e árvore
- **Expand All**: Expande todos os nós da árvore
- **Collapse All**: Colapsa todos os nós da árvore
- **Click to Expand**: Clique em pastas para expandir/colapsar

### 📊 **Estatísticas Detalhadas**
- Contador de chaves e pastas
- Distribuição por tipo de dados Redis
- Separador detectado
- Informações em chips coloridos

### 🎨 **Ícones Específicos por Tipo**
- **String**: Ícone de texto
- **Hash**: Ícone de módulos
- **List**: Ícone de lista
- **Set**: Ícone de categoria
- **Sorted Set**: Ícone de ordenação
- **Stream**: Ícone de timeline
- **JSON**: Ícone de objeto

### 🔎 **Navegação Inteligente**
- Auto-expansão ao selecionar uma chave
- Destaque visual da chave selecionada
- Preservação do estado de expansão

## 🏗️ **Arquitetura**

### **Componentes Principais**

1. **`TreeView.tsx`**: Componente principal da árvore
2. **`TreeStats.tsx`**: Estatísticas da árvore
3. **`KeyTypeIcon.tsx`**: Ícones específicos por tipo
4. **`useTreeView.ts`**: Hook para gerenciar estado da árvore
5. **`TreeBuilder.ts`**: Utilitário para construir estrutura da árvore

### **Tipos TypeScript**

```typescript
interface TreeNode {
  id: string;
  name: string;
  fullPath: string;
  type: 'folder' | 'key';
  children?: TreeNode[];
  keyData?: RedisKey;
  expanded?: boolean;
  level: number;
}
```

### **Algoritmo de Construção**

1. **Análise de Separadores**: Detecta o separador mais frequente
2. **Divisão de Chaves**: Quebra chaves em partes usando o separador
3. **Construção da Árvore**: Cria estrutura hierárquica
4. **Ordenação**: Pastas primeiro, depois chaves (alfabética)

## 🎯 **Casos de Uso**

### **Chaves com Namespace**
```
user:123:profile
user:123:settings
user:456:profile
```
Resultado: Pasta `user` → Subpastas `123`, `456` → Chaves `profile`, `settings`

### **Chaves de Sessão**
```
session:web:abc123
session:mobile:def456
session:api:ghi789
```
Resultado: Pasta `session` → Subpastas por tipo → Chaves de sessão

### **Cache Hierárquico**
```
cache:products:electronics:123
cache:products:books:456
cache:users:active:789
```
Resultado: Estrutura de 3 níveis com categorização clara

## 🚀 **Performance**

- **Renderização Otimizada**: Apenas nós visíveis são renderizados
- **Estado Eficiente**: Usa Set para nós expandidos
- **Memoização**: Reconstrução da árvore apenas quando necessário
- **Lazy Loading**: Expansão sob demanda

## 🎨 **Customização**

### **Separadores Personalizados**
```typescript
const { treeNodes } = useTreeView(keys, '/'); // Força separador '/'
```

### **Temas e Cores**
- Integração completa com Material-UI
- Suporte a tema dark/light
- Cores específicas por tipo de dados

## 📱 **Responsividade**

- Layout adaptável para diferentes tamanhos de tela
- Controles otimizados para touch
- Scrolling suave em árvores grandes

## 🔧 **Configuração**

A funcionalidade está habilitada por padrão. Para personalizar:

```typescript
// No KeysBrowser.tsx
const {
  viewMode,
  setViewMode,
  expandAll,
  collapseAll,
} = useTreeView(keys, customSeparator);
```

## 🐛 **Troubleshooting**

### **Árvore não aparece**
- Verifique se há chaves com separadores
- Confirme se o separador foi detectado corretamente

### **Performance lenta**
- Use paginação para grandes conjuntos de chaves
- Considere filtros mais específicos

### **Estrutura incorreta**
- Verifique se o separador detectado está correto
- Use separador personalizado se necessário

## 🔮 **Roadmap**

- [ ] Busca em tempo real na árvore
- [ ] Drag & drop para reorganizar
- [ ] Exportação da estrutura
- [ ] Filtros avançados por tipo
- [ ] Visualização de tamanho das pastas
- [ ] Breadcrumbs de navegação
