
export interface Ingredient {
  item: string;
  amount: string;
  substitute?: string;
}

export interface RecipeStep {
  task: string;
  duration: number; // minutes
  courseIndex: number;
  type: 'prep' | 'cook' | 'rest';
}

export interface Course {
  name: string;
  type: 'Appetizer' | 'Entrée' | 'Palate Cleanser' | 'Dessert';
  summary: string;
  ingredients: Ingredient[];
  instructions: string[];
  winePairing: string;
  difficultyNotes: string;
}

export interface MealResult {
  id: string;
  title: string;
  identifiedIngredients: string[]; // New field for transparency
  courses: Course[];
  timeline: RecipeStep[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  totalTime: string;
  flavorPalette: string[];
}

export interface UserProfile {
  skillLevel: 'Beginner' | 'Intermediate' | 'Expert';
  dietaryRestrictions: string[];
  macroTargets?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  flavorDNA: {
    sweet: number;
    salty: number;
    sour: number;
    bitter: number;
    umami: number;
    spicy: number;
  };
}

export interface FlavorNode {
  id: string;
  group: number;
}

export interface FlavorLink {
  source: string;
  target: string;
  value: number;
}

export enum AppView {
  RECIPE_GEN = 'RECIPE_GEN',
  PROFILE = 'PROFILE'
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
