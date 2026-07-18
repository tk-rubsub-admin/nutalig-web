import { Wrapper } from 'components/Styled';
import PageTitle from 'components/PageTitle';
import UserTodoPanel from 'components/UserTodoPanel';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';

export default function UserTodoManagement(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Page>
      <PageTitle title={t('home.todo.pageTitle')} />
      <Wrapper sx={{ mt: 2, maxWidth: 960 }}>
        <UserTodoPanel />
      </Wrapper>
    </Page>
  );
}
