import { describe, expect, it } from "vitest";
import { availabilityText } from "./labels";

describe("availabilityText", () => {
  it("gom theo buổi", () => {
    expect(availabilityText({ t3: ["toi"], t5: ["toi"], t7: ["sang"] })).toBe("Sáng T7 · Tối T3, T5");
    expect(availabilityText({})).toBe("");
  });
});
