import toast from 'react-hot-toast';

function unsecuredCopyToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Unable to copy to clipboard', err);
  }
  document.body.removeChild(textArea);
}

// Hardened, iPhone-safe copy helper
export function copyText(text: string) {
  // Call this directly from a *user gesture* handler with no awaits before it.
  // e.g., onClick={() => copyText(value)}
  if (canUseAsyncClipboard()) {
    navigator
      .clipboard!.writeText(text)
      .then(() => toast.success('Copied!'))
      .catch(() => {
        fallbackCopy(text) ? toast.success('Copied!') : toast.error('Copy failed');
      });
  } else {
    fallbackCopy(text) ? toast.success('Copied!') : toast.error('Copy failed');
  }
}

function canUseAsyncClipboard() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext && // must be HTTPS or localhost
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

function fallbackCopy(text: string): boolean {
  // Create a hidden textarea that iOS can select
  const ta = document.createElement('textarea');
  ta.value = text;

  // Keep it off-screen and non-intrusive, but selectable
  ta.setAttribute('readonly', ''); // prevent mobile keyboard
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  ta.style.fontSize = '16px'; // iOS zoom prevention
  // Selection hints for Safari
  (ta.style as any).webkitUserSelect = 'text';
  ta.style.userSelect = 'text';

  document.body.appendChild(ta);

  // iOS selection dance
  const selection = document.getSelection();
  try {
    selection?.removeAllRanges();
  } catch { }
  ta.focus();
  ta.select();
  // setSelectionRange helps on iOS
  try {
    ta.setSelectionRange(0, ta.value.length);
  } catch { }

  let ok = false;
  try {
    ok = document.execCommand('copy'); // still supported on iOS Safari
  } catch {
    ok = false;
  }

  document.body.removeChild(ta);
  return ok;
}

export function shareViaLine(text: string) {
  const encoded = encodeURIComponent(text);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const lineAppUrl = `line://msg/text/${encoded}`;
  const lineWebUrl = `https://line.me/R/share?text=${encoded}`;

  if (isMobile) {
    // Try open LINE App
    const timeout = setTimeout(() => {
      // Fallback to web if app not opened
      window.location.href = lineWebUrl;
    }, 800);

    window.location.href = lineAppUrl;

    // If browser switches page successfully, timeout won't fire
    window.addEventListener('pagehide', () => clearTimeout(timeout), { once: true });
  } else {
    // Desktop → always use LINE Share Web
    copyText(text);
    window.open(lineWebUrl, '_blank');
  }
}
