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
import { MOCK_RECIPES } from "@/app/lib/mock-data"
import { importRecipeFromURL, ImportRecipeFromURLOutput } from "@/ai/flows/import-recipe-from-url"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

export default function RecipesPage() {
  const { toast } = useToast()
  const [recipes, setRecipes] = React.useState(MOCK_RECIPES)
  const [url, setUrl] = React.useState("")
  const [isImporting, setIsImporting] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleImport = async () => {
    if (!url) return
    setIsImporting(true)
    try {
      const result = await importRecipeFromURL({ url })
      const newRecipe = {
        id: Math.random().toString(),
        name: result.title,
        description: `Serves: ${result.servings || 'N/A'}, Prep: ${result.prepTime || 'N/A'}`,
        ingredients: result.ingredients.map(i => ({ name: i, quantity: 1, unit: 'unit' })),
        steps: result.steps
      }
      setRecipes([newRecipe, ...recipes])
      setIsDialogOpen(false)
      setUrl("")
      toast({
        title: "Recipe Imported!",
        description: `Successfully added ${result.title} to your collection.`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Could not extract recipe from the provided URL."
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Recipe Book</h1>
            <p className="text-muted-foreground">Discover, import, and manage your favorite meals.</p>
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
                  <DialogDescription>
                    Paste a recipe URL and our AI will extract the ingredients and steps for you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipe Link</label>
                    <Input 
                      placeholder="https://example.com/best-lasagna" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting || !url}
                    className="bg-primary"
                  >
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Import className="mr-2 h-4 w-4" />}
                    Import Recipe
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Create Manual
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search recipes by name or ingredient..." className="pl-10 h-12 rounded-xl bg-white shadow-sm border-none" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="group overflow-hidden border-none shadow-sm transition-all hover:shadow-md bg-white">
              <div className="h-40 bg-muted flex items-center justify-center relative">
                 <ChefHat className="h-16 w-16 text-primary/10 group-hover:scale-110 transition-transform" />
                 <div className="absolute top-3 left-3 flex gap-1">
                   <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-primary">Dinner</Badge>
                 </div>
                 <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setRecipes(recipes.filter(r => r.id !== recipe.id))}
                >
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                <CardDescription className="line-clamp-1">{recipe.description || 'A quick and healthy home-cooked meal.'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 25 mins
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> 4 portions
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] font-normal border-accent/40 text-primary">
                    {recipe.ingredients.length} Ingredients
                  </Badge>
                </div>
                <Button variant="secondary" className="w-full bg-secondary hover:bg-accent/20 transition-colors">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}