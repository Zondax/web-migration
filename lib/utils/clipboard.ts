/**
 * Copies a string to the clipboard.
 * @param text - The text to copy.
 * @throws Will throw an error if the copy operation fails.
 */
export const copyContent = async (text: string): Promise<{ success: boolean; error?: unknown }> => {
  try {
    await navigator.clipboard.writeText(text.toString())
    return { success: true }
  } catch (err) {
    console.error('Failed to copy content:', err)
    return { success: false, error: err }
  }
}
