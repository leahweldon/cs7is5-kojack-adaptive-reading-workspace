import { useApp } from "@/shared/state/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Persona = {
  id: string;
  name: string;
  description: string;
  image: string; // path to image, e.g., "/images/dyslexia.png"
  preferences: {
    bionicReading: boolean;
    chunking: boolean;
    glossary: boolean;
    adaptivePrompts: boolean;
    progressIndicators: boolean;
    supportLevel: "low" | "medium" | "high";
    readingGoal: "comprehension" | "speed" | "casual";
  };
};

const personas: Persona[] = [
  {
    id: "dyslexia",
    name: "Dyslexia Support",
    description: "Optimized for dyslexia with bionic reading and chunking.",
    image: "/images/dyslexia.png",
    preferences: {
      bionicReading: true,
      chunking: true,
      glossary: true,
      adaptivePrompts: true,
      progressIndicators: true,
      supportLevel: "high",
      readingGoal: "comprehension",
    },
  },
  {
    id: "adhd",
    name: "ADHD Focus",
    description: "Short chunks and prompts to maintain attention.",
    image: "/images/adhd.png",
    preferences: {
      bionicReading: false,
      chunking: true,
      glossary: false,
      adaptivePrompts: true,
      progressIndicators: true,
      supportLevel: "medium",
      readingGoal: "speed",
    },
  },
  {
    id: "visual",
    name: "Visual Impairment",
    description: "High contrast and progress indicators.",
    image: "/images/visual.png",
    preferences: {
      bionicReading: true,
      chunking: false,
      glossary: true,
      adaptivePrompts: false,
      progressIndicators: true,
      supportLevel: "high",
      readingGoal: "comprehension",
    },
  },
  {
    id: "general",
    name: "General Learner",
    description: "Balanced settings for everyday reading.",
    image: "/images/general.png",
    preferences: {
      bionicReading: false,
      chunking: false,
      glossary: false,
      adaptivePrompts: true,
      progressIndicators: true,
      supportLevel: "low",
      readingGoal: "casual",
    },
  },
];

export default function Preferences() {
  const { setPreferences } = useApp();

  const selectPersona = (persona: Persona) => {
    setPreferences(persona.preferences);
    // Optionally navigate to reader or show confirmation
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Choose Your Persona</h1>
          <p className="text-sm text-muted-foreground">
            Select a profile that matches your needs for an optimized reading experience.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {personas.map((persona) => (
            <Card key={persona.id} className="p-6 text-center space-y-4">
              <img
                src={persona.image}
                alt={persona.name}
                className="w-20 h-20 mx-auto rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-medium">{persona.name}</h3>
                <p className="text-sm text-muted-foreground">{persona.description}</p>
              </div>
              <Button onClick={() => selectPersona(persona)} className="w-full">
                Select
              </Button>
            </Card>
          ))}
        </div>

        {/* Optional: Add a "Custom" button to go back to manual toggles */}
        <div className="text-center">
          <Button variant="outline" onClick={() => {/* navigate to custom preferences */}}>
            Customize Manually
          </Button>
        </div>
      </div>
    </div>
  );
}