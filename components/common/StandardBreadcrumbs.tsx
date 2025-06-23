import Breadcrumbs from './Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StandardBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function StandardBreadcrumbs({
  items,
}: StandardBreadcrumbsProps) {
  return (
    <div className="border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/8 via-[#f0b7c8]/6 to-[#f9bbc4]/8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <Breadcrumbs items={items} />
      </div>
    </div>
  );
}
