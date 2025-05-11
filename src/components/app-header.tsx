import { Paintbrush } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <Paintbrush className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">VectorInk</h1>
      </div>
    </header>
  );
}
