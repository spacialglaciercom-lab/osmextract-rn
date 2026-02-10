/**
 * Web: trigger browser download (no Expo file system or sharing).
 * Metro resolves this when building for web.
 */
export async function shareFile(content, filename, mimeType) {
  try {
    // Validate inputs
    if (!content || !filename) {
      throw new Error('Content and filename are required');
    }
    
    // Check content size (warn for large files)
    const contentSize = new Blob([content]).size;
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (contentSize > maxSize) {
      throw new Error(`Content too large (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
    }
    
    console.log(`Creating download: ${filename} (${(contentSize / 1024).toFixed(2)}KB)`);
    
    // Create blob and download link
    const blob = new Blob([content], { type: mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // Use setTimeout to prevent potential stack issues
    setTimeout(() => {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
        console.log(`Download completed: ${filename}`);
      }, 100);
    }, 0);
    
  } catch (error) {
    console.error('Web share error:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
}
