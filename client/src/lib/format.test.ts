import { describe, expect, it } from "vitest";
import { formatDateTime, initials } from "./format";

describe("display formatting", () => {
  it("uses a clear fallback when an event has not been recorded", () => {
    expect(formatDateTime(null)).toBe("Not recorded");
  });

  it("creates compact initials for participant avatars", () => {
    expect(initials("Maya Chen")).toBe("MC");
    expect(initials("Sam")).toBe("S");
  });
});

