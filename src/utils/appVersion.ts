import packageInfo from '../../package.json';

const readInjectedValue = (value: unknown): string => {
    return typeof value === 'string' ? value.trim() : '';
};

const formatBuildMetadata = (): string => {
    const buildDate = readInjectedValue(
        typeof __APP_BUILD_DATE__ !== 'undefined' ? __APP_BUILD_DATE__ : ''
    );
    const commitHash = readInjectedValue(
        typeof __APP_COMMIT_HASH__ !== 'undefined' ? __APP_COMMIT_HASH__ : ''
    );

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
export const buildDate = typeof __APP_BUILD_DATE__ !== 'undefined' ? __APP_BUILD_DATE__ : '';
export const commitHash = typeof __APP_COMMIT_HASH__ !== 'undefined' ? __APP_COMMIT_HASH__ : '';

export const appVersionLabel = (): string => {
    const metadata = formatBuildMetadata();

    return metadata ? `${appVersion}-${metadata}` : appVersion;
};
