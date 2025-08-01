/*
 * Notebook Navigator - Plugin for Obsidian
 * Copyright (c) 2025 Johan Sanneblad
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { FileData } from './IndexedDBStorage';

/**
 * In-memory file cache that mirrors the IndexedDB storage for synchronous access.
 * This cache stores all file data in RAM to enable synchronous reads during rendering,
 * eliminating async operations in React components and fixing virtualizer height calculations.
 *
 * Memory usage is minimal - even 100k files at ~300 bytes each = 30MB RAM.
 */
export class MemoryFileCache {
    private memoryMap: Map<string, FileData> = new Map();
    private isInitialized = false;

    /**
     * Initialize the cache by loading all data from IndexedDB.
     * This is called once during database initialization.
     */
    initialize(filesWithPaths: Array<{ path: string; data: FileData }>): void {
        // Clear any existing data
        this.memoryMap.clear();

        // Load all files into memory
        for (const { path, data } of filesWithPaths) {
            this.memoryMap.set(path, data);
        }

        this.isInitialized = true;
    }

    /**
     * Get file data synchronously.
     */
    getFile(path: string): FileData | null {
        return this.memoryMap.get(path) || null;
    }

    /**
     * Get multiple files synchronously.
     */
    getFiles(paths: string[]): Map<string, FileData> {
        const result = new Map<string, FileData>();
        for (const path of paths) {
            const file = this.memoryMap.get(path);
            if (file) {
                result.set(path, file);
            }
        }
        return result;
    }

    /**
     * Check if a file has preview text.
     */
    hasPreview(path: string): boolean {
        const file = this.memoryMap.get(path);
        return !!file?.preview;
    }

    /**
     * Check if a file exists in the cache.
     */
    hasFile(path: string): boolean {
        return this.memoryMap.has(path);
    }

    /**
     * Get all files as an array (use sparingly).
     */
    getAllFiles(): FileData[] {
        return Array.from(this.memoryMap.values());
    }

    /**
     * Get all files with their paths.
     */
    getAllFilesWithPaths(): Array<{ path: string; data: FileData }> {
        const result: Array<{ path: string; data: FileData }> = [];
        for (const [path, data] of this.memoryMap.entries()) {
            result.push({ path, data });
        }
        return result;
    }

    /**
     * Update or add a file in the cache.
     */
    updateFile(path: string, data: FileData): void {
        this.memoryMap.set(path, data);
    }

    /**
     * Update specific file content fields.
     */
    updateFileContent(
        path: string,
        updates: {
            preview?: string;
            featureImage?: string;
            metadata?: FileData['metadata'];
        }
    ): void {
        const existing = this.memoryMap.get(path);
        if (existing) {
            // Update specific fields
            if (updates.preview !== undefined) existing.preview = updates.preview;
            if (updates.featureImage !== undefined) existing.featureImage = updates.featureImage;
            if (updates.metadata !== undefined) existing.metadata = updates.metadata;
        }
    }

    /**
     * Delete a file from the cache.
     */
    deleteFile(path: string): void {
        this.memoryMap.delete(path);
    }

    /**
     * Batch update multiple files.
     */
    batchUpdate(updates: Array<{ path: string; data: FileData }>): void {
        for (const { path, data } of updates) {
            this.memoryMap.set(path, data);
        }
    }

    /**
     * Batch update file content fields.
     */
    batchUpdateFileContent(
        updates: Array<{
            path: string;
            preview?: string;
            featureImage?: string;
            metadata?: FileData['metadata'];
        }>
    ): void {
        for (const update of updates) {
            this.updateFileContent(update.path, update);
        }
    }

    /**
     * Clear specific content type from all files.
     */
    clearAllFileContent(type: 'preview' | 'featureImage' | 'metadata' | 'all'): void {
        for (const file of this.memoryMap.values()) {
            if (type === 'all' || type === 'preview') file.preview = null;
            if (type === 'all' || type === 'featureImage') file.featureImage = null;
            if (type === 'all' || type === 'metadata') file.metadata = null;
        }
    }

    /**
     * Get cache statistics.
     */
    getStats(): { fileCount: number; memoryUsageEstimate: number } {
        const fileCount = this.memoryMap.size;

        // Rough estimate: 300 bytes per file
        const memoryUsageEstimate = fileCount * 300;

        return { fileCount, memoryUsageEstimate };
    }

    /**
     * Check if cache is initialized.
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Clear the entire cache (used during cleanup).
     */
    clear(): void {
        this.memoryMap.clear();
        this.isInitialized = false;
    }
}
