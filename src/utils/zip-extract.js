/**
 * Lightweight ZIP extraction using Node.js built-in zlib
 * Handles standard ZIP files (deflate + stored methods)
 * No external dependencies needed
 */
import { inflateRawSync } from 'zlib';

/**
 * Extract files from a ZIP buffer
 * @param {Buffer} zipBuffer - Raw ZIP file bytes
 * @param {string[]} allowedExts - Array of allowed extensions (e.g. ['.vx', '.json'])
 * @returns {Array<{path: string, content: string}>}
 */
export function extractZip(zipBuffer, allowedExts = []) {
  const files = [];
  let offset = 0;

  while (offset < zipBuffer.length - 4) {
    // Look for local file header signature (PK\x03\x04)
    if (zipBuffer.readUInt32LE(offset) !== 0x04034b50) break;

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const uncompressedSize = zipBuffer.readUInt32LE(offset + 22);
    const fileNameLen = zipBuffer.readUInt16LE(offset + 26);
    const extraLen = zipBuffer.readUInt16LE(offset + 28);

    const fileNameBuf = zipBuffer.subarray(offset + 30, offset + 30 + fileNameLen);
    const fileName = fileNameBuf.toString('utf-8');

    const dataStart = offset + 30 + fileNameLen + extraLen;
    const dataEnd = dataStart + compressedSize;

    // Skip directories and __MACOSX artifacts
    const isDir = fileName.endsWith('/');
    const isMacJunk = fileName.startsWith('__MACOSX/') || fileName.includes('/.DS_Store');

    if (!isDir && !isMacJunk) {
      // Check extension filter
      const ext = '.' + fileName.split('.').pop().toLowerCase();
      const passFilter = allowedExts.length === 0 || allowedExts.includes(ext);

      if (passFilter) {
        try {
          let content;
          const compressedData = zipBuffer.subarray(dataStart, dataEnd);

          if (compressionMethod === 0) {
            // Stored (no compression)
            content = compressedData.toString('utf-8');
          } else if (compressionMethod === 8) {
            // Deflate
            const inflated = inflateRawSync(compressedData);
            content = inflated.toString('utf-8');
          } else {
            // Unsupported compression method — skip
            offset = dataEnd;
            continue;
          }

          // Normalize path: strip leading folder if it looks like a root wrapper
          let filePath = fileName.replace(/\\/g, '/');
          // Remove common root folder wrapper (e.g. "MyProject/Apps/Main.vx" → "Apps/Main.vx")
          const parts = filePath.split('/');
          if (parts.length > 2) {
            // Check if first part is a project root (not a VL standard directory)
            const vlDirs = ['Apps', 'Sections', 'ExtComponents', 'Services', 'Database', 'Theme', 'Process'];
            if (!vlDirs.includes(parts[0]) && vlDirs.includes(parts[1])) {
              filePath = parts.slice(1).join('/');
            }
          }

          files.push({ path: filePath, content });
        } catch {
          // Skip files that fail to decompress
        }
      }
    }

    offset = dataEnd;
  }

  return files;
}
