export type HubStreamType = 'main' | 'sub';

export function buildHubStreamUrl(
    cameraIp: string,
    cameraChannel: number,
    streamType: HubStreamType = 'main',
): string {
    const cleanIp = cameraIp?.trim();
    if (!cleanIp) {
        return '';
    }

    const channel = Number(cameraChannel) || 0;
    const channelPart = String(channel).padStart(2, '0');
    const streamPart = streamType === 'sub' ? 'sub' : 'main';
    return `rtsp://${cleanIp}:554/h264Preview_${channelPart}_${streamPart}`;
}

export function getHubStreamUrls(
    cameraIp: string,
    cameraChannel: number,
    activeLink?: string,
): { mainStream: string; subStream: string } {
    const fallbackMain = buildHubStreamUrl(cameraIp, cameraChannel, 'main');
    const fallbackSub = buildHubStreamUrl(cameraIp, cameraChannel, 'sub');

    const mainLink = activeLink?.trim();
    if (mainLink) {
        return {
            mainStream: mainLink,
            subStream: mainLink.includes('_sub') ? mainLink : fallbackSub,
        };
    }

    return {
        mainStream: fallbackMain,
        subStream: fallbackSub,
    };
}
