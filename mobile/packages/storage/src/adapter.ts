import * as FileSystem from 'expo-file-system/legacy';
import { StorageAdapter } from './types';

class FileStorageAdapter implements StorageAdapter {
  private cache: Record<string, string> = {};
  private isLoaded = false;
  private filePath: string | null = null;

  private getFilePath(): string | null {
    if (!this.filePath && FileSystem.documentDirectory) {
      this.filePath = `${FileSystem.documentDirectory}cscrs_store.json`;
    }
    return this.filePath;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    const path = this.getFilePath();
    if (!path) {
      this.isLoaded = true;
      return;
    }

    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(path);
        this.cache = JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to load local storage from file, using fallback cache:', error);
    } finally {
      this.isLoaded = true;
    }
  }

  private async persist(): Promise<void> {
    const path = this.getFilePath();
    if (!path) return;

    try {
      const serialized = JSON.stringify(this.cache);
      await FileSystem.writeAsStringAsync(path, serialized);
    } catch (error) {
      console.warn('Failed to persist local storage to file:', error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.ensureLoaded();
    return this.cache[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.ensureLoaded();
    this.cache[key] = value;
    await this.persist();
  }

  async removeItem(key: string): Promise<void> {
    await this.ensureLoaded();
    delete this.cache[key];
    await this.persist();
  }

  async clear(): Promise<void> {
    this.cache = {};
    this.isLoaded = true;
    const path = this.getFilePath();
    if (path) {
      try {
        await FileSystem.deleteAsync(path, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete storage file during clear:', error);
      }
    }
  }
}

export const defaultStorage: StorageAdapter = new FileStorageAdapter();
