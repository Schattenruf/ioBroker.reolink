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
        return ['1', 'true', 'on', 'active', 'triggered', 'alarm', 'motion', 'detected'].includes(normalized);
    }
    return Boolean(value);
}
function findMotionValue(node) {
    if (node === null || node === undefined) {
        return undefined;
    }
    if (typeof node === 'boolean' || typeof node === 'number' || typeof node === 'string') {
        return normalizeMotionValue(node);
    }
    if (Array.isArray(node)) {
        for (const item of node) {
            const result = findMotionValue(item);
            if (result !== undefined) {
                return result;
            }
        }
        return undefined;
    }
    if (typeof node === 'object') {
        const record = node;
        const directKeys = ['state', 'motion', 'motionState', 'alarm_state', 'alarmState', 'triggered', 'status'];
        for (const key of directKeys) {
            const value = record[key];
            if (value !== undefined) {
                const result = findMotionValue(value);
                if (result !== undefined) {
                    return result;
                }
            }
        }
        for (const value of Object.values(record)) {
            const result = findMotionValue(value);
            if (result !== undefined) {
                return result;
            }
        }
    }
    return undefined;
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
        const nestedChannel = value && typeof value === 'object'
            ? value.channel ?? value.Channel
            : undefined;
        const entryChannel = (entry.channel ?? entry.Channel ?? nestedChannel);
        const modeValue = (value && typeof value === 'object'
            ? findMotionValue(value)
            : undefined) ?? findMotionValue(entry);
        return {
            channel: Number(entryChannel ?? channel),
            state: modeValue ?? false,
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
function normalizeHubHost(cameraIp) {
    const cleanIp = cameraIp?.trim();
    if (!cleanIp) {
        return '';
    }
    if (/^https?:\/\//i.test(cleanIp)) {
        try {
            const url = new URL(cleanIp);
            return url.hostname;
        }
        catch {
            return cleanIp.replace(/^https?:\/\//i, '');
        }
    }
    return cleanIp;
}
function buildHubStreamUrl(cameraIp, cameraChannel, streamType = 'main') {
    const cleanIp = normalizeHubHost(cameraIp);
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