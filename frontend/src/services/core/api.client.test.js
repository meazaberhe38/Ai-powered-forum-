import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiClient", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured host as the base URL and prefixes relative routes with /api once", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://example.com");

    const { apiClient } = await import("./api.client.js");
    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      url: "/auth/login",
    });

    expect(apiClient.defaults.baseURL).toBe("https://example.com");
    expect(config.url).toBe("/api/auth/login");
  });
});
