import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Tooltip, IconButton as MuiIconButton } from '@mui/material';

const IconButton = styled(MuiIconButton)`
  svg {
    width: 22px;
    height: 22px;
  }
`;

const Flag = styled.img`
  border-radius: 50%;
  width: 22px;
  height: 22px;
`;

interface LanguageOptionsType {
  [key: string]: {
    icon: string;
    name: string;
  };
}

const languageOptions: LanguageOptionsType = {
  en: {
    icon: '/images/flags/us.png',
    name: 'English'
  },
  th: {
    icon: '/images/flags/th.png',
    name: 'ภาษาไทย'
  }
};

function NavbarLanguagesDropdown(): JSX.Element {
  const { i18n } = useTranslation();
  const handleLanguage = () => {
    // return ['en-US', 'en'].includes(i18n.language) ? 'th' : 'en'
    return 'en';
  };
  const ln = handleLanguage();
  const selectedLanguage = languageOptions[ln];

  const handleLanguageChange = async () => {
    const newLang = handleLanguage();
    await i18n.changeLanguage(newLang);
  };
  return <div />;
  // <Tooltip title="Languages">
  //   <IconButton onClick={handleLanguageChange} color="inherit" size="large">
  //     <Flag src={selectedLanguage.icon} alt={selectedLanguage.name} />
  //   </IconButton>
  // </Tooltip>
}

export default NavbarLanguagesDropdown;
