import React from 'react';
import { cn } from '~/lib/utils';

interface SpecLine {
    title: string;
    description: string;
}

interface SpecificationsTableProps {
    details: string;
}

export function SpecificationsTable({ details }: SpecificationsTableProps) {
    if (!details) return null;

    // Split the string into lines and then parse each line
    const lines: SpecLine[] = details
        .split('\n')
        .map((line) => {
            const [titlePart, ...descParts] = line.split(':');
            const title = titlePart?.trim() || '';
            const description = descParts.join(':').trim();
            return { title, description };
        })
        .filter((line) => line.title && line.description);

    if (lines.length === 0) return null;

    return (
        <div className="w-full border-t border-dark py-12">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Title section */}
                <div className="md:w-1/3">
                    <h2 className="text-xl font-extrabold uppercase tracking-tight text-dark">
                        Especificaciones
                    </h2>
                </div>

                {/* Specifications section */}
                <div className="md:w-2/3">
                    <div className="space-y-4">
                        {lines.map((line, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex flex-col sm:flex-row gap-2 sm:gap-4 py-3",
                                    index !== 0 && "border-t border-dark/10"
                                )}
                            >
                                <div className="sm:w-1/2">
                                    <span className="uppercase text-dark font-extrabold text-sm tracking-tight leading-tight">
                                        {line.title}
                                    </span>
                                </div>
                                <div className="sm:w-1/2">
                                    <span className="text-tgray normal-case font-medium text-lg leading-snug">
                                        {line.description}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
