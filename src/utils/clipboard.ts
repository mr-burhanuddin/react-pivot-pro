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

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenEl = Element & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const doc = document as FullscreenDoc;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

async function requestFullscreen(element: Element): Promise<boolean> {
  const target = element as FullscreenEl;
  const requester =
    target.requestFullscreen ??
    target.webkitRequestFullscreen ??
    target.mozRequestFullScreen ??
    target.msRequestFullscreen;

  if (!requester) {
    return false;
  }

  await Promise.resolve(requester.call(target));
  return true;
}

async function exitFullscreen(): Promise<boolean> {
  if (!isBrowserEnvironment()) {
    return false;
  }

  const doc = document as FullscreenDoc;
  const exiter =
    document.exitFullscreen ??
    doc.webkitExitFullscreen ??
    doc.mozCancelFullScreen ??
    doc.msExitFullscreen;

  if (!exiter) {
    return false;
  }

  await Promise.resolve(exiter.call(document));
  return true;
}

export const fullscreen: FullscreenApi = {
  isSupported: () => {
    if (!isBrowserEnvironment()) {
      return false;
    }

    const root = document.documentElement as FullscreenEl;
    return Boolean(
      root.requestFullscreen ||
        root.webkitRequestFullscreen ||
        root.mozRequestFullScreen ||
        root.msRequestFullscreen,
    );
  },
  isFullscreen: () => Boolean(getFullscreenElement()),
  getElement: () => getFullscreenElement(),
  request: async (element) => {
    if (!isBrowserEnvironment()) {
      return false;
    }
    return requestFullscreen(element ?? document.documentElement);
  },
  exit: async () => {
    if (!getFullscreenElement()) {
      return true;
    }
    return exitFullscreen();
  },
  toggle: async (element) => {
    if (getFullscreenElement()) {
      return exitFullscreen();
    }
    if (!isBrowserEnvironment()) {
      return false;
    }
    return requestFullscreen(element ?? document.documentElement);
  },
  onChange: (listener) => {
    if (!isBrowserEnvironment()) {
      return () => undefined;
    }

    const handler = () => listener(Boolean(getFullscreenElement()));
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ] as const;

    events.forEach((eventName) => document.addEventListener(eventName, handler));

    return () => {
      events.forEach((eventName) => document.removeEventListener(eventName, handler));
    };
  },
};
