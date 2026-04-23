import { Typography } from '@material-ui/core';
import { Editor } from '@tinymce/tinymce-react';
import styled from 'styled-components';
import './HTMLEditor.css';

const MarginButtom = styled.div`
  margin-bottom: 10px;
`;

interface HTMLEditorProp {
  id: string;
  label: string;
  disabled?: boolean;
  initialValue?: string;
  handleOnEditChange: (value: string) => void;
}

const TypographyGray = styled(Typography)`
  color: rgba(0, 0, 0, 0.6);
`;

export default function HTMLEditor({
  id,
  label,
  disabled,
  initialValue,
  handleOnEditChange
}: HTMLEditorProp): JSX.Element {
  const plugins = 'lists';
  const init = {
    menubar: false,
    statusbar: false,
    plugins: [],
    toolbar:
      'formatselect | bold italic underline forecolor | aligncenter alignleft alignright | bullist numlist',
    block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;'
  };

  return (
    <MarginButtom>
      <TypographyGray variant="caption">{label}</TypographyGray>
      <Editor
        id={id}
        init={init}
        initialValue={initialValue}
        plugins={plugins}
        onEditorChange={handleOnEditChange}
        disabled={disabled}
      />
    </MarginButtom>
  );
}
