import { describe, expect, it, vi, beforeEach } from "vitest";
import { listFamilyAuditLogs } from "./audit";

describe("audit service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch family audit logs successfully", async () => {
    const mockLogs = [
      {
        id: "log-1",
        entityType: "FAMILY",
        entityId: "fam-1",
        familyId: "fam-1",
        action: "CREATE",
        userId: "user-1",
        userName: "Luan",
        details: "Criou a família",
        createdAt: "2026-11-20T20:00:00",
      },
    ];

    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        message: "Loaded",
        data: mockLogs,
      }),
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(mockResponse as unknown as Response);

    const result = await listFamilyAuditLogs("mock-token", "fam-1");
    expect(result).toEqual(mockLogs);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/families/fam-1/audit-logs"),
      expect.objectContaining({
        headers: {
          Authorization: "Bearer mock-token",
        },
      })
    );
  });
});
