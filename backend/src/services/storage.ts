import * as fs from 'fs';
import * as path from 'path';
import { storage as adminStorage } from '../config/firebase';

export interface IStorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
}

// Local File System Storage Implementation (suitable for Spark/Local Dev)
class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    const uniqueName = `${Date.now()}-${fileName}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    await fs.promises.writeFile(filePath, fileBuffer);
    
    // Returns relative path/URL
    return `/uploads/${uniqueName}`;
  }
}

// Firebase Cloud Storage Implementation
class FirebaseStorageService implements IStorageService {
  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const bucket = adminStorage.bucket();
    const uniqueName = `${Date.now()}-${fileName}`;
    const file = bucket.file(`uploads/${uniqueName}`);

    await file.save(fileBuffer, {
      metadata: { contentType: mimeType },
      public: true,
    });

    return file.publicUrl();
  }
}

// Instantiate based on environment setting
// Default to 'local' to avoid Spark plan restrictions
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

export const storageService: IStorageService =
  STORAGE_TYPE === 'firebase' ? new FirebaseStorageService() : new LocalStorageService();
