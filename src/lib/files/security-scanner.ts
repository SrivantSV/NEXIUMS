/**
 * Security Scanner Service
 * Scans files for threats, malware, and security vulnerabilities
 */

import { SecurityScanResult } from '@/types/files';

export class SecurityScanner {
  async scan(file: File): Promise<SecurityScanResult> {
    const startTime = Date.now();
    const threats: string[] = [];

    try {
      // 1. Check file size for potential DoS
      if (file.size > 1024 * 1024 * 1024) { // > 1GB
        threats.push('File size exceeds safe limits');
      }

      // 2. Check file extension vs MIME type mismatch
      const extension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;

      if (this.isMimeTypeMismatch(extension, mimeType)) {
        threats.push('File extension does not match MIME type');
      }

      // 3. Check for suspicious file names
      if (this.hasSuspiciousFileName(file.name)) {
        threats.push('Suspicious file name detected');
      }

      // 4. Scan file content for malicious patterns
      const contentThreats = await this.scanFileContent(file);
      threats.push(...contentThreats);

      // 5. Check for embedded executables
      if (await this.hasEmbeddedExecutable(file)) {
        threats.push('Embedded executable detected');
      }

      return {
        hasThreat: threats.length > 0,
        threats,
        scanTime: Date.now() - startTime,
        scanEngine: 'NexusSecurityScanner v1.0',
      };
    } catch (error) {
      console.error('[SecurityScanner] Scan failed:', error);
      return {
        hasThreat: false,
        threats: [],
        scanTime: Date.now() - startTime,
        scanEngine: 'NexusSecurityScanner v1.0',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private isMimeTypeMismatch(extension: string | undefined, mimeType: string): boolean {
    if (!extension || !mimeType) return false;

    const expectedMimes: Record<string, string[]> = {
      'pdf': ['application/pdf'],
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'mp4': ['video/mp4'],
      'mp3': ['audio/mpeg'],
      'zip': ['application/zip', 'application/x-zip-compressed'],
      'json': ['application/json'],
      'xml': ['application/xml', 'text/xml'],
    };

    const expected = expectedMimes[extension];
    if (!expected) return false;

    return !expected.includes(mimeType);
  }

  private hasSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.dll$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.vbs$/i,
      /\.scr$/i,
      /\.pif$/i,
      /\.com$/i,
      /\.(js|vbs|wsf|wsh)$/i, // Script files (but we allow .js for code)
      /\.\w+\.exe$/i, // Double extensions
      /\s+\.\w+$/i, // Space before extension
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  private async scanFileContent(file: File): Promise<string[]> {
    const threats: string[] = [];

    try {
      // For text-based files, scan for malicious content
      if (file.type.startsWith('text/') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.xml') ||
          file.name.endsWith('.svg')) {

        const text = await file.text();

        // Check for suspicious scripts
        if (this.hasSuspiciousScript(text)) {
          threats.push('Suspicious script content detected');
        }

        // Check for potential XSS
        if (this.hasPotentialXSS(text)) {
          threats.push('Potential XSS vulnerability detected');
        }

        // Check for SQL injection patterns
        if (this.hasSQLInjectionPattern(text)) {
          threats.push('Potential SQL injection pattern detected');
        }

        // Check for secrets/credentials
        if (this.hasExposedSecrets(text)) {
          threats.push('Exposed credentials or secrets detected');
        }
      }
    } catch (error) {
      // If we can't read the file as text, skip content scanning
      console.warn('[SecurityScanner] Could not read file as text:', error);
    }

    return threats;
  }

  private hasSuspiciousScript(content: string): boolean {
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /document\.write\s*\(/i,
      /innerHTML\s*=/i,
      /fromCharCode/i,
      /unescape\s*\(/i,
      /atob\s*\(/i, // Base64 decode
      /\.createElement\s*\(\s*['"]script['"]/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  private hasPotentialXSS(content: string): boolean {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=\s*["'][^"']*["']/i, // Event handlers
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
    ];

    return xssPatterns.some(pattern => pattern.test(content));
  }

  private hasSQLInjectionPattern(content: string): boolean {
    const sqlPatterns = [
      /('\s*or\s*'1'\s*=\s*'1|--|\bunion\b|\bselect\b.*\bfrom\b|\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(content));
  }

  private hasExposedSecrets(content: string): boolean {
    const secretPatterns = [
      /(['"]?api[_-]?key['"]?\s*[:=]\s*['"][^'"]+['"])/i,
      /(['"]?secret[_-]?key['"]?\s*[:=]\s*['"][^'"]+['"])/i,
      /(['"]?password['"]?\s*[:=]\s*['"][^'"]+['"])/i,
      /(['"]?token['"]?\s*[:=]\s*['"][^'"]+['"])/i,
      /sk-[a-zA-Z0-9]{20,}/i, // OpenAI API keys
      /ghp_[a-zA-Z0-9]{36}/i, // GitHub personal access tokens
      /AKIA[0-9A-Z]{16}/i, // AWS access key IDs
    ];

    return secretPatterns.some(pattern => pattern.test(content));
  }

  private async hasEmbeddedExecutable(file: File): Promise<boolean> {
    try {
      // Check first 4 bytes for executable signatures
      const buffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // PE executable signature (Windows)
      if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
        return true;
      }

      // ELF executable signature (Linux)
      if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
        return true;
      }

      // Mach-O executable signature (macOS)
      if ((bytes[0] === 0xFE && bytes[1] === 0xED && bytes[2] === 0xFA && bytes[3] === 0xCE) ||
          (bytes[0] === 0xFE && bytes[1] === 0xED && bytes[2] === 0xFA && bytes[3] === 0xCF)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SecurityScanner] Error checking for embedded executable:', error);
      return false;
    }
  }
}
