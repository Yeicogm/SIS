export interface SaveOpenOptions {
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
  suggestedName?: string;
}

export interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): FileSystemWritableFileStream;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | ArrayBuffer | Blob): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showSaveFilePicker(options?: SaveOpenOptions): Promise<FileSystemFileHandle>;
    showOpenFilePicker(options?: SaveOpenOptions): Promise<FileSystemFileHandle[]>;
  }
}
