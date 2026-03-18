import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPeriodos, uploadExcel } from '../api/client'
import { useNavigate } from 'react-router-dom'
import type { UploadResponse } from '../types'
import {
  FileUp,
  FileSpreadsheet,
  CalendarRange,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
} from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [periodoId, setPeriodoId] = useState<number | ''>('')
  const [dragOver, setDragOver] = useState(false)

  const { data: periodos, isLoading: loadingPeriodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: getPeriodos,
  })

  const mutation = useMutation({
    mutationFn: () => uploadExcel(file!, periodoId as number),
    onSuccess: (data: UploadResponse) => {
      navigate(`/analisis/${data.analisis_id}`)
    },
  })

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0])
  }

  const canSubmit = file && periodoId !== '' && !mutation.isPending

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-upds-navy tracking-tight">
          Cargar Archivo
        </h1>
        <p className="text-sm text-upds-graphite mt-1">
          Sube el archivo Excel de matriculados para generar el análisis
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Period selector */}
        <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-card border border-upds-fog/80 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-upds-navy/[0.07] flex items-center justify-center">
              <CalendarRange className="w-4 h-4 text-upds-navy" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-upds-navy">Período académico</h2>
              <p className="text-xs text-upds-steel">Selecciona el período para este análisis</p>
            </div>
          </div>

          {loadingPeriodos ? (
            <div className="h-10 bg-upds-fog rounded-lg animate-pulse" />
          ) : (
            <select
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-upds-fog rounded-xl px-4 py-2.5 text-sm text-upds-ink bg-upds-ice/50 focus:outline-none focus:ring-2 focus:ring-upds-celeste/30 focus:border-upds-celeste transition-all"
            >
              <option value="">Seleccionar período...</option>
              {periodos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.activo ? '(activo)' : ''}
                </option>
              ))}
            </select>
          )}

          {!periodos?.length && !loadingPeriodos && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-accent-amber-pale/60">
              <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />
              <p className="text-xs text-accent-amber font-medium">
                No hay períodos creados. Ve a Configuración para crear uno.
              </p>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`
            animate-fade-in-up stagger-2 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
            transition-all duration-300 relative overflow-hidden
            ${dragOver
              ? 'border-upds-celeste bg-upds-celeste-pale/40 scale-[1.01]'
              : file
                ? 'border-accent-emerald/40 bg-accent-emerald-pale/20'
                : 'border-upds-fog bg-white hover:border-upds-celeste/40 hover:bg-upds-celeste-ghost/30'
            }
          `}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file ? (
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-accent-emerald-pale flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-accent-emerald" />
              </div>
              <p className="text-base font-semibold text-upds-navy">{file.name}</p>
              <p className="text-sm text-upds-steel mt-1 tabular-nums">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-rose bg-accent-rose-pale/60 hover:bg-accent-rose-pale transition-colors"
              >
                <X className="w-3 h-3" />
                Quitar archivo
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-2xl bg-upds-celeste-pale/60 flex items-center justify-center mx-auto mb-4">
                <FileUp className="w-7 h-7 text-upds-celeste" />
              </div>
              <p className="text-base font-semibold text-upds-navy">
                Arrastra tu archivo Excel aquí
              </p>
              <p className="text-sm text-upds-steel mt-1.5">
                o haz clic para seleccionar
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-upds-fog/60 text-[11px] font-medium text-upds-steel">
                  <FileSpreadsheet className="w-3 h-3" />
                  .xlsx
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-upds-fog/60 text-[11px] font-medium text-upds-steel">
                  <FileSpreadsheet className="w-3 h-3" />
                  .xls
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className={`
            animate-fade-in-up stagger-3 w-full py-3.5 rounded-xl text-sm font-semibold
            transition-all duration-200 flex items-center justify-center gap-2
            ${canSubmit
              ? 'bg-upds-navy text-white hover:bg-upds-navy-light shadow-elevated hover:shadow-card-hover active:scale-[0.99]'
              : 'bg-upds-fog text-upds-steel cursor-not-allowed'
            }
          `}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando archivo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Subir y Analizar
            </>
          )}
        </button>

        {/* Error */}
        {mutation.isError && (
          <div className="animate-fade-in-up flex items-start gap-3 p-4 rounded-xl bg-accent-rose-pale/40 border border-accent-rose/20">
            <AlertTriangle className="w-4 h-4 text-accent-rose mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-accent-rose">Error al procesar</p>
              <p className="text-xs text-accent-rose/70 mt-0.5">
                {(mutation.error as any)?.response?.data?.detail
                  || (mutation.error as Error).message
                  || 'Error desconocido al procesar el archivo'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
