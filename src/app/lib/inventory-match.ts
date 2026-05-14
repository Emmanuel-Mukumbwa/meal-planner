import type { InventoryItem } from "@/app/lib/types"

export type RecipeIngredientLike = {
  name: string
  quantity: number
  unit: string
}

export type IngredientMatchStatus = "enough" | "low" | "missing"

export type IngredientMatchResult = {
  ingredientName: string
  normalizedIngredientName: string
  requiredQuantity: number
  requiredUnit: string
  matchedInventoryId: string | null
  matchedInventoryName: string | null
  availableQuantity: number
  availableUnit: string | null
  requiredQuantityInInventoryUnit: number | null
  status: IngredientMatchStatus
  note: string | null
}

export type InventoryAssessment = {
  ingredients: IngredientMatchResult[]
  canServe: boolean
  warningCount: number
  warningMessage: string | null
}

type InventoryLike = Pick<InventoryItem, "id" | "name" | "quantity" | "unit">

const NAME_ALIASES: Record<string, string> = {
  tomatoe: "tomato",
  tomatoes: "tomato",
  tomato: "tomato",

  "irish potatoe": "irish potato",
  "irish potatoes": "irish potato",
  potatoe: "potato",
  potatoes: "potato",
  potato: "potato",

  "first choice milk": "milk",
  milk: "milk",

  smothie: "smoothie",
  smoothie: "smoothie",

  eggs: "eggs",
  egg: "eggs",

  rice: "rice",
  cereal: "cereal",
  noodles: "noodles",
  "soya pieces": "soya pieces",
  "maize flour": "maize flour",
  margarine: "margarine",
  salt: "salt",
  sugar: "sugar",
  "cooking oil": "cooking oil",
  oil: "cooking oil",
  spaghetti: "spaghetti",
  beans: "beans",
  chicken: "chicken",
  fish: "fish",
}

function cleanText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeIngredientName(value: string) {
  const cleaned = cleanText(value)

  if (NAME_ALIASES[cleaned]) {
    return NAME_ALIASES[cleaned]
  }

  const withoutBrand = cleaned.replace(/\bfirst choice\b/g, "").trim()
  if (NAME_ALIASES[withoutBrand]) {
    return NAME_ALIASES[withoutBrand]
  }

  return withoutBrand || cleaned
}

export function normalizeUnit(unit: string) {
  const cleaned = cleanText(unit)

  if (["g", "gram", "grams"].includes(cleaned)) return "g"
  if (["kg", "kilogram", "kilograms"].includes(cleaned)) return "kg"

  if (["ml", "millilitre", "millilitres", "milliliter", "milliliters"].includes(cleaned)) {
    return "ml"
  }

  if (["l", "litre", "litres", "liter", "liters"].includes(cleaned)) {
    return "litre"
  }

  if (["piece", "pieces"].includes(cleaned)) return "piece"
  if (["packet", "packets"].includes(cleaned)) return "packet"
  if (["tray", "trays"].includes(cleaned)) return "tray"
  if (["slice", "slices"].includes(cleaned)) return "slice"

  return cleaned
}

function getUnitGroup(unit: string) {
  const normalized = normalizeUnit(unit)

  if (normalized === "g" || normalized === "kg") return "mass"
  if (normalized === "ml" || normalized === "litre") return "volume"
  if (
    normalized === "piece" ||
    normalized === "packet" ||
    normalized === "tray" ||
    normalized === "slice"
  ) {
    return "count"
  }

  return "unknown"
}

export function convertQuantity(quantity: number, fromUnit: string, toUnit: string) {
  const from = normalizeUnit(fromUnit)
  const to = normalizeUnit(toUnit)

  if (from === to) {
    return quantity
  }

  const fromGroup = getUnitGroup(from)
  const toGroup = getUnitGroup(to)

  if (fromGroup !== toGroup) {
    return null
  }

  if (fromGroup === "mass") {
    const fromFactor = from === "kg" ? 1000 : 1
    const toFactor = to === "kg" ? 1000 : 1
    return (quantity * fromFactor) / toFactor
  }

  if (fromGroup === "volume") {
    const fromFactor = from === "litre" ? 1000 : 1
    const toFactor = to === "litre" ? 1000 : 1
    return (quantity * fromFactor) / toFactor
  }

  return null
}

