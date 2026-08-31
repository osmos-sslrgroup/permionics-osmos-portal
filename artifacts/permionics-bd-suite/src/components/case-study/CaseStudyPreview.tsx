import { MapPin, Zap, Droplets, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function getSectorColor(sector: string) {
  const s = sector?.toLowerCase() || '';
  if (s.includes('pharma') || s.includes('herbal')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
  if (s.includes('textile')) return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300';
  if (s.includes('cetp') || s.includes('municipal')) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
  if (s.includes('food') || s.includes('beverage')) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
}

export interface CaseStudyDisplayData {
  clientName: string;
  sector: string;
  location: string;
  challenge: string;
  solution: string;
  technologyStack: string;
  capacity: string;
  results: string;
  testimonial?: string | null;
  tags: string[];
}

export function CaseStudyPreview({ data }: { data: Partial<CaseStudyDisplayData> }) {
  return (
    <div className="bg-card w-full rounded-xl shadow-sm border border-border overflow-hidden print-full">
      <div className="bg-primary px-8 py-10 text-primary-foreground print:bg-primary print:text-white print:!bg-opacity-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              {data.clientName || 'Client Name'}
            </h1>
            <Badge className={`${getSectorColor(data.sector || '')} bg-white text-primary hover:bg-white/90 border-transparent text-sm px-3 py-1 font-semibold tracking-wide`}>
              {data.sector || 'Sector'}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 divide-x border-b bg-muted/30 print:bg-gray-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <div className="p-6 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5"/> Capacity
          </span>
          <span className="text-lg font-medium text-foreground">{data.capacity || '-'}</span>
        </div>
        <div className="p-6 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5"/> Technology
          </span>
          <span className="text-lg font-medium text-foreground">{data.technologyStack || '-'}</span>
        </div>
        <div className="p-6 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5"/> Location
          </span>
          <span className="text-lg font-medium text-foreground">{data.location || '-'}</span>
        </div>
      </div>

      <div className="p-8 space-y-8 print:py-6 print:space-y-6">
        <section>
          <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2 mb-4 text-primary">The Challenge</h3>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {data.challenge || 'Describe the challenge the client faced...'}
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2 mb-4 text-primary">Our Solution</h3>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {data.solution || 'Describe the implemented solution...'}
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2 mb-4 text-primary">Results</h3>
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {data.results || 'Highlight key outcomes and metrics...'}
          </p>
        </section>

        {data.testimonial && (
          <section className="bg-primary/5 rounded-xl p-6 relative mt-8 border border-primary/10 print:bg-blue-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <Quote className="absolute top-4 left-4 h-10 w-10 text-primary/10" />
            <p className="relative z-10 italic text-foreground/90 font-medium pl-10 pr-4 text-lg">
              "{data.testimonial}"
            </p>
          </section>
        )}
        
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 border-t print:pt-4">
            {data.tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="bg-secondary/10 text-secondary-foreground border-transparent">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
