import * as vscode from 'vscode';
import { FileStorage, GetConfig } from '@codestate/core';
import * as path from 'path';
import * as fs from 'fs';

export interface SessionRestoreData {
  sessionId: string;
  timestamp: number;
}

export class SessionRestoreUtil {
  /**
   * Checks for pending session restore files and returns the session ID if found
   * @returns Promise<string | null> - Session ID if found, null otherwise
   */
  static async checkForPendingSessionRestore(): Promise<string | null> {
    console.log("SessionRestoreUtil: checkForPendingSessionRestore called");
    
    try {
      // Get the config to find the storage path
      const getConfig = new GetConfig();
      const configResult = await getConfig.execute();
      
      if (!configResult.ok) {
        console.error("SessionRestoreUtil: Failed to get config for session restore check");
        return null;
      }
      
      const config = configResult.value;
      const fileStorage = new FileStorage({
        dataDir: config.storagePath
      });
      const sessionRestoreDir = path.join(config.storagePath, 'temp', 'session-restore');
      
      console.log("SessionRestoreUtil: Check - Full storage path:", config.storagePath);
      console.log("SessionRestoreUtil: Check - Session restore directory:", sessionRestoreDir);
      
      // Check if the directory exists
      const dirExistsResult = await fileStorage.exists('temp/session-restore');
      console.log("SessionRestoreUtil: Directory exists check result:", dirExistsResult);
      if (!dirExistsResult.ok || !dirExistsResult.value) {
        console.log("SessionRestoreUtil: No temp/session-restore directory found");
        return null; // No pending sessions
      }
      
      // List all files in the session-restore directory
      const now = Date.now();
      const oneMinuteAgo = now - (60 * 1000); // 1 minute ago
      
      try {
        // Get all files in the directory using Node.js fs
        const files = fs.readdirSync(sessionRestoreDir);
        console.log("SessionRestoreUtil: Found files in directory:", files);
        
        for (const file of files) {
          if (!file.endsWith('.json')) {
            continue;
          }
          
          const relativePath = `temp/session-restore/${file}`;
          const readResult = await fileStorage.read(relativePath);
        
          if (!readResult.ok) {
            console.error(`SessionRestoreUtil: Failed to read session restore file: ${file}`);
            continue;
          }
          
          try {
            const sessionData: SessionRestoreData = JSON.parse(readResult.value);
            
            // Check if the session data is still valid (less than 1 minute old)
            if (sessionData.timestamp && sessionData.timestamp > oneMinuteAgo && sessionData.sessionId) {
              console.log(`SessionRestoreUtil: Found valid pending session ID: ${sessionData.sessionId}`);
              
              // Delete the file first to prevent duplicate processing
              await fileStorage.delete(relativePath);
              
              return sessionData.sessionId;
            } else {
              // Remove stale file
              console.log(`SessionRestoreUtil: Removing stale session file: ${file}`);
              await fileStorage.delete(relativePath);
            }
          } catch (error) {
            console.error(`SessionRestoreUtil: Failed to parse session data from ${file}:`, error);
            // Remove invalid file
            await fileStorage.delete(relativePath);
          }
        }
      } catch (error) {
        console.error("SessionRestoreUtil: Error reading directory:", error);
      }
    } catch (error) {
      console.error("SessionRestoreUtil: Error checking for pending session restore:", error);
    }
    
    return null; // No valid session found
  }

  /**
   * Stores session ID for later restoration
   * @param sessionId - The session ID to store
   * @returns Promise<boolean> - True if successful, false otherwise
   */
  static async storeSessionForRestore(sessionId: string): Promise<boolean> {
    console.log("SessionRestoreUtil: storeSessionForRestore called with sessionId:", sessionId);
    
    try {
      // Get the config to find the storage path
      const getConfig = new GetConfig();
      const configResult = await getConfig.execute();

      if (!configResult.ok) {
        console.error("SessionRestoreUtil: Failed to get config for session data storage");
        return false;
      }

      const config = configResult.value;
      const fileStorage = new FileStorage({
        dataDir: config.storagePath
      });
      
      console.log("SessionRestoreUtil: Config storage path:", config.storagePath);
        
      const sessionRestoreDir = path.join(config.storagePath, 'temp', 'session-restore');
      console.log("SessionRestoreUtil: Session restore directory:", sessionRestoreDir);
      
      // Ensure the directory exists
      if (!fs.existsSync(sessionRestoreDir)) {
        console.log("SessionRestoreUtil: Creating session restore directory");
        fs.mkdirSync(sessionRestoreDir, { recursive: true });
      }
      
      // Create session data file with just the session ID
      const sessionData: SessionRestoreData = {
        sessionId: sessionId,
        timestamp: Date.now()
      };
      
      const fileName = `session-${Date.now()}.json`;
      const relativePath = `temp/session-restore/${fileName}`;
      
      console.log("SessionRestoreUtil: Writing session ID to:", relativePath);
      console.log("SessionRestoreUtil: Session ID:", sessionId);
      
      const writeResult = await fileStorage.write(relativePath, JSON.stringify(sessionData, null, 2));
      
      if (writeResult.ok) {
        console.log(`SessionRestoreUtil: Successfully stored session ID in ${relativePath}`);
        
        // Verify the file was actually created
        const verifyResult = await fileStorage.exists(relativePath);
        if (verifyResult.ok && verifyResult.value) {
          console.log("SessionRestoreUtil: File creation verified successfully");
          return true;
        } else {
          console.error("SessionRestoreUtil: File creation verification failed");
          return false;
        }
      } else {
        console.error("SessionRestoreUtil: Failed to store session ID:", writeResult.error);
        return false;
      }
    } catch (error) {
      console.error("SessionRestoreUtil: Error storing session for restore:", error);
      return false;
    }
  }
}
