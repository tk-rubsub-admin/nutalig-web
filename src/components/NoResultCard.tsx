import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  noResultMessage: {
    textAlign: 'center',
    fontSize: '1.2em',
    fontWeight: 'bold',
    padding: '80px 0'
  }
});

export default function NoResultCard(): JSX.Element {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent>
        <div className={classes.noResultMessage}>{t('warning.noResult')}</div>
      </CardContent>
    </Card>
  );
}
