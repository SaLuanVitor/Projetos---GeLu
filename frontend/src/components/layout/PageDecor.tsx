type PageDecorVariant =
  | "auth"
  | "dashboard"
  | "default"
  | "evolution"
  | "profile"
  | "public"
  | "recipe-detail"
  | "recipe-form"
  | "recipes";

const variantShapes: Record<PageDecorVariant, string[]> = {
  auth: ["decor-note decor-auth-note", "decor-ring decor-auth-ring"],
  dashboard: [
    "decor-fork decor-dashboard-fork",
    "decor-tape decor-dashboard-tape",
    "decor-ring decor-dashboard-ring"
  ],
  default: ["decor-pin decor-default-pin", "decor-ring decor-default-ring"],
  evolution: ["decor-book decor-evolution-book", "decor-tape decor-evolution-tape"],
  profile: ["decor-note decor-profile-note", "decor-pin decor-profile-pin"],
  public: ["decor-note decor-public-note", "decor-ring decor-public-ring"],
  "recipe-detail": ["decor-pin decor-detail-pin", "decor-tape decor-detail-tape"],
  "recipe-form": ["decor-note decor-form-note", "decor-rolling-pin decor-form-rolling-pin"],
  recipes: [
    "decor-note decor-recipes-note",
    "decor-pin decor-recipes-pin",
    "decor-tape decor-recipes-tape"
  ]
};

export function PageDecor({ variant }: { variant: PageDecorVariant }) {
  return (
    <div aria-hidden="true" className="page-decor">
      {variantShapes[variant].map((className) => (
        <span className={`decor-shape ${className}`} key={className} />
      ))}
    </div>
  );
}

export type { PageDecorVariant };
