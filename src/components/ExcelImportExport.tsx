import React, { useRef, useState } from 'react';
import { ExpertCandidate } from '../types';
import { parseExcelFile, exportExpertsToExcel, downloadApmExcelTemplate } from '../utils/excel';
import { INITIAL_EXPERTS } from '../data/sampleExperts';
import { FileSpreadsheet, Download, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExcelImportExportProps {
  candidates: ExpertCandidate[];
  onImportSuccess: (imported: ExpertCandidate[]) => void;
  onResetCohort: () => void;
}

export const ExcelImportExport: React.FC<ExcelImportExportProps> = ({
  candidates,
  onImportSuccess,
  onResetCohort,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);
    setFeedback(null);

    try {
      const parsed = await parseExcelFile(file);
      onImportSuccess(parsed);
      setFeedback({
        type: 'success',
        message: `${parsed.length} candidature(s) d'experts importée(s) avec succès depuis « ${file.name} » !`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la lecture du fichier Excel.',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportExpertsToExcel(candidates, `Decisions_Selection_Experts_APM_${timestamp}.xlsx`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">
              Intégration & Traitement des Fichiers Excel APM
            </h3>
            <p className="text-xs text-slate-500">
              Importez vos fichiers de candidatures d'experts ou exportez la grille de décision enrichie.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isProcessing ? 'Lecture Excel...' : 'Importer un Excel (.xlsx)'}
          </button>

          {/* Template Download */}
          <button
            onClick={downloadApmExcelTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            title="Télécharger la maquette Excel APM avec les colonnes adaptées"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Modèle Excel Vierge
          </button>

          {/* Reset sample cohort */}
          <button
            onClick={onResetCohort}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            title="Recharger le jeu de données d'experts témoins"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Dossiers Témoins APM
          </button>

          {/* Export evaluated Excel */}
          <button
            onClick={handleExport}
            disabled={candidates.length === 0}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Exporter Résultats (.xlsx)
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
