'use client';

import { CheckCircle, FileText, Loader2, Upload, X } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@feature/ui/components/ui/common/button';
import { Card } from '@feature/ui/components/ui/common/card';
import { Progress } from '@feature/ui/components/ui/common/progress';
import { Separator } from '@feature/ui/components/ui/common/separator';
import { logger } from '@next-feature/logging';
import { importCsv, ImportSummaryResponse } from '@feature/backend/server';

const log = logger.child({ module: 'schedule-import' });

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  summary?: ImportSummaryResponse;
  error?: string;
}

export default function ScheduleImport() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const filePickerRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    filePickerRef.current?.click();
  };

  const uploadFile = (file: File) => {
    const id = crypto.randomUUID();

    setUploads((current) => [
      ...current,
      { id, name: file.name, progress: 40, status: 'uploading' },
    ]);

    importCsv(file)
      .then((response) => {
        if (!response.success) {
          throw response.error ?? new Error(response.message);
        }

        setUploads((current) =>
          current.map((upload) =>
            upload.id === id
              ? {
                  ...upload,
                  progress: 100,
                  status: 'completed',
                  summary: response.data,
                }
              : upload,
          ),
        );
      })
      .catch((error) => {
        log.error(`Failed to import ${file.name}\n'${error.message}'`);
        toast.error(`Failed to import ${file.name}`, {
          description: error?.message,
        });
        setUploads((current) =>
          current.map((upload) =>
            upload.id === id
              ? {
                  ...upload,
                  progress: 100,
                  status: 'error',
                  error: error?.message ?? 'Import failed',
                }
              : upload,
          ),
        );
      });
  };

  const uploadFiles = (files: FileList) => {
    Array.from(files).forEach(uploadFile);
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles?.length) {
      uploadFiles(selectedFiles);
    }
    event.target.value = '';
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles?.length) {
      uploadFiles(droppedFiles);
    }
  };

  const removeUploadById = (id: string) => {
    setUploads((current) => current.filter((file) => file.id !== id));
  };

  const activeUploads = uploads.filter((file) => file.status === 'uploading');
  const finishedUploads = uploads.filter((file) => file.status !== 'uploading');

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-y-6">
      <Card
        className="group flex max-h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-4 border-dashed py-8 text-sm shadow-none transition-colors hover:bg-muted/50"
        onClick={openFilePicker}
        onDragOver={onDragOver}
        onDrop={onDropFiles}
      >
        <div className="grid space-y-3">
          <div className="flex items-center gap-x-2 text-muted-foreground">
            <Upload className="size-5" />
            <div>
              Drop files here or{' '}
              <Button
                className="h-auto p-0 font-normal text-primary"
                onClick={openFilePicker}
                variant="link"
              >
                browse files
              </Button>{' '}
              to add
            </div>
          </div>
        </div>
        <input
          accept="text/csv,.csv"
          className="hidden"
          multiple
          onChange={onFileInputChange}
          ref={filePickerRef}
          type="file"
        />
        <span className="mt-2 block text-base/6 text-muted-foreground group-disabled:opacity-50 sm:text-xs">
          Supported: CSV
        </span>
      </Card>

      <div className="flex flex-col gap-y-4">
        {activeUploads.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center text-balance font-mono font-normal text-foreground text-lg uppercase sm:text-xs">
              <Loader2 className="mr-1 size-4 animate-spin" />
              Uploading
            </h2>
            <div className="-mt-2 divide-y">
              {activeUploads.map((file) => (
                <div className="group flex items-center py-4" key={file.id}>
                  <div className="mr-3 grid size-10 shrink-0 place-content-center rounded border bg-muted">
                    <FileText className="inline size-4 group-hover:hidden" />
                    <Button
                      aria-label="Cancel"
                      className="hidden size-4 h-auto p-0 group-hover:inline"
                      onClick={() => removeUploadById(file.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="mb-1 flex w-full flex-col">
                    <div className="flex justify-between gap-2">
                      <span className="select-none text-base/6 text-foreground group-disabled:opacity-50 sm:text-sm/6">
                        {file.name}
                      </span>
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {file.progress}%
                      </span>
                    </div>
                    <Progress
                      className="mt-1 h-2 min-w-64"
                      value={file.progress}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeUploads.length > 0 && finishedUploads.length > 0 && (
          <Separator className="my-0" />
        )}

        {finishedUploads.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center text-balance font-mono font-normal text-foreground text-lg uppercase sm:text-xs">
              <CheckCircle className="mr-1 size-4" />
              Finished
            </h2>
            <div className="-mt-2 divide-y">
              {finishedUploads.map((file) => (
                <div className="group flex items-center py-4" key={file.id}>
                  <div className="mr-3 grid size-10 shrink-0 place-content-center rounded border bg-muted">
                    <FileText className="inline size-4 group-hover:hidden" />
                    <Button
                      aria-label="Remove"
                      className="hidden size-4 h-auto p-0 group-hover:inline"
                      onClick={() => removeUploadById(file.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="mb-1 flex w-full flex-col">
                    <div className="flex justify-between gap-2">
                      <span className="select-none text-base/6 text-foreground group-disabled:opacity-50 sm:text-sm/6">
                        {file.name}
                      </span>
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {file.status === 'error'
                          ? 'Failed'
                          : `${file.summary?.imported ?? 0} imported, ${file.summary?.updated ?? 0} updated`}
                      </span>
                    </div>
                    {file.status === 'error' ? (
                      <span className="text-destructive text-xs">
                        {file.error}
                      </span>
                    ) : (
                      <Progress
                        className="mt-1 h-2 min-w-64"
                        value={file.progress}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
