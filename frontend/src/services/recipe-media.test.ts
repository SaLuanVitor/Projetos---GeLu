import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/services/auth";
import {
  deleteRecipeMedia,
  fetchRecipeMediaObjectUrl,
  listRecipeMedia,
  setMainRecipeMedia,
  uploadRecipeMedia
} from "@/services/recipe-media";

describe("recipe media service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists recipe media with bearer token", async () => {
    mockFetch([media()]);

    const response = await listRecipeMedia("access-token", "recipe-id");

    expect(response[0].fileName).toBe("foto.png");
    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/recipes/recipe-id/media", {
      method: "GET",
      headers: { Authorization: "Bearer access-token" },
      body: undefined
    });
  });

  it("uploads image with multipart body", async () => {
    mockFetch(media());

    await uploadRecipeMedia(
      "access-token",
      "recipe-id",
      new File(["content"], "foto.png", { type: "image/png" })
    );

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("http://localhost:8080/api/v1/recipes/recipe-id/media");
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.headers).toEqual({ Authorization: "Bearer access-token" });
    expect(call[1]?.body).toBeInstanceOf(FormData);
  });

  it("sets main image and deletes media", async () => {
    mockFetch(media());

    await setMainRecipeMedia("access-token", "recipe-id", "media-id");
    await deleteRecipeMedia("access-token", "recipe-id", "media-id");

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8080/api/v1/recipes/recipe-id/media/media-id/main",
      {
        method: "PUT",
        headers: { Authorization: "Bearer access-token" },
        body: undefined
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8080/api/v1/recipes/recipe-id/media/media-id",
      {
        method: "DELETE",
        headers: { Authorization: "Bearer access-token" },
        body: undefined
      }
    );
  });

  it("maps API errors to ApiClientError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Unsupported image type", details: [] }
        })
      })
    );

    await expect(listRecipeMedia("access-token", "recipe-id")).rejects.toEqual(
      new ApiClientError("Unsupported image type", "VALIDATION_ERROR", [])
    );
  });

  it("fetches protected image content as object URL", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:recipe-image");
    vi.stubGlobal("URL", { createObjectURL });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValue(new Blob(["image"], { type: "image/png" }))
      })
    );

    const response = await fetchRecipeMediaObjectUrl(
      "access-token",
      "/api/v1/recipes/recipe-id/media/media-id/content"
    );

    expect(response).toBe("blob:recipe-image");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/recipes/recipe-id/media/media-id/content",
      {
        headers: { Authorization: "Bearer access-token" }
      }
    );
  });
});

function media() {
  return {
    id: "media-id",
    fileName: "foto.png",
    contentType: "image/png",
    sizeBytes: 1024,
    main: true,
    url: "/api/v1/recipes/recipe-id/media/media-id/content",
    createdAt: "2026-05-10T08:30:00"
  };
}

function mockFetch(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data, message: "ok" })
    })
  );
}
