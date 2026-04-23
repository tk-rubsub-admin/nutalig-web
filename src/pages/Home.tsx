import { useTranslation } from 'react-i18next';
import { Page } from 'layout/LayoutRoute';

export default function Home(): JSX.Element {
  const { t } = useTranslation();

  return <Page>{t('home.title')}</Page>;
}
