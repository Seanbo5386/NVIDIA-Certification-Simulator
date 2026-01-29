/**
 * Output Templates Utility
 * 
 * Provides:
 * - Timestamp generation with realistic jitter
 * - Sensor reading variation for realism
 * - Formatted output helpers
 */

/**
 * Timestamp format options
 */
export type TimestampFormat = 'iso' | 'unix' | 'locale' | 'nvidia-smi' | 'ipmi' | 'slurm';

interface TimestampOptions {
    jitterMs?: number;  // Default: 50ms
    format?: TimestampFormat;
    baseTime?: Date;    // If provided, use this as base instead of now
}

/**
 * Generate a timestamp with realistic jitter
 * @param options - Timestamp generation options
 * @returns Formatted timestamp string
 */
export function generateTimestamp(options: TimestampOptions = {}): string {
    const { jitterMs = 50, format = 'locale', baseTime } = options;

    // Add realistic jitter
    const jitter = (Math.random() - 0.5) * jitterMs * 2;
    const timestamp = new Date((baseTime?.getTime() ?? Date.now()) + jitter);

    switch (format) {
        case 'iso':
            return timestamp.toISOString();

        case 'unix':
            return Math.floor(timestamp.getTime() / 1000).toString();

        case 'nvidia-smi': {
            // Format: "Mon Jan 15 10:30:45 2024"
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${days[timestamp.getDay()]} ${months[timestamp.getMonth()]} ` +
                `${timestamp.getDate().toString().padStart(2, ' ')} ` +
                `${timestamp.toTimeString().split(' ')[0]} ${timestamp.getFullYear()}`;
        }

        case 'ipmi':
            // Format: "01/18/2026 | 10:30:45"
            return `${(timestamp.getMonth() + 1).toString().padStart(2, '0')}/` +
                `${timestamp.getDate().toString().padStart(2, '0')}/` +
                `${timestamp.getFullYear()} | ` +
                `${timestamp.toTimeString().split(' ')[0]}`;

        case 'slurm':
            // Format: "2026-01-18T10:30:45"
            return timestamp.toISOString().split('.')[0];

        case 'locale':
        default:
            return timestamp.toLocaleString();
    }
}

/**
 * Generate a sensor reading with realistic jitter
 * @param baseValue - Base value for the reading
 * @param jitterPercent - Percentage of variation (default: 2%)
 * @returns Jittered value
 */
export function generateSensorReading(
    baseValue: number,
    jitterPercent: number = 2
): number {
    const jitter = baseValue * (jitterPercent / 100) * (Math.random() - 0.5) * 2;
    return Math.round((baseValue + jitter) * 100) / 100;
}

/**
 * Generate an integer sensor reading with jitter
 * @param baseValue - Base value
 * @param jitterAmount - Absolute variation amount (default: 1)
 * @returns Jittered integer value
 */
export function generateIntSensorReading(
    baseValue: number,
    jitterAmount: number = 1
): number {
    const jitter = Math.round((Math.random() - 0.5) * 2 * jitterAmount);
    return baseValue + jitter;
}

/**
 * Generate a power reading with realistic characteristics
 * @param basePowerDraw - Actual power draw in watts
 * @param powerLimit - Power limit in watts
 * @returns Object with current, min, max, average readings
 */
export function generatePowerReadings(basePowerDraw: number, powerLimit: number) {
    const current = generateSensorReading(basePowerDraw, 3);
    const min = generateSensorReading(basePowerDraw * 0.92, 2);
    const max = generateSensorReading(Math.min(basePowerDraw * 1.08, powerLimit), 2);
    const average = generateSensorReading(basePowerDraw, 1);

    return {
        current: Math.round(current),
        min: Math.round(min),
        max: Math.round(max),
        average: Math.round(average),
    };
}

/**
 * Generate temperature readings with memory temp offset
 * @param gpuTemp - GPU temperature
 * @param memoryOffset - Memory temperature offset (default: -5)
 * @returns Object with GPU and memory temperatures
 */
export function generateTemperatureReadings(gpuTemp: number, memoryOffset: number = -5) {
    return {
        gpu: generateIntSensorReading(gpuTemp, 1),
        memory: generateIntSensorReading(gpuTemp + memoryOffset, 1),
    };
}

/**
 * Generate a unique identifier with realistic format
 * @param prefix - Prefix for the ID
 * @param length - Length of the random part (default: 12)
 * @returns Formatted unique ID
 */
export function generateUniqueId(prefix: string, length: number = 12): string {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${id}`;
}

/**
 * Format bytes to human readable string
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 GB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format MiB for nvidia-smi style output
 * @param mib - Value in MiB
 * @returns Formatted string (e.g., "81920MiB")
 */
export function formatMiB(mib: number): string {
    return `${Math.round(mib)}MiB`;
}

/**
 * Pad a number to a specific width with spaces on the left
 */
export function padNumber(value: number, width: number): string {
    return value.toString().padStart(width, ' ');
}

/**
 * Generate realistic sampling period string
 * @param seconds - Sampling period in seconds
 * @returns Formatted string (e.g., "00000005")
 */
export function formatSamplingPeriod(seconds: number): string {
    return seconds.toString().padStart(8, '0');
}
