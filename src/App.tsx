import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { Box, CircularProgress } from '@material-ui/core';
import { Toaster } from 'react-hot-toast';
import { routes, ROUTE_PATHS } from './routes';
import LayoutRoute from './layout/LayoutRoute';
import ReleaseNoteDialog from 'components/ReleaseNoteDialog';
import './styles/button.css';
import { DOCUMENT_PREVIEW_CONFIG, DocumentPreviewType } from 'utils/documentPreview';

const DocumentPreview = React.lazy(() => import('./components/DocumentPreview'));

function App(): JSX.Element {
  return (
    <React.Suspense
      fallback={
        <Box
          height="100vh"
          width="100vw"
          display="flex"
          justifyContent="center"
          alignItems="center">
          <CircularProgress />
        </Box>
      }>
      <Router>
        <Toaster />
        <ReleaseNoteDialog />
        <Switch>
          {(Object.keys(DOCUMENT_PREVIEW_CONFIG) as DocumentPreviewType[]).map((type) => (
            <Route
              key={type}
              exact
              path={DOCUMENT_PREVIEW_CONFIG[type].path}
              render={() => <DocumentPreview documentType={type} />}
            />
          ))}
          {routes.map(({ exact, path, component, isPublic, allowedRoles, requiredPermissions }) => (
            <LayoutRoute
              key={path}
              exact={exact}
              path={path}
              component={component}
              isPublic={isPublic}
              allowedRoles={allowedRoles}
              requiredPermissions={requiredPermissions}
            />
          ))}
          <Redirect to={ROUTE_PATHS.NOT_FOUND} />
        </Switch>
      </Router>
    </React.Suspense>
  );
}

export default App;
