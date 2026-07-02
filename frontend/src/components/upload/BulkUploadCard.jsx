import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileSpreadsheet, X, RefreshCw } from "lucide-react";
import { ERPButton } from "../ui/ERPButton";

export const BulkUploadCard = ({ file, onUpload, onRemove, isLoading }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm select-none">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
        Upload Order Sheet
      </h3>

      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud
            size={40}
            className={`mb-3 ${isDragActive ? "text-primary-600" : "text-slate-400"}`}
          />

          <p className="text-sm font-bold text-slate-700">
            Drag Excel here or{" "}
            <span className="text-primary-600">Browse Files</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Accepted formats: .xlsx, .xls, .csv (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <FileSpreadsheet size={32} className="text-success-600 mr-4" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {isLoading ? (
              <RefreshCw className="animate-spin text-primary-600" size={20} />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                title="Remove File"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <ERPButton
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={isLoading}
            >
              Replace File
            </ERPButton>
          </div>
        </div>
      )}
    </div>
  );
};
