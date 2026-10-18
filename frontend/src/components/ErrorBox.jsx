import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ErrorBox({ message, onRetry }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 shadow-xs text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-slate-900 text-base mb-1">
        {t("common.error")}
      </h3>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t("common.retry")}</span>
        </button>
      )}
    </div>
  );
}
