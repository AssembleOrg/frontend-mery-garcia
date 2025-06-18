'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Download,
  Eye,
} from 'lucide-react';
import { ArchivoAdjunto, UploadConfig } from '@/types/caja';

interface AdjuntarArchivosProps {
  comandaId: string;
  archivosExistentes?: ArchivoAdjunto[];
  onArchivosChange?: (archivos: ArchivoAdjunto[]) => void;
  config?: UploadConfig;
  readonly?: boolean;
}

const configDefault: UploadConfig = {
  maxTamaño: 10, // 10MB
  tiposPermitidos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  maxArchivos: 5,
};

export default function AdjuntarArchivos({
  comandaId,
  archivosExistentes = [],
  onArchivosChange,
  config = configDefault,
  readonly = false,
}: AdjuntarArchivosProps) {
  const [archivos, setArchivos] =
    useState<ArchivoAdjunto[]>(archivosExistentes);
  const [subiendo, setSubiendo] = useState(false);

  const formatearTamaño = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const obtenerIconoArchivo = (tipo: string) => {
    if (tipo === 'pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  };

  const manejarSubidaArchivo = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    setSubiendo(true);

    try {
      // TODO: Implementar cuando esté el backend
      console.log('Subiendo archivos para comanda:', comandaId);
      console.log('Archivos seleccionados:', files);

      // Simulación de subida
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock de archivos subidos
      const nuevosArchivos: ArchivoAdjunto[] = Array.from(files).map(
        (file, index) => ({
          id: `temp-${Date.now()}-${index}`,
          nombre: file.name,
          tipo: file.type.includes('pdf') ? 'pdf' : 'imagen',
          url: URL.createObjectURL(file), // URL temporal
          tamaño: file.size,
          fechaSubida: new Date(),
          descripcion: `Archivo adjunto para comanda ${comandaId}`,
        })
      );

      const archivosActualizados = [...archivos, ...nuevosArchivos];
      setArchivos(archivosActualizados);
      onArchivosChange?.(archivosActualizados);
    } catch (error) {
      console.error('Error al subir archivos:', error);
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarArchivo = async (archivoId: string) => {
    try {
      // TODO: Implementar cuando esté el backend
      console.log('Eliminando archivo:', archivoId);

      const archivosActualizados = archivos.filter(
        (archivo) => archivo.id !== archivoId
      );
      setArchivos(archivosActualizados);
      onArchivosChange?.(archivosActualizados);
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
    }
  };

  const descargarArchivo = (archivo: ArchivoAdjunto) => {
    // TODO: Implementar descarga real cuando esté el backend
    console.log('Descargando archivo:', archivo.nombre);

    // Simulación de descarga
    const link = document.createElement('a');
    link.href = archivo.url;
    link.download = archivo.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previsualizarArchivo = (archivo: ArchivoAdjunto) => {
    // TODO: Implementar previsualización cuando esté el backend
    console.log('Previsualizando archivo:', archivo.nombre);
    window.open(archivo.url, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5" />
          Archivos Adjuntos
          {archivos.length > 0 && (
            <Badge variant="secondary">{archivos.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zona de subida */}
        {!readonly && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label
                htmlFor={`file-upload-${comandaId}`}
                className="cursor-pointer"
              >
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Arrastra archivos aquí o{' '}
                  <span className="text-blue-600 hover:text-blue-500">
                    haz clic para seleccionar
                  </span>
                </span>
              </label>
              <input
                id={`file-upload-${comandaId}`}
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept={config.tiposPermitidos.join(',')}
                onChange={manejarSubidaArchivo}
                disabled={subiendo}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              PDF, PNG, JPG hasta {config.maxTamaño}MB (máx.{' '}
              {config.maxArchivos} archivos)
            </p>
          </div>
        )}

        {/* Lista de archivos */}
        {archivos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Archivos adjuntos ({archivos.length})
            </h4>
            <div className="space-y-2">
              {archivos.map((archivo) => (
                <div
                  key={archivo.id}
                  className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                >
                  <div className="flex items-center space-x-3">
                    {obtenerIconoArchivo(archivo.tipo)}
                    <div className="flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {archivo.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatearTamaño(archivo.tamaño)} •{' '}
                        {archivo.fechaSubida.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previsualizarArchivo(archivo)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => descargarArchivo(archivo)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarArchivo(archivo.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado de subida */}
        {subiendo && (
          <div className="py-4 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">
                Subiendo archivos...
              </span>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay archivos */}
        {archivos.length === 0 && readonly && (
          <div className="py-8 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm">No hay archivos adjuntos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
