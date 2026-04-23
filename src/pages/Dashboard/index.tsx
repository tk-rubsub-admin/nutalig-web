import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Link,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from 'routes';
import 'rsuite/dist/rsuite.min.css';

export default function Dashboard(): JSX.Element {
  const useStyles = makeStyles({
    alignRight: {
      textAlign: 'right'
    },
    marginTop: {
      marginTop: '15px'
    },
    datePickerFromTo: {
      '&& .MuiOutlinedInput-input': {
        padding: '16.5px 14px'
      }
    },
    center: {
      textAlign: 'center'
    },
    icon: {
      color: 'white',
      fontSize: '50px'
    }
  });
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Page>
      {/* <PageTitle title={t('dashboard.businessAnalytics')} /> */}
      <Grid item xs={12} sm={12}>
        <Wrapper>

        </Wrapper>
      </Grid>
      <br />
    </Page>
  );
}
