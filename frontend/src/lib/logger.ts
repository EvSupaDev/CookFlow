type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

class CookFlowLogger {
  private readonly prefix = "[CookFlow]";

  private format(level: LogLevel, scope: string, message: string): string {
    const ts = new Date().toISOString();
    return `${ts} ${this.prefix}[${level}][${scope}] ${message}`;
  }

  debug(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.debug(this.format("DEBUG", scope, message), meta);
    } else {
      console.debug(this.format("DEBUG", scope, message));
    }
  }

  info(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.info(this.format("INFO", scope, message), meta);
    } else {
      console.info(this.format("INFO", scope, message));
    }
  }

  warn(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.warn(this.format("WARN", scope, message), meta);
    } else {
      console.warn(this.format("WARN", scope, message));
    }
  }

  error(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.error(this.format("ERROR", scope, message), meta);
    } else {
      console.error(this.format("ERROR", scope, message));
    }
  }
}

export const logger = new CookFlowLogger();
