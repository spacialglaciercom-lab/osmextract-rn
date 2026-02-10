import { writeAsStringAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/**
 * Write content to app cache and open system share sheet.
 * Native only; web uses lib/share.web.js.
 */
export async function shareFile(content, filename, mimeType, dialogTitle) {
  try {
    // Validate inputs
    if (!content || !filename) {
      throw new Error('Content and filename are required');
    }
    
    // Check content size
    const contentSize = new Blob([content]).size;
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    if (contentSize > maxSize) {
      throw new Error(`Content too large (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
    }
    
    console.log(`Sharing file: ${filename} (${(contentSize / 1024).toFixed(2)}KB)`);
    
    // Write to cache
    const filePath = `${cacheDirectory}${filename}`;
    await writeAsStringAsync(filePath, content, { encoding: 'utf8' });
    
    // Check if sharing is available
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error('Share sheet is not available on this device (e.g. simulator). File was saved to app cache.');
    }
    
    // Share the file
    await Sharing.shareAsync(filePath, { mimeType, dialogTitle });
    console.log(`Successfully shared: ${filename}`);
    
  } catch (error) {
    console.error('Native share error:', error);
    throw new Error(`Share failed: ${error.message}`);
  }
}
