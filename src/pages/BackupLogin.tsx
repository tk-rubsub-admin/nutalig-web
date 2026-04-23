import { useHistory } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Box, Button, Container, TextField, Typography } from '@material-ui/core';
// import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useAuth } from 'auth/AuthContext';
import toast from 'react-hot-toast';

const LoginHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export default function Login(): JSX.Element {
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const auth = useAuth();

  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } =
    useFormik({
      initialValues: {
        username: '',
        password: ''
      },
      validationSchema: Yup.object().shape({
        username: Yup.string().max(255).required(t('authentication.error.usernameRequired')),
        password: Yup.string().max(255).required(t('authentication.error.passwordRequired'))
      }),
      onSubmit: (values, actions) => {
        toast.promise(auth.logInWithUsernameAndPassword(values.username, values.password), {
          loading: t('toast.loading'),
          success: () => {
            actions.setSubmitting(false);
            history.replace('/dashboard');
            return t('authentication.success');
          },
          error: (err) => {
            actions.setSubmitting(false);
            return err.message;
          }
        });
      }
    });

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      justifyContent="center"
      alignItems="center"
      flexDirection="column">
      <Container maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <LoginHeader>
            <Box mb={3}>
              <Typography color="textPrimary" variant="h3">
                {t('login.title')}
              </Typography>
            </Box>
          </LoginHeader>

          <TextField
            error={Boolean(touched.username && errors.username)}
            fullWidth
            helperText={touched.username && errors.username}
            label={t('login.username')}
            margin="normal"
            name="username"
            onBlur={handleBlur}
            onChange={handleChange}
            type="text"
            value={values.username}
            variant="outlined"
            id="login__username_input"
          />

          <TextField
            error={Boolean(touched.password && errors.password)}
            fullWidth
            helperText={touched.password && errors.password}
            label={t('login.password')}
            margin="normal"
            name="password"
            onBlur={handleBlur}
            onChange={handleChange}
            type="password"
            value={values.password}
            variant="outlined"
            id="login__password_input"
          />

          <Box py={2}>
            <Button
              color="primary"
              disabled={isSubmitting}
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              id="login__signin_btn">
              {t('button.signIn')}
            </Button>
          </Box>
        </form>
      </Container>
    </Box>
  );
}
