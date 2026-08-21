import packageInfo from '../../package.json';

const formatBuildMetadata = (): string => {
    const buildDate = __APP_BUILD_DATE__?.trim();
    const commitHash = __APP_COMMIT_HASH__?.trim();

    if (!buildDate && !commitHash) {
        return '';
    }

    if (!buildDate) {
        return commitHash || '';
    }

    if (!commitHash) {
        return buildDate;
    }

    return `${commitHash}@${buildDate}`;
};

export const appVersion = packageInfo.version;
export const buildDate = __APP_BUILD_DATE__;
export const commitHash = __APP_COMMIT_HASH__;

export const appVersionLabel = (): string => {
    const metadata = formatBuildMetadata();

    return metadata ? `${appVersion}-${metadata}` : appVersion;
};
