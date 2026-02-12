import * as React from 'react';
import { NavLink } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface BreadcrumbItemProps {
    label: string;
    href?: string;
    current?: boolean;
    dropdown?: {
        label: string;
        href: string;
    }[];
    index: number;
    total: number;
}

export function Breadcrumbs({ items }: { items: Omit<BreadcrumbItemProps, 'index' | 'total'>[] }) {
    return (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center">
            <ol className="flex items-center break-words text-sm text-dark font-bold uppercase">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <BreadcrumbItem
                            {...item}
                            index={index}
                            total={items.length}
                        />
                    </li>
                ))}
            </ol>
        </nav>
    );
}

function BreadcrumbItem({ label, href, current, dropdown, index, total }: BreadcrumbItemProps) {
    const baseClasses = cn(
        'relative flex items-center text-[10px] md:text-xs font-bold uppercase px-4 py-2 border border-dark transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        index === 0 && 'bg-light hover:bg-dark hover:text-light rounded-full z-30',
        index > 0 && !current && 'bg-light hover:bg-dark hover:text-light rounded-r-full -ml-6 pl-8 z-20',
        current && 'bg-dark text-light rounded-r-full select-none -ml-6 pl-8 z-10'
    );

    const zIndex = (total - index) * 10;

    if (dropdown) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger className={cn(baseClasses, "group")} style={{ zIndex }}>
                    <span className="flex items-center gap-1">
                        {label}
                        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-light border-dark min-w-[150px]">
                    {dropdown.map((subItem) => (
                        <DropdownMenuItem key={subItem.href} asChild>
                            <NavLink to={subItem.href} className="w-full text-[10px] font-bold uppercase">
                                {subItem.label}
                            </NavLink>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (current || !href) {
        return (
            <span className={cn(baseClasses, "cursor-default")} style={{ zIndex }}>
                {label}
            </span>
        );
    }

    return (
        <NavLink
            to={href}
            className={baseClasses}
            style={{ zIndex }}
        >
            {label}
        </NavLink>
    );
}
