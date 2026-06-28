export type HubStreamType = 'main' | 'sub';

function normalizeMotionValue(value: unknown): boolean {
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

export function extractMotionState(payload: unknown, cameraChannel?: number): boolean {
    const channel = Number(cameraChannel) || 0;
    const rawEntries = Array.isArray(payload)
        ? payload
        : payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: unknown }).data
          : [payload];
    const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

    const candidates = entries
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
        .map(entry => {
            const value = entry.value;
            if (value && typeof value === 'object') {
                const channelValue = (value as Record<string, unknown>).channel ?? (value as Record<string, unknown>).Channel;
                const possibleState = (value as Record<string, unknown>).state ?? (value as Record<string, unknown>).motion;
                return {
                    channel: Number(channelValue ?? channel),
                    state: normalizeMotionValue(possibleState),
                };
            }

            const entryChannel = (entry.channel ?? entry.Channel) as unknown;
            const possibleState = (entry.state ?? entry.motion ?? entry.alarm_state) as unknown;
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

export function getMotionPollingIntervalMs(useHub: boolean, _apiRefreshIntervalSeconds?: number): number {
    if (!useHub) {
        return 0;
    }

    return 5000;
}

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
