
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
  Clock, 
  Users,
  Import,
  Loader2,
  Trash2
} from "lucide-react"
import { getRecipes, addRecipe, deleteRecipe } from "@/app/actions/recipe-actions"
import { Recipe } from "@/app/lib/types"
import { importRecipeFromURL } from "@/ai/flows/import-recipe-from-url"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

export default function RecipesPage() {
  const { toast } = useToast()
  const [recipes, setRecipes] = React.useState<Recipe[]>([])
  const [loading, setLoading] = React.useState(true)
  const [url, setUrl] = React.useState("")
  const [isImporting, setIsImporting] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

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

  const handleImport = async () => {
    if (!url) return
    setIsImporting(true)
    try {
      const result = await importRecipeFromURL({ url })
      const recipeData = {
        name: result.title,
        description: `Serves: ${result.servings || 'N/A'}, Prep: ${result.prepTime || 'N/A'}`,
        ingredients: result.ingredients.map(i => ({ name: i, quantity: 1, unit: 'unit' })),
        steps: result.steps
      }
      const saved = await addRecipe(recipeData)
      setRecipes([saved as Recipe, ...recipes])
      setIsDialogOpen(false)
      setUrl("")
      toast({ title: "Recipe Imported!", description: `Successfully added ${result.title}.` })
    } catch (error) {
      toast({ variant: "destructive", title: "Import Failed", description: "Could not extract recipe." })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteRecipe(id)
    setRecipes(recipes.filter(r => r.id !== id))
    toast({ title: "Recipe Deleted" })
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Recipe Book</h1>
            <p className="text-muted-foreground">Discover and manage your meals using Aiven MySQL.</p>
          </div>
          <div className="flex gap-2">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Globe className="h-4 w-4" /> Import from URL
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Recipe</DialogTitle>
                  <DialogDescription>Paste a URL and our AI will extract the ingredients.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleImport} disabled={isImporting || !url}>
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Import className="mr-2 h-4 w-4" />}
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="group overflow-hidden border-none shadow-sm bg-white">
                <div className="h-32 bg-muted flex items-center justify-center relative">
                   <ChefHat className="h-12 w-12 text-primary/10" />
                   <Button variant="destructive" size="icon" className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(recipe.id)}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{recipe.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-primary border-accent/40">
                    {recipe.ingredients.length} Ingredients
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {recipes.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl">
                <p className="text-muted-foreground">No recipes found. Try importing one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
