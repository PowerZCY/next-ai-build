// 翻译信息接口
export interface TranslationInfo {
  namespaces: Map<string, string> // 变量名 -> 命名空间
  keys: string[] // 完整的翻译键路径
}

/**
 * 从文件内容中提取翻译键和命名空间
 */
export function extractTranslationsInfo(content: string, filePath: string): TranslationInfo {
  const result: TranslationInfo = {
    namespaces: new Map<string, string>(),
    keys: []
  }

  // 匹配 getTranslations({ locale, namespace: 'namespace' }) 或 getTranslations('namespace')
  const getTranslationsPattern = /getTranslations\(\s*(?:{[^}]*namespace:\s*['"]([^'"]+)['"][^}]*}|['"]([^'"]+)['"])\s*\)/g
  let match: RegExpExecArray | null

  while ((match = getTranslationsPattern.exec(content)) !== null) {
    const namespace = match[1] || match[2]
    if (namespace) {
      // 尝试找到赋值语句，如 const t = await getTranslations(...)
      // 查找前面最近的 const 声明
      const linesBefore = content.substring(0, match.index).split('\n');
      for (let i = linesBefore.length - 1; i >= Math.max(0, linesBefore.length - 5); i--) {
        const line = linesBefore[i];
        const constMatch = /const\s+(\w+)\s*=/.exec(line);
        if (constMatch && !line.includes('useTranslations') && !line.includes('getTranslations')) {
          result.namespaces.set(constMatch[1], namespace);
          break;
        }
      }
    }
  }

  // 匹配 useTranslations('namespace')
  const useTranslationsPattern = /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = useTranslationsPattern.exec(content)) !== null) {
    const namespace = match[1]

    // 尝试找到赋值语句，如 const t = useTranslations(...)
    // 查找包含 useTranslations 的行
    const currentLine = content.substring(0, match.index).split('\n').pop() || '';
    const constMatch = /const\s+(\w+)\s*=/.exec(currentLine);
    if (constMatch) {
      result.namespaces.set(constMatch[1], namespace);
    }
  }

  // 匹配 t('key') 或 t("key")，并检查 t 是否与已知命名空间关联
  // 修改 t 函数调用的匹配模式
  const tPatterns = [
    // 普通字符串键: t('key') 或 t("key")
    /(\w+)\(\s*['"]([^'"]+)['"]\s*\)/g,
    // 模板字符串键: t(`tags.${id}`) 或 t(`section.${key}`)
    /(\w+)\(\s*`([^`]+)`\s*\)/g,
    // 变量形式的键: t(item.key) 或 t(item.id)
    /(\w+)\(\s*(\w+)\.(\w+)\s*\)/g
  ];

  for (const pattern of tPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const funcName = match[1];

      // 如果函数名与已知命名空间变量关联
      if (result.namespaces.has(funcName)) {
        const namespace = result.namespaces.get(funcName);
        if (!namespace) continue;

        if (pattern.source.includes('`')) {
          // 处理模板字符串
          const templateStr = match[2];
          // 提取静态部分（变量前面的部分）
          const staticPart = templateStr.split(/\${(?:id|key)}/)[0].trim();
          if (staticPart && !staticPart.includes('/')) {
            // 对于 tags.${id} 这样的形式，记录整个 tags 命名空间
            const segments = staticPart.split('.');
            if (segments.length > 0) {
              // 记录基础路径
              result.keys.push(`${namespace}.${segments[0]}`);
              // 如果是多层级的，也记录完整路径
              if (segments.length > 1) {
                result.keys.push(`${namespace}.${segments.join('.')}`);
              }

              // 特殊处理 tags 命名空间
              if (segments[0] === 'tags') {
                // 添加所有已知的 tag 键
                ['productUpdates', 'tutorials', 'makeMoney', 'roadOverSea', 'insights'].forEach(tag => {
                  result.keys.push(`${namespace}.tags.${tag}`);
                });
              }
            }
          }
        } else if (pattern.source.includes('\\w+\\.\\w+')) {
          // 处理变量形式键 t(item.key)
          const varName = match[2];
          const propName = match[3];

          // 从文件内容中查找该变量的可能值
          const varPattern = new RegExp(`${varName}\\s*=\\s*{[^}]*key:\\s*['"]([^'"]+)['"]`);
          const varMatch = content.match(varPattern);

          if (varMatch) {
            // 如果找到了变量定义，添加实际的键
            result.keys.push(`${namespace}.${varMatch[1]}`);
          } else {
            // 如果没找到具体定义，尝试从上下文推断
            // 检查是否在 MenuItem 类型的数组或对象中使用
            if (content.includes('MenuItem[]') || content.includes('MenuItem}')) {
              // 添加所有可能的菜单键
              ['journey'].forEach(menuKey => {
                result.keys.push(`${namespace}.${menuKey}`);
              });
            }
          }
        } else {
          // 处理普通字符串键
          const key = match[2];
          if (!key.includes('/') && key !== '') {
            result.keys.push(`${namespace}.${key}`);
          }
        }
      }
    }
  }

  // 匹配 <FormattedMessage id="key" />
  const formattedMessagePattern = /<FormattedMessage[^>]*id=['"]([^'"]+)['"]/g
  while ((match = formattedMessagePattern.exec(content)) !== null) {
    const key = match[1]
    if (!key.includes('/') && key !== '') {
      // 对于 FormattedMessage，我们需要猜测命名空间
      // 通常会在同一文件中找到 useTranslations 调用
      if (result.namespaces.size > 0) {
        const namespace = Array.from(result.namespaces.values())[0]
        result.keys.push(`${namespace}.${key}`)
      } else {
        // 如果找不到命名空间，尝试从文件路径推断
        const pathMatch = filePath.match(/\[locale\]\/(?:\([^)]+\)\/)?([^/]+)/)
        if (pathMatch && pathMatch[1]) {
          const possibleNamespace = pathMatch[1]
          result.keys.push(`${possibleNamespace}.${key}`)
        }
      }
    }
  }

  return result
}

/**
 * 从对象中获取所有键（包括嵌套键）
 */
export function getAllKeys(obj: Record<string, any>, prefix: string = ''): string[] {
  let keys: string[] = []
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = [...keys, ...getAllKeys(obj[key], newKey)]
      } else {
        keys.push(newKey)
      }
    }
  }
  return keys
}

/**
 * 检查键是否存在于翻译文件中
 */
export function checkKeyExists(key: string, translations: Record<string, any>): boolean {
  const parts = key.split('.')
  let current: any = translations

  for (const part of parts) {
    if (current[part] === undefined) {
      return false
    }
    current = current[part]
  }

  return true
}

/**
 * 检查命名空间是否存在于翻译文件中
 */
export function checkNamespaceExists(namespace: string, translations: Record<string, any>): boolean {
  return translations[namespace] !== undefined
}

/**
 * 从翻译对象中删除指定键
 */
export function removeKeyFromTranslations(key: string, translations: Record<string, any>): boolean {
  const parts = key.split('.')
  const lastPart = parts.pop()

  if (!lastPart) return false

  let current = translations

  // 导航到最后一级的父对象
  for (const part of parts) {
    if (current[part] === undefined || typeof current[part] !== 'object') {
      return false
    }
    current = current[part]
  }

  // 删除键
  if (current[lastPart] !== undefined) {
    delete current[lastPart]
    return true
  }

  return false
}

/**
 * 清理空对象（递归）
 */
export function cleanEmptyObjects(obj: Record<string, any>): Record<string, any> {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = cleanEmptyObjects(obj[key])
        // 如果对象为空，删除它
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key]
        }
      }
    }
  }
  return obj
} 