import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Redirect, useLocation, useParams } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import { ROUTE_PATHS } from 'routes';
import { loadDocumentPreview } from 'services/Document/document-preview-api';
import { DOCUMENT_PREVIEW_CONFIG, DocumentPreviewType } from 'utils/documentPreview';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';

export default function DocumentPreview({
  documentType
}: {
  documentType: DocumentPreviewType;
}): JSX.Element {
  const config = DOCUMENT_PREVIEW_CONFIG[documentType];
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { authReady, getToken, getPermission } = useAuth();
  const hasToken = Boolean(getToken());
  const canView = getPermission().includes(config.permission);
  const language = new URLSearchParams(location.search).get('lang') === 'EN' ? 'EN' : 'TH';
  const fileName = `${id}.pdf`;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = fileName;
    return () => {
      document.title = previousTitle;
    };
  }, [fileName]);

  useEffect(() => {
    if (!authReady || !hasToken || !canView) return;
    let active = true;
    let objectUrl: string | undefined;
    setPdfUrl(null);
    setFailed(false);

    const loadDocument = async () => {
      try {
        const response = await loadDocumentPreview(documentType, id, language);
        if (!active) return;
        const data = response.data as DownloadDocumentResponse;
        const file = data.files?.[0];
        if (!file?.base64) throw new Error('No document');
        objectUrl = URL.createObjectURL(base64ToBlob(file.base64, 'application/pdf'));
        setPdfUrl(objectUrl);
      } catch {
        if (active) setFailed(true);
      }
    };
    void loadDocument();

    // Keep the PDF available for viewing and downloading until this page is closed.
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [authReady, hasToken, canView, id, language, documentType]);

  if (authReady && !hasToken) {
    return <Redirect to={{ pathname: ROUTE_PATHS.LOGIN, state: { from: location } }} />;
  }
  if (authReady && !canView) return <Redirect to={ROUTE_PATHS.FORBIDDEN} />;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: '1px solid #ddd'
        }}>
        <Typography sx={{ flex: 1, overflowWrap: 'anywhere' }}>{fileName}</Typography>
        {pdfUrl && (
          <Button component="a" href={pdfUrl} download={fileName} variant="contained">
            ดาวน์โหลด PDF
          </Button>
        )}
      </Box>
      {pdfUrl ? (
        <iframe
          title={fileName}
          src={`${pdfUrl}#toolbar=0`}
          style={{ flex: 1, minHeight: 0, width: '100%', border: 0 }}
        />
      ) : (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {failed ? (
            <Typography role="alert">
              ไม่สามารถเปิด{config.title}ได้ กรุณาลองใหม่อีกครั้ง
            </Typography>
          ) : (
            <CircularProgress aria-label={`กำลังโหลด${config.title}`} />
          )}
        </Box>
      )}
    </Box>
  );
}
