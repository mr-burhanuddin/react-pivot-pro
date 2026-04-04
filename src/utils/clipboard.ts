export interface CopyToClipboardOptions {
  text: string;
  fallbackToExecCommand?: boolean;
}

export interface FullscreenApi {
  isSupported: () => boolean;
  isFullscreen: () => boolean;
  getElement: () => Element | null;
  request: (element?: Element) => Promise<boolean>;
  exit: () => Promise<boolean>;
  toggle: (element?: Element) => Promise<boolean>;
  onChange: (listener: (isFullscreen: boolean) => void) => () => void;
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

function getFullscreenElement(): Element | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const doc = document as any;
  
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

function getFullscreenEnabled(): boolean {
  if (!isBrowserEnvironment()) {
    return false;
  }

  const doc = document as any;
  
  return (
    doc.fullscreenEnabled ??
    doc.webkitFullscreenEnabled ??
    doc.mozFullScreenEnabled ??
    doc.msFullscreenEnabled ??
    false
  );
}

function requestFullscreenOnElement(element: Element): Promise<void> {
  const el = element as any;
  
  if (el.requestFullscreen) {
    return el.requestFullscreen();
  }
  
  if (el.webkitRequestFullscreen) {
    return el.webkitRequestFullscreen();
  }
  
  if (el.mozRequestFullScreen) {
    return el.mozRequestFullScreen();
  }
  
  if (el.msRequestFullscreen) {
    return el.msRequestFullscreen();
  }
  
  return Promise.reject(new Error('Fullscreen not supported'));
}

function exitFullscreenDocument(): Promise<void> {
  const doc = document as any;
  
  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  }
  
  if (doc.webkitExitFullscreen) {
    return doc.webkitExitFullscreen();
  }
  
  if (doc.mozCancelFullScreen) {
    return doc.mozCancelFullScreen();
  }
  
  if (doc.msExitFullscreen) {
    return doc.msExitFullscreen();
  }
  
  return Promise.reject(new Error('Exit fullscreen not supported'));
}

export const fullscreen: FullscreenApi = {
  isSupported: () => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    return getFullscreenEnabled();
  },
  
  isFullscreen: () => {
    return getFullscreenElement() !== null;
  },
  
  getElement: () => {
    return getFullscreenElement();
  },
  
  request: async (element) => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    
    const target = element ?? document.documentElement;
    
    if (!getFullscreenEnabled()) {
      return false;
    }
    
    try {
      await requestFullscreenOnElement(target);
      return true;
    } catch {
      return false;
    }
  },
  
  exit: async () => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    
    if (!getFullscreenElement()) {
      return true;
    }
    
    try {
      await exitFullscreenDocument();
      return true;
    } catch {
      return false;
    }
  },
  
  toggle: async (element) => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    
    if (getFullscreenElement()) {
      return fullscreen.exit();
    }
    
    return fullscreen.request(element);
  },
  
  onChange: (listener) => {
    if (!isBrowserEnvironment()) {
      return () => {};
    }

    const handler = () => {
      listener(getFullscreenElement() !== null);
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    events.forEach((eventName) => {
      document.addEventListener(eventName, handler);
    });

    return () => {
      events.forEach((eventName) => {
        document.removeEventListener(eventName, handler);
      });
    };
  },
};
