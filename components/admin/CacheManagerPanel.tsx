'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCacheManager } from '@/hooks/useCacheManager';
import { Database, Trash2, RefreshCw, Info } from 'lucide-react';

export default function CacheManagerPanel() {
  const { clearAllCache, clearStoreCache, getCacheInfo } = useCacheManager();
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());
  const [isLoading, setIsLoading] = useState(false);

  const refreshCacheInfo = () => {
    setCacheInfo(getCacheInfo());
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    clearAllCache();
    // clearAllCache ya incluye el reload, no necesitamos hacer nada más
  };

  const handleClearStore = (storeName: string) => {
    clearStoreCache(storeName);
    refreshCacheInfo();
  };

  return (
    <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
          <Database className="h-5 w-5" />
          Gestión de Cache
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshCacheInfo}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado general del cache */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Estado del Cache</span>
          </div>
          <Badge variant={cacheInfo?.isUpToDate ? "default" : "destructive"}>
            {cacheInfo?.isUpToDate ? 'Actualizado' : 'Obsoleto'}
          </Badge>
        </div>

        {/* Información de versión */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Versión actual:</span>
            <p className="font-mono">{cacheInfo?.currentVersion}</p>
          </div>
          <div>
            <span className="text-gray-600">Versión esperada:</span>
            <p className="font-mono">{cacheInfo?.expectedVersion}</p>
          </div>
        </div>

        {/* Lista de stores */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Stores con Cache:</h4>
          <div className="space-y-1">
            {cacheInfo?.stores.map(({ storeName, hasCache }) => (
              <div key={storeName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{storeName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={hasCache ? "default" : "outline"} className="text-xs">
                    {hasCache ? 'Cacheado' : 'Vacío'}
                  </Badge>
                  {hasCache && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearStore(storeName)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón para limpiar todo */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleClearAll}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Limpiando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                🧹 Limpiar Todo el Cache
              </div>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            ⚠️ Esto limpiará el cache para todos los usuarios en sus próximas visitas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
