import { COMMAND_METADATA, type CommandMetadata } from './commandMetadata';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy command matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Find similar commands based on typo/fuzzy matching
 */
export function findSimilarCommands(input: string, threshold: number = 0.6): string[] {
  const commandNames = Object.keys(COMMAND_METADATA);
  const suggestions: Array<{ command: string; similarity: number }> = [];

  for (const commandName of commandNames) {
    const similarity = similarityRatio(input, commandName);
    if (similarity >= threshold && similarity < 1) {
      suggestions.push({ command: commandName, similarity });
    }

    // Also check aliases
    const metadata = COMMAND_METADATA[commandName];
    if (metadata.aliases) {
      for (const alias of metadata.aliases) {
        const aliasSimilarity = similarityRatio(input, alias);
        if (aliasSimilarity >= threshold && aliasSimilarity < 1) {
          suggestions.push({ command: commandName, similarity: aliasSimilarity });
        }
      }
    }
  }

  // Sort by similarity (highest first) and return unique commands
  return [...new Set(
    suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(s => s.command)
  )];
}

/**
 * Get "Did you mean?" message for unknown commands
 */
export function getDidYouMeanMessage(input: string): string | null {
  const suggestions = findSimilarCommands(input);

  if (suggestions.length === 0) {
    return null;
  }

  if (suggestions.length === 1) {
    return `\x1b[33mCommand not found.\x1b[0m Did you mean \x1b[1;36m${suggestions[0]}\x1b[0m?`;
  }

  return `\x1b[33mCommand not found.\x1b[0m Did you mean one of these?\n${suggestions.map(cmd => `  \x1b[1;36m${cmd}\x1b[0m`).join('\n')}`;
}

/**
 * Get context-aware command suggestions based on current scenario step
 */
export function getContextualSuggestions(stepObjectives: string[]): CommandMetadata[] {
  const suggestions: CommandMetadata[] = [];
  const keywords = stepObjectives.join(' ').toLowerCase();

  // Match commands based on objectives
  for (const cmd of Object.values(COMMAND_METADATA)) {
    const relevanceScore = calculateRelevance(cmd, keywords);
    if (relevanceScore > 0) {
      suggestions.push(cmd);
    }
  }

  return suggestions
    .sort((a, b) => {
      const scoreA = calculateRelevance(a, keywords);
      const scoreB = calculateRelevance(b, keywords);
      return scoreB - scoreA;
    })
    .slice(0, 5);
}

/**
 * Calculate how relevant a command is to given keywords
 */
function calculateRelevance(cmd: CommandMetadata, keywords: string): number {
  let score = 0;

  // Check if command name appears
  if (keywords.includes(cmd.name.toLowerCase())) {
    score += 10;
  }

  // Check description
  const description = (cmd.shortDescription + ' ' + cmd.longDescription).toLowerCase();
  const keywordList = keywords.split(/\s+/);

  for (const keyword of keywordList) {
    if (keyword.length < 3) continue; // Skip short words
    if (description.includes(keyword)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Format command help for terminal output
 */
export function formatCommandHelp(metadata: CommandMetadata): string {
  const lines: string[] = [];

  // Header
  lines.push(`\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m`);
  lines.push(`\x1b[1;36m║  ${metadata.name.toUpperCase().padEnd(60)}║\x1b[0m`);
  lines.push(`\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m`);
  lines.push(`\x1b[1;36m║\x1b[0m  \x1b[1mCategory:\x1b[0m ${metadata.category.padEnd(49)}║`);
  lines.push(`\x1b[1;36m║\x1b[0m  \x1b[1mDifficulty:\x1b[0m ${metadata.difficulty.padEnd(47)}║`);
  lines.push(`\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m`);
  lines.push('');

  // Description
  lines.push(`\x1b[1mDESCRIPTION:\x1b[0m`);
  lines.push(wrapText(metadata.longDescription, 64).join('\n'));
  lines.push('');

  // Syntax
  lines.push(`\x1b[1mSYNTAX:\x1b[0m`);
  lines.push(`  \x1b[36m${metadata.syntax}\x1b[0m`);
  lines.push('');

  // Common Flags
  if (metadata.commonFlags && metadata.commonFlags.length > 0) {
    lines.push(`\x1b[1mCOMMON FLAGS:\x1b[0m`);
    for (const flag of metadata.commonFlags) {
      lines.push(`  \x1b[33m${flag.flag.padEnd(25)}\x1b[0m ${flag.description}`);
      if (flag.example) {
        lines.push(`    \x1b[90mExample: ${flag.example}\x1b[0m`);
      }
    }
    lines.push('');
  }

  // Examples
  lines.push(`\x1b[1mEXAMPLES:\x1b[0m`);
  for (let i = 0; i < metadata.examples.length; i++) {
    const example = metadata.examples[i];
    lines.push(`  \x1b[1;32m${i + 1}.\x1b[0m \x1b[36m${example.command}\x1b[0m`);
    lines.push(`     ${example.description}`);
    if (i < metadata.examples.length - 1) {
      lines.push('');
    }
  }
  lines.push('');

  // When to Use
  lines.push(`\x1b[1mWHEN TO USE:\x1b[0m`);
  lines.push(wrapText(metadata.whenToUse, 64).join('\n'));
  lines.push('');

  // Related Commands
  if (metadata.relatedCommands && metadata.relatedCommands.length > 0) {
    lines.push(`\x1b[1mRELATED COMMANDS:\x1b[0m`);
    lines.push(`  ${metadata.relatedCommands.map(cmd => `\x1b[36m${cmd}\x1b[0m`).join(', ')}`);
    lines.push('');
  }

  // Common Mistakes
  if (metadata.commonMistakes && metadata.commonMistakes.length > 0) {
    lines.push(`\x1b[1m⚠️  COMMON MISTAKES:\x1b[0m`);
    for (const mistake of metadata.commonMistakes) {
      lines.push(`  • ${mistake}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Wrap text to specified width
 */
function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Format a brief command list for help overview
 */
export function formatCommandList(): string {
  const categories = new Map<string, CommandMetadata[]>();

  // Group commands by category
  for (const cmd of Object.values(COMMAND_METADATA)) {
    if (!categories.has(cmd.category)) {
      categories.set(cmd.category, []);
    }
    categories.get(cmd.category)!.push(cmd);
  }

  const lines: string[] = [];
  lines.push('\x1b[1;32m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
  lines.push('\x1b[1;32m║  COMMAND REFERENCE                                             ║\x1b[0m');
  lines.push('\x1b[1;32m╚════════════════════════════════════════════════════════════════╝\x1b[0m');
  lines.push('');
  lines.push('\x1b[33mType \x1b[1;36mexplain <command>\x1b[0m\x1b[33m for detailed help on any command.\x1b[0m');
  lines.push('');

  // Print each category
  for (const [category, commands] of categories) {
    const categoryName = category.replace(/-/g, ' ').toUpperCase();
    lines.push(`\x1b[1m${categoryName}:\x1b[0m`);

    for (const cmd of commands) {
      lines.push(`  \x1b[36m${cmd.name.padEnd(20)}\x1b[0m ${cmd.shortDescription}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
