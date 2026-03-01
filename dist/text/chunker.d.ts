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
    maxTokens?: number;
    minTokens?: number;
    overlap?: number;
    splitOn?: string[];
}
/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 * For production, use tiktoken or similar for accurate token counting
 */
export declare function estimateTokens(text: string): number;
/**
 * Split text into chunks optimized for vector embeddings
 */
export declare function chunkText(text: string, options?: ChunkerOptions): TextChunk[];
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
export declare function tableAwareChunk(text: string, options?: ChunkerOptions): TextChunk[];
/**
 * Chunk text with document metadata
 * Preserves metadata with each chunk for better context.
 * Uses table-aware chunking to keep tables intact.
 */
export declare function chunkTextWithMetadata(text: string, metadata: Record<string, any>, options?: ChunkerOptions): Array<TextChunk & {
    documentMetadata: Record<string, any>;
}>;
/**
 * Chunk document by sections (if text has clear section markers)
 */
export declare function chunkBySections(text: string, sectionMarkers?: RegExp, // Markdown headers by default
options?: ChunkerOptions): TextChunk[];
/**
 * Smart chunking that tries section-based first, falls back to regular
 */
export declare function smartChunk(text: string, options?: ChunkerOptions): TextChunk[];
//# sourceMappingURL=chunker.d.ts.map