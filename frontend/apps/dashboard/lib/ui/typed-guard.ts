const WORDS = [
  "amber",
  "branch",
  "copper",
  "delta",
  "ember",
  "frost",
  "harbor",
  "linen",
  "maple",
  "orbit",
  "pixel",
  "quartz",
  "river",
  "signal",
  "tempo",
  "violet",
  "willow",
  "zinc",
]

export function generateThreeWordGuard() {
  const values = new Set<string>()

  while (values.size < 3) {
    values.add(WORDS[Math.floor(Math.random() * WORDS.length)])
  }

  return Array.from(values).join("-")
}
