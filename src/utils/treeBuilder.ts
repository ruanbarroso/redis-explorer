import { RedisKey } from '@/types/redis';
import { TreeNode } from '@/types/tree';

interface BuildNode extends TreeNode {
  childrenMap?: { [key: string]: BuildNode };
}

export class TreeBuilder {
  private separator: string;

  constructor(separator: string = ':') {
    this.separator = separator;
  }

  buildTree(keys: RedisKey[]): TreeNode[] {
    const root: { [key: string]: BuildNode } = {};
    
    keys.forEach(key => {
      this.addKeyToTree(key, root);
    });

    return this.convertAndSort(Object.values(root));
  }

  private addKeyToTree(key: RedisKey, root: { [key: string]: BuildNode }): void {
    const parts = key.name.split(this.separator);
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}${this.separator}${part}` : part;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          id: currentPath,
          name: part,
          fullPath: currentPath,
          type: isLast ? 'key' : 'folder',
          children: undefined,
          keyData: isLast ? key : undefined,
          expanded: false,
          level: index,
          childrenMap: isLast ? undefined : {},
        };
      }

      if (!isLast) {
        // Ensure it's a folder if we're not at the last part
        if (currentLevel[part].type === 'key') {
          currentLevel[part].type = 'folder';
          currentLevel[part].keyData = undefined;
          currentLevel[part].childrenMap = {};
        }
        
        currentLevel = currentLevel[part].childrenMap!;
      }
    });
  }

  private convertAndSort(nodes: BuildNode[]): TreeNode[] {
    return nodes
      .map(node => ({
        id: node.id,
        name: node.name,
        fullPath: node.fullPath,
        type: node.type,
        children: node.childrenMap 
          ? this.convertAndSort(Object.values(node.childrenMap))
          : undefined,
        keyData: node.keyData,
        expanded: node.expanded,
        level: node.level,
      }))
      .sort((a, b) => {
        // Folders first, then keys
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  static detectSeparator(keys: RedisKey[]): string {
    if (keys.length === 0) return ':';
    
    // Priorizar separadores semânticos primeiro
    const separators = ['::', ':', '/', '.', '-', '_', '|'];
    const separatorScores: { [key: string]: number } = {};
    const separatorWeights: { [key: string]: number } = {
      '::': 10, // Peso muito alto para ::
      ':': 5,   // Peso alto para :
      '/': 3,   // Peso médio para /
      '.': 2,   // Peso baixo para .
      '-': 1,   // Peso muito baixo para -
      '_': 1,   // Peso muito baixo para _
      '|': 2    // Peso baixo para |
    };

    // Para cada separador, calcular um score baseado em:
    // 1. Quantas chaves contêm o separador (consistência)
    // 2. Média de ocorrências por chave (estrutura hierárquica)
    // 3. Peso do separador
    separators.forEach(sep => {
      let keysWithSeparator = 0;
      let totalOccurrences = 0;
      
      keys.forEach(key => {
        let count = 0;
        
        // Para separadores de múltiplos caracteres
        if (sep.length > 1) {
          const matches = key.name.split(sep);
          count = matches.length > 1 ? matches.length - 1 : 0;
        } else {
          // Para separadores simples, não contar se faz parte de separadores maiores
          if (sep === ':' && key.name.includes('::')) {
            // Se tem ::, não contar os : individuais que fazem parte do ::
            const withoutDoubleColon = key.name.replace(/::/g, '');
            count = (withoutDoubleColon.match(/:/g) || []).length;
          } else {
            count = (key.name.match(new RegExp(`\\${sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')) || []).length;
          }
        }
        
        if (count > 0) {
          keysWithSeparator++;
          totalOccurrences += count;
        }
      });
      
      // Score baseado em:
      // - Percentual de chaves que usam o separador (consistência)
      // - Média de ocorrências (estrutura hierárquica, mas limitada para evitar ruído)
      // - Peso do separador
      const consistencyRatio = keysWithSeparator / keys.length;
      const avgOccurrences = keysWithSeparator > 0 ? totalOccurrences / keysWithSeparator : 0;
      
      // Limitar média para evitar que separadores muito frequentes (como - em UUIDs) ganhem
      const cappedAvgOccurrences = Math.min(avgOccurrences, 5);
      
      const score = consistencyRatio * cappedAvgOccurrences * (separatorWeights[sep] || 1);
      separatorScores[sep] = score;
    });
    
    // Se :: tem qualquer ocorrência, priorizá-lo
    if (separatorScores['::'] > 0) {
      return '::';
    }
    
    // Caso contrário, usar o separador com maior score
    const bestSeparator = Object.entries(separatorScores)
      .filter(([, score]) => score > 0)
      .sort(([sepA, scoreA], [sepB, scoreB]) => {
        if (scoreA !== scoreB) return scoreB - scoreA;
        // Em caso de empate, priorizar separadores mais longos
        return sepB.length - sepA.length;
      })[0];
    
    return bestSeparator ? bestSeparator[0] : ':';
  }

  static searchInTree(nodes: TreeNode[], searchTerm: string): Set<string> {
    const matchingNodes = new Set<string>();
    
    const search = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.fullPath.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchingNodes.add(node.id);
          
          // Add all parent nodes to expand path
          const parts = node.fullPath.split(':');
          let currentPath = '';
          parts.slice(0, -1).forEach(part => {
            currentPath = currentPath ? `${currentPath}:${part}` : part;
            matchingNodes.add(currentPath);
          });
        }
        
        if (node.children) {
          search(node.children);
        }
      });
    };
    
    search(nodes);
    return matchingNodes;
  }
}
