# 📸 Screenshots Guide

## Como Adicionar os Screenshots ao Projeto

### Passo 1: Salvar as Imagens

Você já tem os 6 screenshots necessários. Agora precisa salvá-los no diretório correto com os nomes exatos:

1. **Screenshot 1 (Login)** → Salvar como: `docs/screenshots/login.png`
2. **Screenshot 2 (Conexões)** → Salvar como: `docs/screenshots/connections.png`
3. **Screenshot 3 (Dashboard)** → Salvar como: `docs/screenshots/dashboard.png`
4. **Screenshot 4 (Alertas)** → Salvar como: `docs/screenshots/alerts.png`
5. **Screenshot 5 (Keys Browser)** → Salvar como: `docs/screenshots/keys-browser.png`
6. **Screenshot 6 (CLI)** → Salvar como: `docs/screenshots/cli.png`

### Passo 2: Comandos para Adicionar

```bash
# Navegue até o diretório do projeto
cd /Users/ruanbarroso/Projects/redis-explorer

# Adicione os screenshots ao git
git add docs/screenshots/*.png

# Commit
git commit -m "docs: adiciona screenshots da aplicação"

# Push
git push origin main
```

### Passo 3: Verificar no GitHub

Após o push, os screenshots aparecerão automaticamente no README.md porque já configuramos os links:

- `https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/login.png`
- `https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/connections.png`
- `https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/dashboard.png`
- `https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/alerts.png`
- `https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/keys-browser.png`
- `https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/cli.png`

## Especificações das Imagens

### Requisitos Técnicos
- **Formato**: PNG (recomendado) ou JPG
- **Resolução mínima**: 1280x720
- **Resolução recomendada**: 1920x1080
- **Qualidade**: Alta (texto legível)
- **Tema**: Dark (como nos screenshots atuais)

### Dicas para Screenshots de Qualidade

1. **Limpe dados sensíveis**: Remova informações confidenciais
2. **Use dados de exemplo**: Popule com dados demonstrativos
3. **Maximize a janela**: Capture em tela cheia para melhor visualização
4. **Foco no conteúdo**: Centralize as funcionalidades principais
5. **Consistência**: Use o mesmo tema em todos os screenshots

## Checklist

- [ ] `login.png` - Tela de autenticação
- [ ] `connections.png` - Gerenciamento de conexões
- [ ] `dashboard.png` - Dashboard com métricas
- [ ] `alerts.png` - Sistema de alertas
- [ ] `keys-browser.png` - Navegador de chaves com editor
- [ ] `cli.png` - Terminal CLI do Redis

## Resultado Final

Após adicionar os screenshots, o README.md ficará assim:

```markdown
## 📸 Screenshots

### 🔐 Authentication
![Login Screen](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/login.png)
*Secure authentication with password protection*

### 🔌 Connection Management
![Connection Manager](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/connections.png)
*Manage multiple Redis connections with import/export functionality*

... e assim por diante
```

## Alternativa: Screenshots Temporários

Se preferir, pode usar placeholders temporários até ter screenshots melhores:

```bash
# Criar placeholders (opcional)
cd docs/screenshots
convert -size 1920x1080 xc:gray -pointsize 72 -draw "text 500,540 'Login Screen'" login.png
# Repita para cada screenshot
```

---

**Nota**: Os screenshots que você me enviou estão perfeitos! Basta salvá-los com os nomes corretos e fazer o commit.
