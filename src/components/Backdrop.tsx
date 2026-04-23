import { Backdrop as MUIBackdrop, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

interface Props {
  open: boolean;
}

const useStyles = makeStyles((theme) => ({
  zIndex: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

export default function Backdrop({ open }: Props): JSX.Element {
  const classes = useStyles();

  return (
    <MUIBackdrop open={open} className={classes.zIndex}>
      <CircularProgress color="inherit" />
    </MUIBackdrop>
  );
}
