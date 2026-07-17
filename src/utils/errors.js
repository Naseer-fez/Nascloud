const fallbackByContext = {
  download: 'Could not start the download. Please try again.',
  folders: 'Could not load folders right now. Please try again.',
  search: 'Search is unavailable right now.',
  upload: 'Upload failed. Please try again.',
  default: 'Something went wrong. Please try again.',
};

export const friendlyError = (error, context = 'default') => {
  const message = String(error?.message || error || '').trim();
  if (!message) return fallbackByContext[context] || fallbackByContext.default;
  if (/could not reach|could not download|failed to fetch|networkerror|winerror|backend|localhost|http/i.test(message)) {
    return fallbackByContext[context] || fallbackByContext.default;
  }
  if (message.length > 140) return fallbackByContext[context] || fallbackByContext.default;
  return message;
};
