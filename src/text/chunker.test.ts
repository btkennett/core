import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  chunkText,
  tableAwareChunk,
  chunkTextWithMetadata,
  chunkBySections,
  smartChunk,
} from "./chunker";
import type { TextChunk } from "./chunker";

describe("estimateTokens", () => {
  it("estimates ~1 token per 4 characters", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcdefgh")).toBe(2);
    expect(estimateTokens("abc")).toBe(1); // ceil(3/4) = 1
    expect(estimateTokens("abcde")).toBe(2); // ceil(5/4) = 2
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });
});

describe("chunkText", () => {
  it("returns empty array for empty text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns single chunk for short text", () => {
    const text = "Hello world, this is a short text.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].tokens).toBe(estimateTokens(text));
  });

  it("returns single chunk for single word", () => {
    const chunks = chunkText("hello");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("hello");
  });

  it("splits long text into multiple chunks", () => {
    // Generate text longer than 800 tokens (3200+ chars)
    const paragraph = "This is a test sentence that fills up space. ";
    const text = paragraph.repeat(100); // ~4500 chars = ~1125 tokens
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("respects maxTokens option", () => {
    const paragraph = "Word ".repeat(200); // 1000 chars = 250 tokens
    const chunks = chunkText(paragraph, { maxTokens: 100, minTokens: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be roughly within maxTokens (some tolerance for split boundaries)
    for (const chunk of chunks) {
      expect(chunk.tokens).toBeLessThanOrEqual(150); // allow some boundary tolerance
    }
  });

  it("splits on paragraph boundaries when possible", () => {
    const para1 = "A".repeat(2000); // 500 tokens
    const para2 = "B".repeat(2000); // 500 tokens
    const text = para1 + "\n\n" + para2;
    const chunks = chunkText(text, { maxTokens: 600, minTokens: 100 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it("sets overlap metadata correctly", () => {
    const text = "Word ".repeat(500); // ~2500 chars = ~625 tokens
    const chunks = chunkText(text, { maxTokens: 300, minTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    // First chunk should not have overlap (may be undefined or falsy)
    expect(chunks[0].metadata.overlap).toBeFalsy();
    // Subsequent chunks should have overlap set to true
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].metadata.overlap).toBe(true);
    }
  });
});

describe("tableAwareChunk", () => {
  const markdownTable = [
    "| Name | Age | City |",
    "| --- | --- | --- |",
    "| Alice | 30 | NYC |",
    "| Bob | 25 | LA |",
    "| Charlie | 35 | Chicago |",
  ].join("\n");

  it("never splits a markdown table across chunks", () => {
    // Surround table with enough text to force chunking
    const prefix = "Introduction paragraph. ".repeat(60); // ~1440 chars
    const suffix = "Conclusion paragraph. ".repeat(60);
    const text = prefix + "\n\n" + markdownTable + "\n\n" + suffix;

    const chunks = tableAwareChunk(text, { maxTokens: 400, minTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);

    // At least one chunk should contain the complete table (all rows together)
    const completeTableChunks = chunks.filter(
      (c) =>
        c.text.includes("| Alice |") &&
        c.text.includes("| Bob |") &&
        c.text.includes("| Charlie |")
    );
    expect(completeTableChunks.length).toBeGreaterThanOrEqual(1);
  });

  it("sets containsTable and tableColumnHeaders metadata", () => {
    const text = "Some intro text.\n\n" + markdownTable + "\n\nSome outro.";
    const chunks = tableAwareChunk(text);

    const tableChunk = chunks.find((c) => c.metadata.containsTable);
    expect(tableChunk).toBeDefined();
    expect(tableChunk!.metadata.tableColumnHeaders).toContain("Name");
    expect(tableChunk!.metadata.tableColumnHeaders).toContain("Age");
    expect(tableChunk!.metadata.tableColumnHeaders).toContain("City");
  });

  it("falls back to smartChunk when no tables present", () => {
    const text = "Just some plain text without any tables.";
    const chunks = tableAwareChunk(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
  });
});

describe("smartChunk", () => {
  it("uses section-based chunking when headers present", () => {
    const text = [
      "# Section One",
      "Content of section one. ".repeat(10),
      "# Section Two",
      "Content of section two. ".repeat(10),
    ].join("\n\n");

    const chunks = smartChunk(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].text).toContain("Section One");
  });

  it("falls back to regular chunking without headers", () => {
    const text = "Just plain text without any markdown headers or sections.";
    const chunks = smartChunk(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
  });
});

describe("chunkBySections", () => {
  it("splits on markdown headers", () => {
    const text = [
      "# Introduction",
      "This is the intro.",
      "## Details",
      "These are the details.",
      "## Conclusion",
      "This is the conclusion.",
    ].join("\n");

    const chunks = chunkBySections(text);
    expect(chunks.length).toBe(3);
    expect(chunks[0].text).toContain("Introduction");
    expect(chunks[1].text).toContain("Details");
    expect(chunks[2].text).toContain("Conclusion");
  });

  it("falls back to chunkText when no sections found", () => {
    const text = "No headers here, just plain text.";
    const chunks = chunkBySections(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
  });
});

describe("chunkTextWithMetadata", () => {
  it("preserves document metadata on each chunk", () => {
    const text = "Some document content.";
    const metadata = { source: "test.pdf", page: 1 };
    const chunks = chunkTextWithMetadata(text, metadata);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].documentMetadata).toEqual(metadata);
    expect(chunks[0].text).toBe(text);
  });

  it("attaches metadata to all chunks when text is split", () => {
    const text = "Paragraph. ".repeat(200);
    const metadata = { source: "big.pdf" };
    const chunks = chunkTextWithMetadata(text, metadata, {
      maxTokens: 200,
      minTokens: 50,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.documentMetadata).toEqual(metadata);
    }
  });
});

describe("edge cases", () => {
  it("empty text returns empty array", () => {
    expect(chunkText("")).toEqual([]);
    expect(tableAwareChunk("")).toEqual([]);
    expect(smartChunk("")).toEqual([]);
    expect(chunkTextWithMetadata("", {})).toEqual([]);
  });

  it("single word returns single chunk", () => {
    const chunks = chunkText("hello");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("hello");
    expect(chunks[0].index).toBe(0);
  });
});
