import fs from 'fs';
import path from 'path';

export interface StorageProvider {
  saveFile(file: Express.Multer.File, subDir?: string): Promise<{ fileKey: string; fileUrl: string; fileSize: number; mimeType: string }>;
  deleteFile(fileKey: string): Promise<boolean>;
  getFilePath(fileKey: string): string | null;
  fileExists(fileKey: string): boolean;
}

export class LocalDiskStorageProvider implements StorageProvider {
  private baseUploadDir: string;

  constructor(customUploadDir?: string) {
    this.baseUploadDir = customUploadDir || path.resolve(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.baseUploadDir);
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'documents'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'avatars'));
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  public async saveFile(
    file: Express.Multer.File,
    subDir: string = 'documents'
  ): Promise<{ fileKey: string; fileUrl: string; fileSize: number; mimeType: string }> {
    const targetDir = path.join(this.baseUploadDir, subDir);
    this.ensureDirectoryExists(targetDir);

    // file is already written to disk by multer diskStorage
    const fileKey = `${subDir}/${path.basename(file.path)}`;
    const fileUrl = `/api/student/documents/raw/${path.basename(file.path)}`;

    return {
      fileKey,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  public async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseUploadDir, fileKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  public getFilePath(fileKey: string): string | null {
    const fullPath = path.join(this.baseUploadDir, fileKey);
    // Path traversal check
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(this.baseUploadDir))) {
      return null;
    }
    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  }

  public fileExists(fileKey: string): boolean {
    const filePath = this.getFilePath(fileKey);
    return filePath !== null && fs.existsSync(filePath);
  }
}

export const storageService = new LocalDiskStorageProvider();
