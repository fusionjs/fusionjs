import { type TranslationsObjectType } from './types'

export function matchesLiteralSections(literalSections: Array<string>) {
  return (translation: string) => {
    let lastMatchIndex = 0;

    if (literalSections.length === 1) {
      const literal = literalSections[0];
      return literal !== '' && translation === literal;
    }

    return literalSections.every((literal, literalIndex) => {
      if (literal === '') {
        // literal section either:
        // - starts/ends the literal
        // - is the result of two adjacent interpolations
        return true;
      } else if (literalIndex === 0 && translation.startsWith(literal)) {
        lastMatchIndex += literal.length;
        return true;
      } else if (
        literalIndex === literalSections.length - 1 &&
        translation.endsWith(literal)
      ) {
        return true;
      } else {
        // start search from `lastMatchIndex`
        const matchIndex = translation.indexOf(literal, lastMatchIndex);
        if (matchIndex !== -1) {
          lastMatchIndex = matchIndex + literal.length;
          return true;
        }
      }
      // matching failed
      return false;
    });
  };
}

export function translateKeys(sources: any, locale: any, keys: TranslationsObjectType[]): TranslationsObjectType[] {
  const translations = {}
  let possibleTranslations;
  keys.forEach(key => {
    if (Array.isArray(key)) {
      const filter = matchesLiteralSections(key);
      if (!possibleTranslations) {
        possibleTranslations = sources
        ? Object.keys(sources)
        : [];
      }

      const matches = possibleTranslations.filter(filter);
      for (const match of matches) {
        translations[match] = translateKey(sources, locale, match);
      }
    } else {
      translations[key] = translateKey(sources, locale, key);
    }
  });
  return translations;
}

// Default i18n format
export function translateKey(sources: any, locale: any, key: string): string {
  const localeKey = sources[key];
  if (typeof localeKey === "string") {
    return localeKey
  }
  return;
}
