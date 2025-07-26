// services/globalRecordingStorage.ts
export interface RecordingChunk {
    id: string;
    sessionId: string;
    chunk: Blob;
    timestamp: number;
    sequenceNumber: number;
  }
  
  export interface ActiveRecordingSession {
    sessionId: string;
    projectId: number;
    startTime: number;
    lastChunkTime: number;
    totalChunks: number;
    mimeType: string;
    name?: string;
    description?: string;
    isActive: boolean;
  }
  
  class GlobalRecordingStorageService {
    private dbName = 'GlobalRecordingDB';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;
  
    private chunksStore = 'recording_chunks';
    private sessionsStore = 'recording_sessions';
  
    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<void> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
  
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
  
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
  
          // Create chunks store
          if (!db.objectStoreNames.contains(this.chunksStore)) {
            const chunksStore = db.createObjectStore(this.chunksStore, { keyPath: 'id' });
            chunksStore.createIndex('sessionId', 'sessionId', { unique: false });
            chunksStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
  
          // Create sessions store
          if (!db.objectStoreNames.contains(this.sessionsStore)) {
            const sessionsStore = db.createObjectStore(this.sessionsStore, { keyPath: 'sessionId' });
            sessionsStore.createIndex('projectId', 'projectId', { unique: false });
            sessionsStore.createIndex('isActive', 'isActive', { unique: false });
          }
        };
      });
    }
  
    /**
     * Ensure database is initialized
     */
    private async ensureDB(): Promise<IDBDatabase> {
      if (!this.db) {
        await this.init();
      }
      return this.db!;
    }
  
    /**
     * Start a new recording session
     */
    async startRecordingSession(projectId: number, mimeType: string): Promise<string> {
      const db = await this.ensureDB();
      const sessionId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: ActiveRecordingSession = {
        sessionId,
        projectId,
        startTime: Date.now(),
        lastChunkTime: Date.now(),
        totalChunks: 0,
        mimeType,
        isActive: true,
      };
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.sessionsStore], 'readwrite');
        const store = transaction.objectStore(this.sessionsStore);
        
        const request = store.add(session);
        request.onsuccess = () => resolve(sessionId);
        request.onerror = () => reject(request.error);
      });
    }
  
    /**
     * Save a recording chunk
     */
    async saveRecordingChunk(
      sessionId: string, 
      chunk: Blob, 
      sequenceNumber: number
    ): Promise<void> {
      const db = await this.ensureDB();
      const timestamp = Date.now();
      
      const chunkData: RecordingChunk = {
        id: `${sessionId}_chunk_${sequenceNumber}`,
        sessionId,
        chunk,
        timestamp,
        sequenceNumber,
      };
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.chunksStore, this.sessionsStore], 'readwrite');
        
        // Save chunk
        const chunksStore = transaction.objectStore(this.chunksStore);
        const chunkRequest = chunksStore.add(chunkData);
        
        // Update session metadata
        const sessionsStore = transaction.objectStore(this.sessionsStore);
        const sessionRequest = sessionsStore.get(sessionId);
        
        sessionRequest.onsuccess = () => {
          const session = sessionRequest.result as ActiveRecordingSession;
          if (session) {
            session.lastChunkTime = timestamp;
            session.totalChunks = sequenceNumber + 1;
            sessionsStore.put(session);
          }
        };
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  
    /**
     * Get active recording session
     */
    async getActiveRecording(sessionId: string): Promise<ActiveRecordingSession | null> {
      const db = await this.ensureDB();
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.sessionsStore], 'readonly');
        const store = transaction.objectStore(this.sessionsStore);
        const request = store.get(sessionId);
  
        request.onsuccess = () => {
          const session = request.result as ActiveRecordingSession | undefined;
          // Return session only if it exists and is active
          resolve(session && session.isActive ? session : null);
        };
        request.onerror = () => reject(request.error);
      });
    }
  
    /**
     * Get all recording chunks for a session
     */
    async getRecordingChunks(sessionId: string): Promise<RecordingChunk[]> {
      const db = await this.ensureDB();
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.chunksStore], 'readonly');
        const store = transaction.objectStore(this.chunksStore);
        const index = store.index('sessionId');
        const request = index.getAll(sessionId);
  
        request.onsuccess = () => {
          const chunks = request.result as RecordingChunk[];
          // Sort by sequence number
          chunks.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
          resolve(chunks);
        };
        request.onerror = () => reject(request.error);
      });
    }
  
    /**
     * Combine all chunks into a single blob with Safari validation
     */
    async getCompleteRecording(sessionId: string): Promise<{ blob: Blob; session: ActiveRecordingSession } | null> {
      const [session, chunks] = await Promise.all([
        this.getActiveRecording(sessionId),
        this.getRecordingChunks(sessionId)
      ]);
  
      if (!session || chunks.length === 0) {
        console.log('No session or chunks found:', { session: !!session, chunksCount: chunks.length });
        return null;
      }
  
      console.log('Combining chunks:', { 
        totalChunks: chunks.length, 
        mimeType: session.mimeType,
        chunkSizes: chunks.map(c => c.chunk.size)
      });
  
      const chunkBlobs = chunks.map(chunk => chunk.chunk);
      
      // Validate chunks before combining (Safari fix)
      const validChunks = [];
      for (let i = 0; i < chunkBlobs.length; i++) {
        const chunk = chunkBlobs[i];
        try {
          const buffer = await chunk.arrayBuffer();
          if (buffer.byteLength > 0) {
            validChunks.push(chunk);
            console.log(`Chunk ${i}: Valid (${buffer.byteLength} bytes)`);
          } else {
            console.warn(`Chunk ${i}: Empty buffer (Safari issue)`);
          }
        } catch (error) {
          console.error(`Chunk ${i}: Validation failed`, error);
        }
      }
  
      if (validChunks.length === 0) {
        console.error('No valid chunks found after validation');
        return null;
      }
  
      console.log(`Using ${validChunks.length}/${chunkBlobs.length} valid chunks`);
  
      // Create blob with validated chunks
      const completeBlob = new Blob(validChunks, { type: session.mimeType });
      
      console.log('Final blob created:', { 
        size: completeBlob.size, 
        type: completeBlob.type,
        validChunksUsed: validChunks.length 
      });
  
      // Final validation: Check if combined blob has data
      try {
        const finalBuffer = await completeBlob.arrayBuffer();
        if (finalBuffer.byteLength === 0) {
          console.error('Final blob is empty after combination');
          return null;
        }
        console.log('Final blob validation passed:', finalBuffer.byteLength, 'bytes');
      } catch (error) {
        console.error('Final blob validation failed:', error);
        return null;
      }
  
      return { blob: completeBlob, session };
    }
  
    /**
     * Update session metadata (name, description)
     */
    async updateSessionMetadata(
      sessionId: string, 
      updates: Partial<Pick<ActiveRecordingSession, 'name' | 'description'>>
    ): Promise<void> {
      const db = await this.ensureDB();
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.sessionsStore], 'readwrite');
        const store = transaction.objectStore(this.sessionsStore);
        
        const getRequest = store.get(sessionId);
        getRequest.onsuccess = () => {
          const session = getRequest.result as ActiveRecordingSession;
          if (session) {
            Object.assign(session, updates);
            const putRequest = store.put(session);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            reject(new Error('Session not found'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    }
  
    /**
     * Mark session as completed/inactive
     */
    async completeRecordingSession(sessionId: string): Promise<void> {
      const db = await this.ensureDB();
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.sessionsStore], 'readwrite');
        const store = transaction.objectStore(this.sessionsStore);
        
        const getRequest = store.get(sessionId);
        getRequest.onsuccess = () => {
          const session = getRequest.result as ActiveRecordingSession;
          if (session) {
            session.isActive = false;
            const putRequest = store.put(session);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve(); // Session doesn't exist, consider it completed
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    }
  
    /**
     * Clean up recording data (delete chunks and session)
     */
    async cleanupRecording(sessionId: string): Promise<void> {
      const db = await this.ensureDB();
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.chunksStore, this.sessionsStore], 'readwrite');
        
        // Delete all chunks
        const chunksStore = transaction.objectStore(this.chunksStore);
        const chunksIndex = chunksStore.index('sessionId');
        const chunksCursor = chunksIndex.openCursor(sessionId);
        
        chunksCursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
  
        // Delete session
        const sessionsStore = transaction.objectStore(this.sessionsStore);
        sessionsStore.delete(sessionId);
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  
    /**
     * Get all active recording sessions (for recovery)
     */
    async getActiveRecordingSessions(): Promise<ActiveRecordingSession[]> {
      const db = await this.ensureDB();
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.sessionsStore], 'readonly');
        const store = transaction.objectStore(this.sessionsStore);
        const request = store.getAll();
  
        request.onsuccess = () => {
          const allSessions = request.result as ActiveRecordingSession[];
          // Filter active sessions in JavaScript instead of using index
          const activeSessions = allSessions.filter(session => session.isActive === true);
          resolve(activeSessions);
        };
        request.onerror = () => reject(request.error);
      });
    }
  
    /**
     * Calculate recording duration from chunks and session metadata
     */
    async getRecordingDuration(sessionId: string): Promise<number> {
      const session = await this.getActiveRecording(sessionId);
      if (!session) return 0;
  
      // If session is still active, calculate from start time to last chunk time
      if (session.isActive && session.totalChunks > 0) {
        return Math.floor((session.lastChunkTime - session.startTime) / 1000);
      }
  
      // If session is completed, calculate total duration
      return Math.floor((session.lastChunkTime - session.startTime) / 1000);
    }
  
    /**
     * Check if storage quota is available
     */
    async checkStorageQuota(): Promise<{ available: number; used: number; quota: number }> {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          available: (estimate.quota || 0) - (estimate.usage || 0),
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      }
      return { available: 0, used: 0, quota: 0 };
    }
  }
  
  // Export singleton instance
  export const GlobalRecordingStorage = new GlobalRecordingStorageService();