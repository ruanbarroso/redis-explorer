# 🔧 Custom Separators Guide

O Redis Explorer permite definir separadores personalizados para organizar suas chaves Redis em uma estrutura hierárquica. Aqui está como usar diferentes separadores, incluindo o `::`.

## 🎯 Como Definir o Delimiter `::`

### **Método 1: Interface Gráfica**

1. **Conecte ao Redis** e vá para "Keys Browser"
2. **Ative a Tree View** clicando no ícone de árvore
3. **Localize o Separator Selector** (aparece automaticamente quando há chaves)
4. **Selecione "Double Colon (::)"** no dropdown
5. **A árvore será reconstruída** automaticamente

### **Método 2: Separator Personalizado**

1. **Selecione "Custom"** no dropdown
2. **Digite `::` no campo "Custom Separator"**
3. **A árvore será atualizada** em tempo real

## 📋 Separadores Pré-definidos

| Separador | Nome | Exemplo de Chave |
|-----------|------|------------------|
| `:` | Colon | `user:123:profile` |
| `::` | Double Colon | `user::123::profile` |
| `/` | Slash | `user/123/profile` |
| `.` | Dot | `user.123.profile` |
| `-` | Dash | `user-123-profile` |
| `_` | Underscore | `user_123_profile` |
| `\|` | Pipe | `user\|123\|profile` |

## 🌳 Exemplo com Delimiter `::`

### **Chaves Redis:**
```
app::users::123::profile
app::users::123::settings
app::users::456::profile
app::orders::789::details
app::orders::789::items
cache::products::electronics::123
cache::products::books::456
```

### **Estrutura da Árvore:**
```
📁 app
  📁 users
    📁 123
      🔑 profile
      🔑 settings
    📁 456
      🔑 profile
  📁 orders
    📁 789
      🔑 details
      🔑 items
📁 cache
  📁 products
    📁 electronics
      🔑 123
    📁 books
      🔑 456
```

## ⚙️ Detecção Automática

O Redis Explorer **detecta automaticamente** o separador mais comum nas suas chaves:

1. **Analisa todas as chaves** carregadas
2. **Conta a frequência** de cada separador
3. **Seleciona o mais comum** como padrão
4. **Exibe o resultado** no chip "Detected"

## 🎨 Interface Visual

### **Indicadores:**
- **Chip Azul "Detected"**: Mostra o separador detectado automaticamente
- **Chip Verde "Using"**: Mostra o separador atualmente em uso (se diferente do detectado)
- **Dropdown**: Lista de separadores comuns + opção custom
- **Campo Custom**: Para separadores únicos

### **Estatísticas:**
- **Contador de chaves e pastas**
- **Distribuição por tipo Redis**
- **Separador ativo**
- **Chips coloridos informativos**

## 🚀 Casos de Uso Avançados

### **Namespaces Complexos:**
```
company::department::team::user::data
company::department::team::user::permissions
```

### **Versionamento:**
```
api::v1::users::123
api::v2::users::123
api::v3::users::123
```

### **Ambientes:**
```
prod::cache::users::active
staging::cache::users::active
dev::cache::users::active
```

## 🔄 Mudança Dinâmica

- **Sem reload**: A árvore é reconstruída instantaneamente
- **Estado preservado**: Expansões são mantidas quando possível
- **Performance otimizada**: Apenas recalcula quando necessário

## 💡 Dicas e Boas Práticas

### **Escolha do Separador:**
- **`:`** - Padrão Redis, amplamente usado
- **`::`** - Melhor para namespaces complexos
- **`/`** - Familiar para quem vem de sistemas de arquivos
- **`.`** - Comum em configurações e APIs

### **Consistência:**
- **Use o mesmo separador** em toda a aplicação
- **Documente a convenção** para a equipe
- **Considere migração** se mudando padrões

### **Performance:**
- **Separadores simples** são mais rápidos
- **Evite caracteres especiais** complexos
- **Teste com dados reais** antes de decidir

## 🐛 Troubleshooting

### **Árvore não aparece corretamente:**
- Verifique se o separador está correto
- Confirme se as chaves seguem o padrão
- Teste com separador personalizado

### **Performance lenta:**
- Use filtros para reduzir o número de chaves
- Considere paginação para grandes datasets
- Verifique se o separador não está criando muitos níveis

### **Estrutura inesperada:**
- Confirme o separador detectado
- Verifique se há caracteres especiais nas chaves
- Use o modo "Custom" para forçar um separador específico

## 🔮 Funcionalidades Futuras

- [ ] Salvamento de preferências de separador
- [ ] Múltiplos separadores simultâneos
- [ ] Regex para separadores complexos
- [ ] Importação/exportação de configurações
- [ ] Templates de separadores por projeto
