/* eslint-disable prettier/prettier */
import React, { useState } from 'react';

export interface Picture {
    picId: string;
    picUrl: string;
}

interface ThumbnailListProps {
    pictures: Picture[];
}

const ThumbnailList: React.FC<ThumbnailListProps> = ({ pictures }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    if (!pictures || pictures.length === 0) {
        return <div
            key={"no-image"}
            style={styles.thumbWrapper}>
            <img src={'/no-image.jpg'} alt={"no-inage"} style={styles.thumbnail} loading="lazy" />
        </div>
    }

    return (
        <>
            <div style={styles.container}>
                {pictures.map((pic) => (
                    <div
                        key={pic.picId}
                        style={styles.thumbWrapper}
                        onClick={() => setPreviewUrl(pic.picUrl)}>
                        <img src={pic.picUrl} alt={pic.picId} style={styles.thumbnail} loading="lazy" />
                    </div>
                ))}
            </div>

            {previewUrl && (
                <div style={styles.backdrop} onClick={() => setPreviewUrl(null)}>
                    <img src={previewUrl} style={styles.preview} />
                </div>
            )}
        </>
    );
};

export default ThumbnailList;

/* ---------------- styles ---------------- */

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
    },
    thumbWrapper: {
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        backgroundColor: '#fafafa'
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    backdrop: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    preview: {
        maxWidth: '90%',
        maxHeight: '90%',
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
    }
};
