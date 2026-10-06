// @vitest-environment node
import { createServer } from 'vite';
import { matchPath } from 'react-router-dom';
import { expect, it } from 'vitest';
import {
  DOCUMENT_PREVIEW_CONFIG,
  DocumentPreviewType,
  getDocumentPreviewUrl
} from 'utils/documentPreview';

it('serves the document URL as an app page on a direct visit from a new tab', async () => {
  const server = await createServer({
    configFile: false,
    appType: 'spa',
    server: { host: '127.0.0.1', port: 0, preTransformRequests: false },
    optimizeDeps: { disabled: true }
  });

  try {
    await server.listen();
    const origin = server.resolvedUrls!.local[0];
    for (const type of Object.keys(DOCUMENT_PREVIEW_CONFIG) as DocumentPreviewType[]) {
      const path = getDocumentPreviewUrl(type, 'NTL-2026090048');
      const response = await fetch(new URL(path, origin), {
        headers: { Accept: 'text/html' }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(await response.text()).toContain('id="root"');
      expect(
        matchPath<{ id: string }>(new URL(path, origin).pathname, {
          path: DOCUMENT_PREVIEW_CONFIG[type].path,
          exact: true
        })?.params.id
      ).toBe('NTL-2026090048');
    }
  } finally {
    await server.close();
  }
});
