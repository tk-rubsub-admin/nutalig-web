import React from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Avatar, Box, CircularProgress, IconButton } from '@mui/material';
import LightBox, { Slide } from 'yet-another-react-lightbox';
import { Delete } from '@mui/icons-material';
import 'yet-another-react-lightbox/styles.css';

type Props = {
  id: string;
  isMultiple: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  progress?: number;
  files: string[];
  inputId: string;
  onDeleted?: (index: number) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

export default function ThumbnailImageList({
  id,
  isMultiple,
  isDisabled,
  isLoading,
  onDeleted,
  onChange,
  progress = 0,
  files,
  inputId
}: Props) {
  const [lightBoxIndex, setLightBoxIndex] = React.useState(0);
  const [isOpenPreview, setIsOpenPreview] = React.useState(false);

  const slides: Slide[] = files.map((src) => ({ src, width: 1200, height: 1200 }));

  const handleDeleteImage = (index: number) => onDeleted?.(index);

  const isEnableUploadMore = isMultiple && !isDisabled && !isLoading;

  return (
    <>
      <LightBox
        styles={{ root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, .8)' } as any }}
        open={isOpenPreview}
        index={lightBoxIndex}
        close={() => setIsOpenPreview(false)}
        render={{ buttonNext: undefined }}
        slides={slides}
      />

      {/* GRID: เรียงภาพให้สวยงาม, responsive auto-fill */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 2,
          alignItems: 'start'
        }}>
        {files.map((image, index) => (
          <Box
            key={`${image}-${index}`}
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1', // ให้เป็นสี่เหลี่ยมจัตุรัส
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.default',
              boxShadow: 1,
              '&:hover .deleteBtn': { opacity: 1 }
            }}>
            {/* ใช้ Avatar + objectFit ให้ภาพเต็มพื้นที่สวย ๆ */}
            <Avatar
              id={`${id}___preview_image_${index}`}
              src={image}
              variant="rounded"
              alt=""
              onClick={() => {
                setLightBoxIndex(index);
                setIsOpenPreview(true);
              }}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: 0,
                '& img': { objectFit: 'cover' }
              }}
            />

            {!isDisabled && (
              <IconButton
                className="deleteBtn"
                id={`${id}_delete_image_${index}`}
                aria-label="delete"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(index);
                }}
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1,
                    bgcolor: 'error.main',     // ใช้สีแดงจาก theme ตอน hover
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 20,              // ไอคอนขนาดกำลังพอดี
                  }
                }}>
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}

        {/* การ์ดอัปโหลดเพิ่ม ให้หน้าตา match กับรูป */}
        {isEnableUploadMore && (
          <Box
            component="label"
            id={`${id}__upload_more_image_button`}
            sx={{
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              color: 'text.secondary',
              boxShadow: 0,
              '&:hover': { bgcolor: 'action.hover' }
            }}>
            <UploadFileIcon fontSize="large" />
            <input
              hidden
              accept="image/jpeg,image/jpg,image/png"
              type="file"
              multiple={isMultiple}
              id={`${id}_document_uploader_more_button_${inputId}`}
              name={inputId}
              onChange={onChange}
            />
          </Box>
        )}

        {/* การ์ดสถานะกำลังอัปโหลด ดูสม่ำเสมอกับ thumbnail */}
        {isLoading && (
          <Box
            id={`${id}_loading_img`}
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              color: 'text.secondary'
            }}>
            <CircularProgress size={28} variant="determinate" value={progress} />
          </Box>
        )}
      </Box>
    </>
  );
}
