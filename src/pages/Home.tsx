import { Redirect } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';

export default function Home(): JSX.Element {
  return <Redirect to={ROUTE_PATHS.DASHBOARD} />;
}
