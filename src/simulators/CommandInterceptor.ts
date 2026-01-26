/**
 * CommandInterceptor - Fuzzy matching for command flags and subcommands
 * 
 * Provides:
 * - Levenshtein distance calculation for typo detection
 * - Flag suggestion generation for "Did you mean?" errors
 * - Subcommand suggestion for unknown commands
 */

/**
 * Result of fuzzy matching operation
 */
export interface FuzzyMatchResult {
    input: string;
    suggestions: string[];
    confidence: number; // 0-1, higher = better match
    exactMatch: boolean;
}

/**
 * Flag definition for registration
 */
export interface FlagDefinition {
    short?: string;  // Single char, e.g., 'h'
    long: string;    // Full name, e.g., 'help'
    aliases?: string[]; // Additional names
}

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize first column
    for (let i = 0; i <= a.length; i++) {
        matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

/**
 * Find similar strings from a list based on Levenshtein distance
 * @param input - The input string to match
 * @param candidates - List of valid candidates
 * @param maxDistance - Maximum edit distance to consider (default: 3)
 * @returns Sorted array of similar candidates
 */
export function findSimilarStrings(
    input: string,
    candidates: string[],
    maxDistance: number = 3
): string[] {
    // Adjust max distance based on input length
    const adjustedMaxDistance = Math.min(
        maxDistance,
        Math.max(2, Math.floor(input.length / 2))
    );

    return candidates
        .map(candidate => ({
            candidate,
            distance: levenshteinDistance(input.toLowerCase(), candidate.toLowerCase())
        }))
        .filter(({ distance }) => distance <= adjustedMaxDistance && distance > 0)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .map(({ candidate }) => candidate);
}

/**
 * CommandInterceptor class for managing flag registries and fuzzy matching
 */
export class CommandInterceptor {
    /** Map of command name -> array of valid flags */
    private flagRegistry: Map<string, Set<string>> = new Map();

    /** Map of command name -> array of valid subcommands */
    private subcommandRegistry: Map<string, Set<string>> = new Map();

    /**
     * Register valid flags for a command
     * @param command - Command name (e.g., 'nvidia-smi')
     * @param flags - Array of flag definitions
     */
    registerFlags(command: string, flags: FlagDefinition[]): void {
        const flagSet = this.flagRegistry.get(command) || new Set();

        for (const flag of flags) {
            if (flag.short) flagSet.add(flag.short);
            flagSet.add(flag.long);
            if (flag.aliases) {
                flag.aliases.forEach(alias => flagSet.add(alias));
            }
        }

        this.flagRegistry.set(command, flagSet);
    }

    /**
     * Register valid subcommands for a command
     * @param command - Command name
     * @param subcommands - Array of subcommand names
     */
    registerSubcommands(command: string, subcommands: string[]): void {
        const subcommandSet = this.subcommandRegistry.get(command) || new Set();
        subcommands.forEach(sub => subcommandSet.add(sub));
        this.subcommandRegistry.set(command, subcommandSet);
    }

    /**
     * Validate a flag and return suggestions if it's a typo
     * @param command - Command name
     * @param flag - Flag to validate (without leading dashes)
     * @returns FuzzyMatchResult with suggestions
     */
    validateFlag(command: string, flag: string): FuzzyMatchResult {
        const validFlags = this.flagRegistry.get(command);

        if (!validFlags) {
            // Command not registered, can't validate
            return {
                input: flag,
                suggestions: [],
                confidence: 0,
                exactMatch: false,
            };
        }

        const flagArray = Array.from(validFlags);

        // Check for exact match
        if (validFlags.has(flag)) {
            return {
                input: flag,
                suggestions: [],
                confidence: 1.0,
                exactMatch: true,
            };
        }

        // Find similar flags
        const suggestions = findSimilarStrings(flag, flagArray);

        // Calculate confidence based on best match
        let confidence = 0;
        if (suggestions.length > 0) {
            const bestDistance = levenshteinDistance(flag, suggestions[0]);
            confidence = 1 - (bestDistance / Math.max(flag.length, suggestions[0].length));
        }

        return {
            input: flag,
            suggestions,
            confidence,
            exactMatch: false,
        };
    }

    /**
     * Validate a subcommand and return suggestions if it's a typo
     * @param command - Command name
     * @param subcommand - Subcommand to validate
     * @returns FuzzyMatchResult with suggestions
     */
    validateSubcommand(command: string, subcommand: string): FuzzyMatchResult {
        const validSubcommands = this.subcommandRegistry.get(command);

        if (!validSubcommands) {
            return {
                input: subcommand,
                suggestions: [],
                confidence: 0,
                exactMatch: false,
            };
        }

        const subcommandArray = Array.from(validSubcommands);

        // Check for exact match
        if (validSubcommands.has(subcommand)) {
            return {
                input: subcommand,
                suggestions: [],
                confidence: 1.0,
                exactMatch: true,
            };
        }

        // Find similar subcommands
        const suggestions = findSimilarStrings(subcommand, subcommandArray);

        let confidence = 0;
        if (suggestions.length > 0) {
            const bestDistance = levenshteinDistance(subcommand, suggestions[0]);
            confidence = 1 - (bestDistance / Math.max(subcommand.length, suggestions[0].length));
        }

        return {
            input: subcommand,
            suggestions,
            confidence,
            exactMatch: false,
        };
    }

    /**
     * Format a "Did you mean?" error message
     * @param command - Command name
     * @param result - FuzzyMatchResult from validation
     * @param isFlag - Whether this is a flag (true) or subcommand (false)
     * @returns Formatted error string
     */
    formatSuggestion(_command: string, result: FuzzyMatchResult, isFlag: boolean = true): string {
        if (result.exactMatch || result.suggestions.length === 0) {
            return '';
        }

        const prefix = isFlag ? '--' : '';

        if (result.suggestions.length === 1) {
            return `Did you mean '${prefix}${result.suggestions[0]}'?`;
        }

        const formatted = result.suggestions
            .map(s => `'${prefix}${s}'`)
            .join(', ');

        return `Did you mean one of: ${formatted}?`;
    }

    /**
     * Get all registered flags for a command
     */
    getRegisteredFlags(command: string): string[] {
        const flags = this.flagRegistry.get(command);
        return flags ? Array.from(flags) : [];
    }

    /**
     * Get all registered subcommands for a command
     */
    getRegisteredSubcommands(command: string): string[] {
        const subcommands = this.subcommandRegistry.get(command);
        return subcommands ? Array.from(subcommands) : [];
    }
}

// Export singleton instance for global use
export const commandInterceptor = new CommandInterceptor();
