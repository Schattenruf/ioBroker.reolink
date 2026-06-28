"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMotionState = extractMotionState;
exports.getMotionPollingIntervalMs = getMotionPollingIntervalMs;
exports.buildHubStreamUrl = buildHubStreamUrl;
exports.getHubStreamUrls = getHubStreamUrls;
function normalizeMotionValue(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['1', 'true', 'on', 'active', 'triggered', 'alarm', 'motion'].includes(normalized);
    }
    return Boolean(value);
}
function extractMotionState(payload, cameraChannel) {
    const channel = Number(cameraChannel) || 0;
    const rawEntries = Array.isArray(payload)
        ? payload
        : payload && typeof payload === 'object' && 'data' in payload
            ? payload.data
            : [payload];
    const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];
    const candidates = entries
        .filter((entry) => Boolean(entry) && typeof entry === 'object')
        .map(entry => {
        const value = entry.value;
        if (value && typeof value === 'object') {
            const channelValue = value.channel ?? value.Channel;
            const possibleState = value.state ?? value.motion;
            return {
                channel: Number(channelValue ?? channel),
                state: normalizeMotionValue(possibleState),
            };
        }
        const entryChannel = (entry.channel ?? entry.Channel);
        const possibleState = (entry.state ?? entry.motion ?? entry.alarm_state);
        return {
            channel: Number(entryChannel ?? channel),
            state: normalizeMotionValue(possibleState),
        };
    });
    const matchingChannel = candidates.find(candidate => candidate.channel === channel);
    if (matchingChannel) {
        return matchingChannel.state;
    }
    return candidates[0]?.state ?? false;
}
function getMotionPollingIntervalMs(useHub, _apiRefreshIntervalSeconds) {
    if (!useHub) {
        return 0;
    }
    return 5000;
}
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