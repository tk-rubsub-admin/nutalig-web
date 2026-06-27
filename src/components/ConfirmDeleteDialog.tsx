import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContentText,
  DialogContent,
  Button
} from '@mui/material';
import { makeStyles } from '@mui/styles';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  titleBold?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function ConfirmDeleteDialog(props: ConfirmDeleteDialogProps): JSX.Element {
  const useStyles = makeStyles({
    red: {
      color: 'red'
    }
  });
  const classes = useStyles();
  const { open, title, titleBold, message, confirmText, cancelText, onConfirm, onCancel } = props;

  return (
    <Dialog open={open} fullWidth aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">
        <div>
          <span className={classes.red}>{titleBold}</span>
          {title}
        </div>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        <DialogActions>
          <Button onClick={onCancel} color="error" variant="outlined" aria-label="cancel">
            {cancelText || 'Cancel'}
          </Button>
          <Button onClick={onConfirm} color="error" variant="contained" aria-label="confirm">
            {confirmText || 'Confirm'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
