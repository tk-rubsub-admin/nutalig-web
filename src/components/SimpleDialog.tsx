import { Cancel, CheckCircle, ReportProblem } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, Button, Grid } from '@mui/material';
import React from 'react';

interface SimpleDialogProps {
  open: boolean;
  message?: string;
  icon?: string | null;
  onClose?: () => void;
}

export default function SimpleDialog(props: SimpleDialogProps): JSX.Element {
  const { open, message, icon, onClose } = props;

  return (
    <Dialog open={open} maxWidth="xs" aria-labelledby="form-dialog-title">
      <DialogContent>
        <DialogContent style={{ textAlign: 'center' }}>
          <Grid item xs={12} sm={12}>
            {icon === 'error' ? (
              <Cancel style={{ fontSize: '60px', color: '#ff3333' }} />
            ) : icon === 'warning' ? (
              <ReportProblem style={{ fontSize: '60px', color: '#f5c122' }} />
            ) : icon === 'success' ? (
              <CheckCircle style={{ fontSize: '60px', color: '#009944' }} />
            ) : (
              ''
            )}
          </Grid>
          <Grid item xs={12} sm={12} style={{ fontSize: '18px' }}>
            {message?.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button onClick={onClose} color="primary" variant="contained" aria-label="cancel">
            {'ตกลง'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
