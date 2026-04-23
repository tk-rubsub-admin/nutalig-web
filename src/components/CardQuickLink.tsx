import { Box, Card as BaseCard, CardContent, Typography } from '@material-ui/core';
import styled from 'styled-components';

const Card = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

interface CardQuickLinkProps {
  logo: string;
  title: string;
  link: string;
  description: string;
}

export default function CardQuickLink(props: CardQuickLinkProps): JSX.Element {
  const { logo, title, description, link } = props;
  return (
    <a href={link} target="_blank" rel="noreferrer">
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" pb="3" height="50px" width="auto" mb={2}>
            <img alt={title} src={process.env.PUBLIC_URL + logo} />
          </Box>
          <Typography align="center" color="textPrimary" variant="body1">
            {description}
          </Typography>
        </CardContent>
      </Card>
    </a>
  );
}
