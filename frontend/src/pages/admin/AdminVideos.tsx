import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { ScenarioVideo } from '../../types';
import {
  Video,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Clock,
  HardDrive
} from 'lucide-react';

export const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<ScenarioVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload State
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.listVideos();
      setVideos(data);
    } catch (err) {
      setError('Failed to fetch video slots.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFileUpload = async (videoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(videoId);
    setUploadSuccess('');
    setUploadError('');

    try {
      await adminApi.uploadVideo(videoId, file);
      setUploadSuccess(`Video uploaded successfully (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      fetchVideos();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Video upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Scenario Videos Management
        </h1>
        <p className="text-sm text-slate-500">
          Upload and manage the 8 Unity-rendered MP4 video assets (2 levels per scenario category).
        </p>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-100">
                  Level {v.level}
                </span>

                {v.has_video_file ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Asset Ready
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting Upload
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{v.title}</h3>
                {v.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Duration: {Math.round(v.duration_seconds / 60)} mins
                </span>
                {v.file_size > 0 && (
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" /> {(v.file_size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <div className="pt-3 border-t border-slate-100">
              <label className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/40 rounded-xl text-xs font-semibold text-slate-700 hover:text-teal-900 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <UploadCloud className="w-4 h-4 text-teal-600" />
                <span>
                  {uploadingId === v.id
                    ? 'Uploading MP4...'
                    : v.has_video_file
                    ? 'Replace Video File (.mp4)'
                    : 'Upload Unity Video (.mp4)'}
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  disabled={uploadingId === v.id}
                  onChange={(e) => handleFileUpload(v.id, e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
