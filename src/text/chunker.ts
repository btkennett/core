// Intelligent text chunking for vector embeddings
// Optimized for RAG (Retrieval Augmented Generation)
// Table-aware: markdown tables are never split mid-row

export interface TextChunk {
  text: string;
  index: number;
  tokens: number;
  metadata: {
    start: number;
    end: number;
    overlap?: boolean;
    containsTable?: boolean;
    tableColumnHeaders?: string;
  };
}

export interface ChunkerOptions {
  maxTokens?: number; // Maximum tokens per chunk (default: 800)
  minTokens?: number; // Minimum tokens per chunk (default: 300)
  overlap?: number; // Overlap between chunks in tokens (default: 100)
  splitOn?: string[]; // Preferred split boundaries (default: ['\n\n', '\n', '. ', ' '])
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 * For production, use tiktoken or similar for accurate token counting
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// --- Table detection utilities ---

interface DetectedTable {
  start: number;
  end: number;
  text: string;
  columnHeaders: string;
}

/**
 * Detect markdown tables in text.
 * A markdown table is a contiguous block of lines where each line starts with |.
 */
function detectTables(text: string): DetectedTable[] {
  const tables: DetectedTable[] = [];
  const lines = text.split("\n");
  let tableStart = -1;
  let tableLines: string[] = [];
  let charPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableLine = trimmed.startsWith("|") && trimmed.endsWith("|");

    if (isTableLine) {
      if (tableStart === -1) {
        tableStart = charPos;
      }
      tableLines.push(line);
    } else {
      if (tableLines.length >= 2) {
        // We had a table — finalize it
        const tableText = tableLines.join("\n");
        const headers = extractColumnHeaders(tableLines);
        tables.push({
          start: tableStart,
          end: tableStart + tableText.length,
          text: tableText,
          columnHeaders: headers,
        });
      }
      tableStart = -1;
      tableLines = [];
    }

    charPos += line.length + 1; // +1 for \n
  }

  // Handle table at end of text
  if (tableLines.length >= 2) {
    const tableText = tableLines.join("\n");
    const headers = extractColumnHeaders(tableLines);
    tables.push({
      start: tableStart,
      end: tableStart + tableText.length,
      text: tableText,
      columnHeaders: headers,
    });
  }

  return tables;
}

/**
 * Extract column headers from a markdown table's first row.
 * Skips the separator row (|---|---|).
 */
function extractColumnHeaders(tableLines: string[]): string {
  if (tableLines.length === 0) return "";
  const headerLine = tableLines[0];
  return headerLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0 && !/^[-:]+$/.test(cell))
    .join(", ");
}

/**
 * Find the nearest markdown header above a given position in text.
 */
