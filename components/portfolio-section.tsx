// components/portfolio-section.tsx
'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

// Client-only map (no SSR)
const ProjectMap = dynamic(() => import('@/components/ProjectMap'), { ssr: false });

// Precomputed projects with coords
import projectsWithCoords from '@/data/projects.json';

export function PortfolioSection() {
  // Use the precomputed projects for the cards - filter to get one representative per main category
  const cardProjects = useMemo(() => {
    const categories = ['Hydrology', 'Air Quality & Noise', 'GIS & Remote Sensing'];
    const representativeProjects = [];
    
    for (const category of categories) {
      // Find the first project in this category from precomputed data
      const project = (projectsWithCoords as any[]).find(p => p.category === category);
      if (project) {
        representativeProjects.push(project);
      }
    }
    
    return representativeProjects;
  }, []);

  // State: which project (by the precomputed data id) map should center on
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Prepare the precomputed dataset to pass to the map
  const precomputedProjects = useMemo(() => (projectsWithCoords as any[]) || [], []);

  // Helper: when clicking a card, find matching precomputed project by ID
  function handleCardClick(project: { id: string }) {
    setSelectedProjectId(project.id);
  }

  return (
    <section id="portfolio" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Portfolio & Projects</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Selected projects showcasing expertise across environmental consultancy disciplines
            </p>
          </div>
          
          {/* Map Section - Increased height */}
          <div className="mb-16">
            <ProjectMap 
              projects={precomputedProjects} 
              height={'84vh'} 
              centerProjectId={selectedProjectId} 
            />
          </div>

          {/* Portfolio Cards Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cardProjects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => handleCardClick(project)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(project); }}
                className="block group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <Card className="h-full overflow-hidden border-2 hover:border-primary transition-colors py-4">
                  <div className="relative overflow-hidden">
                    <img
                      src={project.imageThumb || project.image || "/placeholder.svg"}
                      width={400} 
                      height={260} 
                      alt={project.title} 
                      // className="object-cover"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-primary/90 text-background/90">
                        {project.category}
                      </Badge>
                    </div>
                    {project.year && (
                      <div className="absolute top-12 left-4">
                        <Badge variant="secondary" className="bg-background/90 italic text-xs">
                          {project.year}
                        </Badge>
                      </div>
                    )}

                    {/* External link icon */}
                    <div className="absolute top-4 right-4 z-20"> {/* Added z-20 */}
                      {project.link ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="p-1 transition-colors z-30"
                          aria-label={`Open ${project.title}`}
                        >
                          <ExternalLink className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                        </a>
                      ) : (
                        <div className="p-1">
                          <ExternalLink className="h-6 w-6 text-muted-foreground opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white text-sm font-semibold">View on map</div>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {project.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium text-primary">{project.impact}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
