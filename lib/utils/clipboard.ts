/**
 * Copies a string to the clipboard.
 * @param text - The text to copy.
 * @throws Will throw an error if the copy operation fails.
 */
export const copyContent = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text.toString())
  } catch (err) {
    console.log('Failed to copy content ', err)
    throw err
  }
}
