import { ReactElement } from 'react';
import { Avatar as AvatarBase, Box, Card, CardContent, Grid, Typography } from '@material-ui/core';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import { useTranslation } from 'react-i18next';

const Avatar = styled(AvatarBase)<{ color: string }>`
  background-color: ${({ color }) => color};
`;

interface DetailLinkProps {
  pathname: string;
  search?: string;
}

function DetailLink(props: DetailLinkProps): JSX.Element {
  const { pathname, search } = props;
  const { t } = useTranslation();
  return (
    <Link to={{ pathname, search }}>
      <Typography color="textSecondary" variant="caption">
        {t('dashboard.more')}
      </Typography>
    </Link>
  );
}

interface CardStatusProps {
  title: string;
  value: string | number;
  subTitle: string;
  icon: ReactElement;
  iconColor?: string;
  bgColor?: string;
  detailLink?: ReactElement;
}

function CardStatus(props: CardStatusProps): JSX.Element {
  const useStyles = makeStyles({
    bgRed: {
      backgroundColor: 'rgba(255, 0, 0, 0.5)'
    },
    bgWhite: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)'
    },
    bgYellow: {
      backgroundColor: 'rgba(255, 195, 60, 0.5)'
    },
    bgGreen: {
      backgroundColor: 'rgba(0, 160, 10, 0.5)'
    },
    bgBlue: {
      backgroundColor: 'rgba(0, 50, 220, 0.5)'
    },
    bgGrey: {
      backgroundColor: '#9c9c9c80'
    }
  });
  const classes = useStyles();
  const { title, value, subTitle, icon, iconColor = 'gray', bgColor = 'white', detailLink } = props;
  const handleBGColorCard = (color: string) => {
    switch (color) {
      case 'white':
        return classes.bgWhite;
      case 'red':
        return classes.bgRed;
      case 'yellow':
        return classes.bgYellow;
      case 'green':
        return classes.bgGreen;
      case 'blue':
        return classes.bgBlue;
      case 'grey':
        return classes.bgGrey;
    }
  };
  return (
    <Card className={handleBGColorCard(bgColor)}>
      <CardContent>
        <Grid container spacing={3} justifyContent="space-between">
          <Grid item>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography color="textPrimary" variant="h6">
              {value}
            </Typography>
          </Grid>
          <Grid item>
            <Avatar color={iconColor}>{icon}</Avatar>
          </Grid>
        </Grid>
        <Box alignItems="center" justifyContent="space-between" display="flex" pt="2">
          <Typography color="textSecondary" variant="caption">
            {subTitle}
          </Typography>
          {detailLink}
        </Box>
      </CardContent>
    </Card>
  );
}

export { CardStatus, DetailLink };
