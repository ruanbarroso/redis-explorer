import { RedisKey } from '@/types/redis';
import { TreeNode } from '@/types/tree';

export class TreeBuilder {
  private separator: string;

  constructor(separator: string = ':') {
    this.separator = separator;
  }

  buildTree(keys: RedisKey[]): TreeNode[] {
    const root: { [key: string]: TreeNode } = {};
    
    keys.forEach(key => {
      this.addKeyToTree(key, root);
    });

    return this.sortNodes(Object.values(root));
  }

  private addKeyToTree(key: RedisKey, root: { [key: string]: TreeNode }): void {
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
          children: isLast ? undefined : [],
          keyData: isLast ? key : undefined,
          expanded: false,
          level: index,
        };
      }

      if (!isLast) {
        // Ensure it's a folder if we're not at the last part
        if (currentLevel[part].type === 'key') {
          currentLevel[part].type = 'folder';
          currentLevel[part].children = [];
          currentLevel[part].keyData = undefined;
        }
        
        // Create childrenMap for building if it doesn't exist
        if (!(currentLevel[part] as any).childrenMap) {
          (currentLevel[part] as any).childrenMap = {};
        }
        currentLevel = (currentLevel[part] as any).childrenMap;
      }
    });
  }

  private sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .map(node => ({
        ...node,
        children: (node as any).childrenMap 
          ? this.sortNodes(Object.values((node as any).childrenMap))
          : node.children
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
    // Priorizar separadores semânticos primeiro
    const separators = ['::', ':', '/', '.', '-', '_', '|'];
    const separatorCounts: { [key: string]: number } = {};
    const separatorWeights: { [key: string]: number } = {
      '::': 10, // Peso muito alto para ::
      ':': 5,   // Peso alto para :
      '/': 3,   // Peso médio para /
      '.': 2,   // Peso baixo para .
      '-': 1,   // Peso muito baixo para -
      '_': 1,   // Peso muito baixo para _
      '|': 2    // Peso baixo para |
    };

    keys.forEach(key => {
      separators.forEach(sep => {
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
        
        // Aplicar peso ao contar
        const weightedCount = count * (separatorWeights[sep] || 1);
        separatorCounts[sep] = (separatorCounts[sep] || 0) + weightedCount;
      });
    });
    
    // Se :: tem qualquer ocorrência, priorizá-lo
    if (separatorCounts['::'] > 0) {
      return '::';
    }
    
    // Caso contrário, usar o separador com maior pontuação ponderada
    const bestSeparator = Object.entries(separatorCounts)
      .filter(([, count]) => count > 0)
      .sort(([sepA, countA], [sepB, countB]) => {
        if (countA !== countB) return countB - countA;
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