function tokenOverlapScore(a: string, b: string) {
  const aTokens = new Set(cleanText(a).split(" ").filter(Boolean))
  const bTokens = new Set(cleanText(b).split(" ").filter(Boolean))

  let overlap = 0
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap++
  }

  return overlap
}

function nameMatchScore(recipeName: string, inventoryName: string) {
  const a = normalizeIngredientName(recipeName)
  const b = normalizeIngredientName(inventoryName)

  if (a === b) return 100
  if (a.includes(b) || b.includes(a)) return 80

  const overlap = tokenOverlapScore(a, b)
  if (overlap > 0) return 50 + overlap

  return 0
}

function roundTo2(value: number) {
  return Math.round(value * 100) / 100
}

function buildWarningMessage(results: IngredientMatchResult[]) {
  const issueNames = results
    .filter((item) => item.status !== "enough")
    .map((item) => item.ingredientName)

  if (!issueNames.length) return null

  if (issueNames.length === 1) {
    return `Not enough stock for ${issueNames[0]}.`
  }

  return `Not enough stock for ${issueNames.join(", ")}.`
}

export function evaluateRecipeAgainstInventory(
  recipeIngredients: RecipeIngredientLike[],
  inventoryItems: InventoryLike[]
): InventoryAssessment {
  const ingredients = recipeIngredients.map<IngredientMatchResult>((ingredient) => {
    const normalizedIngredientName = normalizeIngredientName(ingredient.name)
    const normalizedRequiredUnit = normalizeUnit(ingredient.unit)

    const candidates = inventoryItems
      .map((item) => {
        const normalizedInventoryName = normalizeIngredientName(item.name)
        const score = nameMatchScore(ingredient.name, item.name)

        const requiredInInventoryUnit = convertQuantity(
          Number(ingredient.quantity) || 0,
          ingredient.unit,
          item.unit
        )

        return {
          item,
          score,
          requiredInInventoryUnit,
          normalizedInventoryName,
        }
      })
      .filter((candidate) => candidate.score > 0 && candidate.requiredInInventoryUnit !== null)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score

        const aAvailable = Number(a.item.quantity) || 0
        const bAvailable = Number(b.item.quantity) || 0

        const aEnough = aAvailable >= Number(a.requiredInInventoryUnit)
        const bEnough = bAvailable >= Number(b.requiredInInventoryUnit)

        if (aEnough !== bEnough) return aEnough ? -1 : 1
        return bAvailable - aAvailable
      })

    const best = candidates[0]

    if (!best) {
      return {
        ingredientName: ingredient.name,
        normalizedIngredientName,
        requiredQuantity: roundTo2(Number(ingredient.quantity) || 0),
        requiredUnit: normalizeUnit(ingredient.unit),
        matchedInventoryId: null,
        matchedInventoryName: null,
        availableQuantity: 0,
        availableUnit: null,
        requiredQuantityInInventoryUnit: null,
        status: "missing",
        note: "No compatible inventory match found.",
      }
    }

    const availableQuantity = Number(best.item.quantity) || 0
    const requiredQuantityInInventoryUnit = Number(best.requiredInInventoryUnit) || 0
    const availableUnit = normalizeUnit(best.item.unit)
    const enough = availableQuantity >= requiredQuantityInInventoryUnit
    const status: IngredientMatchStatus = enough
      ? "enough"
      : availableQuantity > 0
      ? "low"
      : "missing"

    return {
      ingredientName: ingredient.name,
      normalizedIngredientName,
      requiredQuantity: roundTo2(Number(ingredient.quantity) || 0),
      requiredUnit: normalizedRequiredUnit,
      matchedInventoryId: best.item.id,
      matchedInventoryName: best.item.name,
      availableQuantity: roundTo2(availableQuantity),
      availableUnit,
      requiredQuantityInInventoryUnit: roundTo2(requiredQuantityInInventoryUnit),
      status,
      note:
        status === "enough"
          ? null
          : status === "low"
          ? `Only ${roundTo2(availableQuantity)} ${availableUnit} available.`
          : "No stock available.",
    }
  })

  const warningCount = ingredients.filter((item) => item.status !== "enough").length
  const canServe = warningCount === 0
  const warningMessage = buildWarningMessage(ingredients)

  return {
    ingredients,
    canServe,
    warningCount,
    warningMessage,
  }
}

export function summarizeMissingIngredients(results: IngredientMatchResult[]) {
  return results
    .filter((item) => item.status !== "enough")
    .map((item) => item.ingredientName)
    .join(", ")
}