function findNearestHeader(text: string, position: number): string | null {
  const before = text.substring(0, position);
  const headerMatches = [...before.matchAll(/^(#+\s+.+)$/gm)];
  if (headerMatches.length === 0) return null;
  return headerMatches[headerMatches.length - 1][1];
}

// --- Core chunking ---

/**
 * Split text into chunks optimized for vector embeddings
 */
export function chunkText(
  text: string,
  options: ChunkerOptions = {}
): TextChunk[] {
  const {
    maxTokens = 800,
    minTokens = 300,
    overlap = 100,
    splitOn = ["\n\n", "\n", ". ", " "],
  } = options;

  // Clean and normalize text
  const cleanText = text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
    .trim();

  if (!cleanText) {
    return [];
  }

  const totalTokens = estimateTokens(cleanText);

  // If text is smaller than max, return as single chunk
  if (totalTokens <= maxTokens) {
    return [
      {
        text: cleanText,
        index: 0,
        tokens: totalTokens,
        metadata: {
          start: 0,
          end: cleanText.length,
        },
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let position = 0;
  let chunkIndex = 0;

  while (position < cleanText.length) {
    // Calculate target chunk size in characters
    const targetChars = maxTokens * 4;
    let endPosition = Math.min(position + targetChars, cleanText.length);

    // If this is not the last chunk, try to find a good split point
    if (endPosition < cleanText.length) {
      let bestSplitPosition = -1;

      // Try split boundaries in order of preference
      for (const boundary of splitOn) {
        // Look for boundary within reasonable range of target
        const searchStart = Math.max(position + minTokens * 4, endPosition - 200);
        const searchEnd = Math.min(endPosition + 100, cleanText.length);
        const searchText = cleanText.substring(searchStart, searchEnd);
        const boundaryIndex = searchText.lastIndexOf(boundary);

        if (boundaryIndex !== -1) {
          bestSplitPosition = searchStart + boundaryIndex + boundary.length;
          break;
        }
      }

      // Use best split position if found
      if (bestSplitPosition > position) {
        endPosition = bestSplitPosition;
      }
    }

    // Extract chunk
    const chunkStr = cleanText.substring(position, endPosition).trim();
    const chunkTokens = estimateTokens(chunkStr);

    if (chunkStr && (chunkTokens >= minTokens || endPosition >= cleanText.length)) {
      chunks.push({
        text: chunkStr,
        index: chunkIndex,
        tokens: chunkTokens,
        metadata: {
          start: position,
          end: endPosition,
          overlap: chunkIndex > 0,
        },
      });
      chunkIndex++;
    }

    // If we've reached the end of the document, stop
    if (endPosition >= cleanText.length) {
      break;
    }

    // Move position forward, accounting for overlap
    const overlapChars = overlap * 4;
    position = Math.max(
      endPosition - overlapChars,
      position + 1 // Ensure we always make progress
    );
  }

  return chunks;
}

// --- Table-aware chunking ---

/**
 * Table-aware chunking: detects markdown tables in text and ensures
 * they are never split across chunks. Tables are treated as atomic units.
 *
 * Strategy:
 * 1. Detect all markdown tables in the text
 * 2. Replace each table with a short placeholder
 * 3. Run normal chunking on the placeholder text
 * 4. Restore tables in place of placeholders
 * 5. If a restored chunk exceeds maxTokens, give the table its own chunk
 */
export function tableAwareChunk(
  text: string,
  options: ChunkerOptions = {}
): TextChunk[] {
  const maxTokens = options.maxTokens ?? 800;

  // Clean and normalize text
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanText) return [];

  const tables = detectTables(cleanText);

  // No tables found — fall back to smartChunk
  if (tables.length === 0) {
    return smartChunk(cleanText, options);
  }

  // Replace tables with placeholders (working backwards to preserve positions)
  let workingText = cleanText;
  const placeholderMap: Map<string, DetectedTable> = new Map();

  for (let i = tables.length - 1; i >= 0; i--) {
    const table = tables[i];
    const placeholder = `\n\n__TABLE_${i}__\n\n`;
    placeholderMap.set(`__TABLE_${i}__`, table);
    workingText =
      workingText.substring(0, table.start) +
      placeholder +
      workingText.substring(table.end);
  }

  // Chunk the placeholder text (tables can't be split since they're single tokens)
  const rawChunks = smartChunk(workingText, options);

  // Restore tables and build final chunks
  const finalChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const chunk of rawChunks) {
    // Check if this chunk contains any table placeholders
    const placeholderPattern = /__TABLE_(\d+)__/g;
    const matches = [...chunk.text.matchAll(placeholderPattern)];

    if (matches.length === 0) {
      // No tables — pass through as-is
      finalChunks.push({
        ...chunk,
        index: globalIndex++,
      });
      continue;
    }

    // Restore table text in place of placeholders
    let restoredText = chunk.text;
    let containsTable = false;
    const allHeaders: string[] = [];

    for (const match of matches) {
      const key = match[0];
      const table = placeholderMap.get(key);
      if (table) {
        restoredText = restoredText.replace(key, table.text);
        containsTable = true;
        if (table.columnHeaders) allHeaders.push(table.columnHeaders);
      }
    }

    const restoredTokens = estimateTokens(restoredText);

    if (restoredTokens <= maxTokens * 1.5) {
      // Table fits within reasonable chunk size — keep it together
      finalChunks.push({
        text: restoredText.trim(),
        index: globalIndex++,
        tokens: restoredTokens,
        metadata: {
          start: chunk.metadata.start,
          end: chunk.metadata.end,
          overlap: chunk.metadata.overlap,
          containsTable,
          tableColumnHeaders: allHeaders.join("; "),
        },
      });
    } else {
      // Table is too large — split non-table text and table into separate chunks
      // First: emit any text before the first table placeholder
      const parts = restoredText.split(/(__TABLE_\d+__)/);
      let partText = "";

      for (const part of parts) {
        const tableMatch = part.match(/^__TABLE_(\d+)__$/);
        if (tableMatch) {
          // Flush any accumulated text
          if (partText.trim()) {
            const t = partText.trim();
            finalChunks.push({
              text: t,
              index: globalIndex++,
              tokens: estimateTokens(t),
              metadata: {
                start: chunk.metadata.start,
                end: chunk.metadata.end,
                overlap: false,
              },
            });
            partText = "";
          }

          // Emit table as its own chunk with context header
          const table = placeholderMap.get(part);
          if (table) {
            const header = findNearestHeader(cleanText, table.start);
            const prefix = header ? `[Table from section: ${header}]\n\n` : "";
            const tableChunkText = prefix + table.text;
            finalChunks.push({
              text: tableChunkText.trim(),
              index: globalIndex++,
              tokens: estimateTokens(tableChunkText),
              metadata: {
                start: table.start,
                end: table.end,
                containsTable: true,
                tableColumnHeaders: table.columnHeaders,
              },
            });
          }
        } else {
          partText += part;
        }
      }

      // Flush remaining text
      if (partText.trim()) {
        const t = partText.trim();
        finalChunks.push({
          text: t,
          index: globalIndex++,
          tokens: estimateTokens(t),
          metadata: {
            start: chunk.metadata.start,
            end: chunk.metadata.end,
            overlap: false,
          },
        });
      }
    }
  }

  return finalChunks;
}

/**
 * Chunk text with document metadata
 * Preserves metadata with each chunk for better context.
 * Uses table-aware chunking to keep tables intact.
 */
export function chunkTextWithMetadata(
  text: string,
  metadata: Record<string, any>,
  options: ChunkerOptions = {}
): Array<TextChunk & { documentMetadata: Record<string, any> }> {
  const chunks = tableAwareChunk(text, options);

  return chunks.map((chunk) => ({
    ...chunk,
    documentMetadata: metadata,
  }));
}

/**
 * Chunk document by sections (if text has clear section markers)
 */
export function chunkBySections(
  text: string,
  sectionMarkers: RegExp = /^#+\s+.+$/gm, // Markdown headers by default
  options: ChunkerOptions = {}
): TextChunk[] {
  const sections: Array<{ header: string; content: string; start: number }> = [];
  const matches = [...text.matchAll(sectionMarkers)];

  if (matches.length === 0) {
    // No sections found, fall back to regular chunking
    return chunkText(text, options);
  }

  // Split text into sections
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const header = match[0];
    const start = match.index || 0;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const content = text.substring(start, end).trim();

    sections.push({ header, content, start });
  }

  // Chunk each section separately
  const chunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionChunks = chunkText(section.content, {
      ...options,
      overlap: 0, // Don't overlap within sections
    });

    for (const chunk of sectionChunks) {
      chunks.push({
        ...chunk,
        index: globalIndex++,
        metadata: {
          ...chunk.metadata,
          start: section.start + chunk.metadata.start,
          end: section.start + chunk.metadata.end,
        },
      });
    }
  }

  return chunks;
}

/**
 * Smart chunking that tries section-based first, falls back to regular
 */
export function smartChunk(
  text: string,
  options: ChunkerOptions = {}
): TextChunk[] {
  // Try to detect if document has clear sections
  const hasSections = /^#+\s+.+$/gm.test(text) || /^[A-Z\s]+:$/gm.test(text);

  if (hasSections) {
    return chunkBySections(text, undefined, options);
  }

  return chunkText(text, options);
}
