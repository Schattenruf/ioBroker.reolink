"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHubStreamUrl = buildHubStreamUrl;
exports.getHubStreamUrls = getHubStreamUrls;
function buildHubStreamUrl(cameraIp, cameraChannel, streamType = 'main') {
    const cleanIp = cameraIp?.trim();
    if (!cleanIp) {
        return '';
    }
    const channel = Number(cameraChannel) || 0;
    const channelPart = String(channel).padStart(2, '0');
    const streamPart = streamType === 'sub' ? 'sub' : 'main';
    return `rtsp://${cleanIp}:554/h264Preview_${channelPart}_${streamPart}`;
}
function getHubStreamUrls(cameraIp, cameraChannel, activeLink) {
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
//# sourceMappingURL=hub-helper.js.map