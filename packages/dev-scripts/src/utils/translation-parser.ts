// translation info interface
export interface TranslationInfo {
  namespaces: Map<string, string> // variable name -> namespace
  keys: string[] // full translation key path
}

/**
 * extract translation keys and namespaces from file content
 */
export function extractTranslationsInfo(content: string, filePath: string): TranslationInfo {
  const result: TranslationInfo = {
    namespaces: new Map<string, string>(),
    keys: []
  }

  // match getTranslations({ locale, namespace: 'namespace' }) or getTranslations('namespace')
  const getTranslationsPattern = /getTranslations\(\s*(?:{[^}]*namespace:\s*['"]([^'"]+)['"][^}]*}|['"]([^'"]+)['"])\s*\)/g
  let match: RegExpExecArray | null

  while ((match = getTranslationsPattern.exec(content)) !== null) {
    const namespace = match[1] || match[2]
    if (namespace) {
      // try to find assignment statement, like const t = await getTranslations(...)
      // find the nearest const declaration
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

  // match useTranslations('namespace')
  const useTranslationsPattern = /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = useTranslationsPattern.exec(content)) !== null) {
    const namespace = match[1]

    // try to find assignment statement, like const t = useTranslations(...)
    // find the line containing useTranslations
    const currentLine = content.substring(0, match.index).split('\n').pop() || '';
    const constMatch = /const\s+(\w+)\s*=/.exec(currentLine);
    if (constMatch) {
      result.namespaces.set(constMatch[1], namespace);
    }
  }

  // match t('key') or t("key"), and check if t is associated with known namespaces
  // modify the matching pattern of t function call
  const tPatterns = [
    // normal string key: t('key') or t("key")
    /(\w+)\(\s*['"]([^'"]+)['"]\s*\)/g,
    // template string key: t(`tags.${id}`) or t(`section.${key}`)
    /(\w+)\(\s*`([^`]+)`\s*\)/g,
    // variable key: t(item.key) or t(item.id)
    /(\w+)\(\s*(\w+)\.(\w+)\s*\)/g
  ];

  for (const pattern of tPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const funcName = match[1];

      // if the function name is associated with known namespaces
      if (result.namespaces.has(funcName)) {
        const namespace = result.namespaces.get(funcName);
        if (!namespace) continue;

        if (pattern.source.includes('`')) {
          // handle template string
          const templateStr = match[2];
          // extract static part (the part before the variable)
          const staticPart = templateStr.split(/\${(?:id|key)}/)[0].trim();
          if (staticPart && !staticPart.includes('/')) {
            // for tags.${id}这样的形式，记录整个 tags 命名空间
            const segments = staticPart.split('.');
            if (segments.length > 0) {
              // record the base path
              result.keys.push(`${namespace}.${segments[0]}`);
              // if it is multi-level, also record the full path
              if (segments.length > 1) {
                result.keys.push(`${namespace}.${segments.join('.')}`);
              }

              // special handling for tags namespace
              if (segments[0] === 'tags') {
                // add all known tag keys
                ['productUpdates', 'tutorials', 'makeMoney', 'roadOverSea', 'insights'].forEach(tag => {
                  result.keys.push(`${namespace}.tags.${tag}`);
                });
              }
            }
          }
        } else if (pattern.source.includes('\\w+\\.\\w+')) {
          // handle variable key t(item.key)
          const varName = match[2];
          const propName = match[3];

          // find the possible value of the variable in the file content
          const varPattern = new RegExp(`${varName}\\s*=\\s*{[^}]*key:\\s*['"]([^'"]+)['"]`);
          const varMatch = content.match(varPattern);

          if (varMatch) {
            // if the variable definition is found, add the actual key
            result.keys.push(`${namespace}.${varMatch[1]}`);
          } else {
            // if the specific definition is not found, try to infer from the context
            // check if it is used in an array or object of MenuItem type
            if (content.includes('MenuItem[]') || content.includes('MenuItem}')) {
              // add all possible menu keys
              ['journey'].forEach(menuKey => {
                result.keys.push(`${namespace}.${menuKey}`);
              });
            }
          }
        } else {
          // handle normal string key
          const key = match[2];
          if (!key.includes('/') && key !== '') {
            result.keys.push(`${namespace}.${key}`);
          }
        }
      }
    }
  }

  // match <FormattedMessage id="key" />
  const formattedMessagePattern = /<FormattedMessage[^>]*id=['"]([^'"]+)['"]/g
  while ((match = formattedMessagePattern.exec(content)) !== null) {
    const key = match[1]
    if (!key.includes('/') && key !== '') {
      // for FormattedMessage, we need to guess the namespace
      // usually we can find useTranslations call in the same file
      if (result.namespaces.size > 0) {
        const namespace = Array.from(result.namespaces.values())[0]
        result.keys.push(`${namespace}.${key}`)
      } else {
        // if the namespace is not found, try to infer from the file path
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
 * get all keys from an object (including nested keys)
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
 * check if the key exists in the translation file
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
 * check if the namespace exists in the translation file
 */
export function checkNamespaceExists(namespace: string, translations: Record<string, any>): boolean {
  return translations[namespace] !== undefined
}

/**
 * remove the specified key from the translation object
 */
export function removeKeyFromTranslations(key: string, translations: Record<string, any>): boolean {
  const parts = key.split('.')
  const lastPart = parts.pop()

  if (!lastPart) return false

  let current = translations

  // navigate to the parent object of the last level
  for (const part of parts) {
    if (current[part] === undefined || typeof current[part] !== 'object') {
      return false
    }
    current = current[part]
  }

  // delete the key
  if (current[lastPart] !== undefined) {
    delete current[lastPart]
    return true
  }

  return false
}

/**
 * clean empty objects (recursively)
 */
export function cleanEmptyObjects(obj: Record<string, any>): Record<string, any> {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = cleanEmptyObjects(obj[key])
        // if the object is empty, delete it
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key]
        }
      }
    }
  }
  return obj
} 