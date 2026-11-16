import { describe, expect, it } from "vitest";
import { checkAnswer } from "./answer";

describe("checkAnswer", () => {
  it("accepts either gloss after a comma, ignoring case and an article", () => {
    expect(checkAnswer("base, stronghold", "Base")).toBe("correct");
    expect(checkAnswer("base, stronghold", "the stronghold")).toBe("correct");
  });

  it("splits on semicolons, slashes, and or", () => {
    expect(checkAnswer("to go; to leave", "leave")).toBe("correct");
    expect(checkAnswer("exit / way out", "way out")).toBe("correct");
    expect(checkAnswer("fort or castle", "castle")).toBe("correct");
  });

  it("ignores parenthetical notes and a leading to", () => {
    expect(checkAnswer("to run (a race)", "run")).toBe("correct");
    expect(checkAnswer("base (a fort, or castle)", "fort")).toBe("wrong");
  });

  it("marks a small typo as close, and a bigger miss as wrong", () => {
    expect(checkAnswer("base", "bass")).toBe("close");
    expect(checkAnswer("stronghold", "stronghol")).toBe("close");
    expect(checkAnswer("base", "zzzz")).toBe("wrong");
  });

  it("accepts an answer when every word of it appears in the input", () => {
    expect(checkAnswer("base, stronghold", "a stronghold wall")).toBe("close");
  });
});
