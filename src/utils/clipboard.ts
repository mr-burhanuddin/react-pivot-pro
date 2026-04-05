export interface CopyToClipboardOptions {
  text: string;
  fallbackToExecCommand?: boolean;
}

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

async function fallbackCopyText(text: string): Promise<boolean> {
  if (!isBrowserEnvironment()) {
    return false;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';

  document.body.appendChild(textArea);
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textArea);
  }

  return success;
}

export async function copyToClipboard(options: CopyToClipboardOptions): Promise<boolean> {
  if (!isBrowserEnvironment()) {
    return false;
  }

  const { text, fallbackToExecCommand = true } = options;
  const canUseNavigatorClipboard =
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function';

  if (canUseNavigatorClipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (!fallbackToExecCommand) {
        return false;
      }
    }
  }

  return fallbackToExecCommand ? fallbackCopyText(text) : false;
}
