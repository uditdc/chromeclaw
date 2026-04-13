export async function captureScreenshot(tabId: number): Promise<string> {
  return chrome.tabs.captureVisibleTab(tabId, {
    format: 'jpeg',
    quality: 70,
  })
}
