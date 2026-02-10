// Safe sharing utility to prevent stack overflow errors

let isSharingInProgress = false;

export async function safeShareFile(shareFunction, content, filename, mimeType, dialogTitle) {
  // Prevent concurrent share operations
  if (isSharingInProgress) {
    console.warn('Share already in progress, ignoring duplicate request');
    return;
  }

  isSharingInProgress = true;

  try {
    // Validate inputs
    if (!content || !filename) {
      throw new Error('Invalid share parameters: content and filename are required');
    }

    // Check content size to prevent memory issues
    const contentSize = new Blob([content]).size;
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    if (contentSize > maxSize) {
      throw new Error(`Content too large (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
    }

    console.log(`Sharing file: ${filename} (${(contentSize / 1024).toFixed(2)}KB)`);
    
    // Perform the actual share operation
    const result = await shareFunction(content, filename, mimeType, dialogTitle);
    
    console.log(`Successfully shared: ${filename}`);
    return result;
    
  } catch (error) {
    console.error('Share operation failed:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('stack') || error.message.includes('recursion')) {
      throw new Error('Share operation failed due to data complexity. Try extracting a smaller area.');
    } else if (error.message.includes('size')) {
      throw new Error('Extracted data is too large to share. Try a smaller area.');
    } else {
      throw new Error(`Share failed: ${error.message}`);
    }
    
  } finally {
    isSharingInProgress = false;
  }
}

export function validateShareData(data) {
  if (!data) {
    return { valid: false, error: 'No data to share' };
  }
  
  try {
    // Check if data is serializable
    const serialized = JSON.stringify(data);
    
    // Check size
    const size = new Blob([serialized]).size;
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (size > maxSize) {
      return { valid: false, error: 'Data too large' };
    }
    
    return { valid: true, size };
  } catch (error) {
    return { valid: false, error: 'Data is not serializable' };
  }
}