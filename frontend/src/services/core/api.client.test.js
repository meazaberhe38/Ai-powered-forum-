import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiClient", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds the API prefix when the configured base URL does not already include it", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://example.com");

    const { apiClient } = await import("./api.client.js");

    expect(apiClient.defaults.baseURL).toBe("https://example.com/api");
  });
});
