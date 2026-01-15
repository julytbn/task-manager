'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Search, File, Users, CheckSquare } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'client' | 'projet' | 'tache' | 'facture';
  title: string;
  description?: string;
  url: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Erreur recherche:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users size={20} />;
      case 'projet':
        return <File size={20} />;
      case 'tache':
        return <CheckSquare size={20} />;
      case 'facture':
        return <File size={20} />;
      default:
        return <Search size={20} />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      client: 'Client',
      projet: 'Projet',
      tache: 'Tâche',
      facture: 'Facture',
    };
    return labels[type] || type;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Résultats de recherche pour "<span className="gold-gradient-text">{query}</span>"
          </h1>
          <p className="text-gray-600">
            {loading ? 'Recherche en cours...' : `${results.length} résultat(s) trouvé(s)`}
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <div className="card flex items-center justify-center py-12">
              <div className="animate-spin">
                <Search size={32} className="text-[var(--color-gold)]" />
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <a
                key={`${result.type}-${result.id}`}
                href={result.url}
                className="card group cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-[var(--color-gold)] group-hover:scale-110 transition-transform">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--color-black-deep)] group-hover:text-[var(--color-gold)] transition-colors">
                      {result.title}
                    </h3>
                    {result.description && (
                      <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[var(--color-gold)] group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="card text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                Aucun résultat trouvé pour "{query}"
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Essayez une autre recherche
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<MainLayout><div>Chargement...</div></MainLayout>}>
      <SearchPageContent />
    </Suspense>
  );
}
