import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acknowledgeCoupleNote,
  createCoupleNote,
  deleteCoupleNote,
  listCoupleNotes,
  resolveCoupleNote
} from "@/services/couple-notes";
import type { CoupleNoteResponse } from "@/types/api";

describe("couple-notes service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists couple notes with familyId", async () => {
    mockFetch([sampleNote()]);

    const res = await listCoupleNotes("token", "family-1", true);

    expect(res).toHaveLength(1);
    expect(res[0].content).toBe("Deixei o jantar na geladeira");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/couple-notes?familyId=family-1&activeOnly=true",
      {
        method: "GET",
        headers: { Authorization: "Bearer token" },
        body: undefined
      }
    );
  });

  it("creates a couple note", async () => {
    mockFetch(sampleNote());

    await createCoupleNote("token", {
      familyId: "family-1",
      content: "Deixei o jantar na geladeira",
      category: "RECADO",
      color: "yellow",
      pinned: true
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/couple-notes", {
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        familyId: "family-1",
        content: "Deixei o jantar na geladeira",
        category: "RECADO",
        color: "yellow",
        pinned: true
      })
    });
  });

  it("acknowledges a couple note", async () => {
    mockFetch(sampleNote());

    await acknowledgeCoupleNote("token", "note-1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/couple-notes/note-1/acknowledge",
      {
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: undefined
      }
    );
  });

  it("resolves a couple note", async () => {
    mockFetch(sampleNote());

    await resolveCoupleNote("token", "note-1", true);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/couple-notes/note-1/resolve?resolved=true",
      {
        method: "PUT",
        headers: { Authorization: "Bearer token" },
        body: undefined
      }
    );
  });

  it("deletes a couple note", async () => {
    mockFetch(null);

    await deleteCoupleNote("token", "note-1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/couple-notes/note-1",
      {
        method: "DELETE",
        headers: { Authorization: "Bearer token" },
        body: undefined
      }
    );
  });

  function mockFetch(data: unknown) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data, message: "OK" })
    });
  }

  function sampleNote(): CoupleNoteResponse {
    return {
      id: "note-1",
      familyId: "family-1",
      authorId: "user-1",
      authorName: "Luan",
      content: "Deixei o jantar na geladeira",
      category: "RECADO",
      color: "yellow",
      pinned: true,
      acknowledgedAt: null,
      acknowledgedByName: null,
      resolved: false,
      createdAt: "2026-11-20T22:00:00"
    };
  }
});
