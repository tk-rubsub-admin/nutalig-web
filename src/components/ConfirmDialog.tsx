import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContentText,
  DialogContent,
  Button
} from '@mui/material';
import ManualHelpButton from 'pages/Manual/ManualHelpButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  htmlContent?: string;
  confirmText?: string;
  cancelText?: string;
  manualId?: string;
  isShowCancelButton: boolean;
  isShowConfirmButton: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export default function ConfirmDialog(props: ConfirmDialogProps): JSX.Element {
  const {
    open,
    title,
    message,
    htmlContent,
    confirmText,
    cancelText,
    manualId,
    isShowCancelButton,
    isShowConfirmButton,
    onConfirm,
    onCancel,
    children
  } = props;

  return (
    <Dialog open={open} disableEnforceFocus fullWidth aria-labelledby="form-dialog-title">
      {/* <DialogTitle id="form-dialog-title">{title}</DialogTitle> */}
      <DialogTitle
        id="form-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1
        }}>
        {title}

        {manualId && manualId !== '' && <ManualHelpButton manualId={manualId} />}
      </DialogTitle>
      <DialogContent>
        {children ? (
          children
        ) : (
          <DialogContentText>
            {htmlContent ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} /> : message}
          </DialogContentText>
        )}
        <DialogActions>
          {isShowCancelButton ? (
            <Button
              onClick={onCancel}
              className="btn-crimson-red"
              variant="contained"
              aria-label="cancel">
              {cancelText || 'Cancel'}
            </Button>
          ) : (
            ''
          )}
          {isShowConfirmButton ? (
            <Button
              onClick={onConfirm}
              className="btn-emerald-green"
              variant="contained"
              aria-label="confirm">
              {confirmText || 'Confirm'}
            </Button>
          ) : (
            ''
          )}
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
