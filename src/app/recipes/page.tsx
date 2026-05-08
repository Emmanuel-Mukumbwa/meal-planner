"use client"

import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Globe,
  ChefHat,
  Import,
  Loader2,
  Trash2,
  X,
} from "lucide-react"
import { getRecipes, addRecipe, deleteRecipe, importRecipeFromURL } from "@/app/actions/recipe-actions"
import { Recipe } from "@/app/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

type RecipeIngredientInput = {
  name: string
  quantity: string
  unit: string
}

type CustomRecipeForm = {
  name: string
  description: string
  ingredients: RecipeIngredientInput[]
  steps: string[]
}

const emptyCustomRecipe = (): CustomRecipeForm => ({
  name: "",
  description: "",
  ingredients: [{ name: "", quantity: "", unit: "" }],
  steps: [""],
})

export default function RecipesPage() {
  const { toast } = useToast()

  const [recipes, setRecipes] = React.useState<Recipe[]>([])
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [isImporting, setIsImporting] = React.useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [savingRecipe, setSavingRecipe] = React.useState(false)
  const [customRecipe, setCustomRecipe] = React.useState<CustomRecipeForm>(emptyCustomRecipe())

  React.useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      const data = await getRecipes()
      setRecipes(data)
    } finally {
      setLoading(false)
    }
  }

  const resetCustomRecipe = () => {
    setCustomRecipe(emptyCustomRecipe())
  }

  const updateIngredient = (index: number, field: keyof RecipeIngredientInput, value: string) => {
    setCustomRecipe((prev) => {
      const next = [...prev.ingredients]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, ingredients: next }
    })
  }

  const addIngredientRow = () => {
    setCustomRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", quantity: "", unit: "" }],
    }))
  }

  const removeIngredientRow = (index: number) => {
    setCustomRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const updateStep = (index: number, value: string) => {
    setCustomRecipe((prev) => {
      const next = [...prev.steps]
      next[index] = value
      return { ...prev, steps: next }
    })
  }

  const addStepRow = () => {
    setCustomRecipe((prev) => ({
      ...prev,
      steps: [...prev.steps, ""],
    }))
  }

  const removeStepRow = (index: number) => {
    setCustomRecipe((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  const handleImport = async () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return

    setIsImporting(true)
    try {
      const result = await importRecipeFromURL({ url: trimmedUrl })

      const recipeData = {
        name: result.title,
        description:
          [result.servings ? `Serves: ${result.servings}` : null, result.prepTime ? `Prep: ${result.prepTime}` : null, result.cookTime ? `Cook: ${result.cookTime}` : null]
            .filter(Boolean)
            .join(" • ") || undefined,
        ingredients: result.ingredients.map((i) => {
          const match = i.match(/^([\d./\s-]+)?\s*(.*)$/)
          const quantityText = match?.[1]?.trim() || "1"
          const nameText = match?.[2]?.trim() || i

          const quantityNumber = Number.parseFloat(quantityText) || 1

          return {
            name: nameText,
            quantity: quantityNumber,
            unit: "unit",
          }
        }),
        steps: result.steps.length ? result.steps : ["Review and prepare the ingredients."],
      }

      const saved = await addRecipe(recipeData)
      setRecipes((current) => [saved as Recipe, ...current])
      setIsImportDialogOpen(false)
      setUrl("")
      toast({ title: "Recipe Imported!", description: `Successfully added ${result.title}.` })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Could not extract recipe from the URL.",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleCreateRecipe = async () => {
    const name = customRecipe.name.trim()
    const description = customRecipe.description.trim()

    const ingredients = customRecipe.ingredients
      .map((ing) => ({
        name: ing.name.trim(),
        quantity: Number(ing.quantity),
        unit: ing.unit.trim(),
      }))
      .filter((ing) => ing.name && ing.unit && Number.isFinite(ing.quantity) && ing.quantity > 0)

    const steps = customRecipe.steps.map((step) => step.trim()).filter(Boolean)

    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing name",
        description: "Recipe name is required.",
      })
      return
    }

    if (!ingredients.length) {
      toast({
        variant: "destructive",
        title: "Missing ingredients",
        description: "Add at least one valid ingredient.",
      })
      return
    }

    if (!steps.length) {
      toast({
        variant: "destructive",
        title: "Missing steps",
        description: "Add at least one cooking step.",
      })
      return
    }

    setSavingRecipe(true)
    try {
      const saved = await addRecipe({
        name,
        description: description || undefined,
        ingredients,
        steps,
      })

      setRecipes((current) => [saved as Recipe, ...current])
      setIsCreateDialogOpen(false)
      resetCustomRecipe()

      toast({
        title: "Recipe Saved",
        description: `${name} has been added to your recipe book.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save the custom recipe.",
      })
    } finally {
      setSavingRecipe(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecipe(id)
      setRecipes((current) => current.filter((r) => r.id !== id))
      toast({ title: "Recipe Deleted" })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the recipe.",
      })
    }
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      recipe.name.toLowerCase().includes(q) ||
      (recipe.description || "").toLowerCase().includes(q) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    )
  })

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Recipe Book</h1>
            <p className="text-muted-foreground">Create recipes manually or import them from a URL.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Add Custom Recipe
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Custom Recipe</DialogTitle>
                  <DialogDescription>
                    Add a recipe manually with ingredients and step-by-step instructions.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipe Name</label>
                      <Input
                        placeholder="e.g., Chicken Stew"
                        value={customRecipe.name}
                        onChange={(e) =>
                          setCustomRecipe((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        placeholder="Optional short description"
                        value={customRecipe.description}
                        onChange={(e) =>
                          setCustomRecipe((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Ingredients</h3>
                      <Button variant="outline" size="sm" onClick={addIngredientRow}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Ingredient
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {customRecipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto] items-center">
                          <Input
                            placeholder="Ingredient name"
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(index, "name", e.target.value)}
                          />
                          <Input
                            placeholder="Quantity"
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                          />
                          <Input
                            placeholder="Unit"
                            value={ingredient.unit}
                            onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeIngredientRow(index)}
                            disabled={customRecipe.ingredients.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Steps</h3>
                      <Button variant="outline" size="sm" onClick={addStepRow}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Step
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {customRecipe.steps.map((step, index) => (
                        <div key={index} className="grid gap-2 md:grid-cols-[1fr_auto] items-start">
                          <Input
                            placeholder={`Step ${index + 1}`}
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStepRow(index)}
                            disabled={customRecipe.steps.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} disabled={savingRecipe}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRecipe} disabled={savingRecipe}>
                    {savingRecipe ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Save Recipe
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Globe className="h-4 w-4" /> Import from URL
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Recipe</DialogTitle>
                  <DialogDescription>
                    Paste a URL and the app will extract the recipe automatically.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <Input
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={isImporting || !url.trim()}>
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Import className="mr-2 h-4 w-4" />
                    )}
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="border-0 shadow-none p-0 focus-visible:ring-0"
            placeholder="Search recipes or ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="group overflow-hidden border-none shadow-sm bg-white">
                <div className="h-32 bg-muted flex items-center justify-center relative">
                  <ChefHat className="h-12 w-12 text-primary/10" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(recipe.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CardHeader>
                  <CardTitle className="font-headline text-lg">{recipe.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="text-primary border-accent/40">
                    {recipe.ingredients.length} Ingredients
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {recipe.steps?.length || 0} Steps
                  </span>
                </CardContent>
              </Card>
            ))}

            {filteredRecipes.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                <p className="text-muted-foreground">
                  {search.trim() ? "No matching recipes found." : "No recipes found. Add one or import from a URL."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}