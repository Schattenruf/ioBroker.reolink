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
        return ['1', 'true', 'on', 'active', 'triggered', 'alarm', 'motion', 'detected'].includes(normalized);
    }
    return Boolean(value);
}

function findMotionValue(node: unknown): boolean | undefined {
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
        const record = node as Record<string, unknown>;
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
            const nestedChannel = value && typeof value === 'object'
                ? (value as Record<string, unknown>).channel ?? (value as Record<string, unknown>).Channel
                : undefined;
            const entryChannel = (entry.channel ?? entry.Channel ?? nestedChannel) as unknown;
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

export function getMotionPollingIntervalMs(useHub: boolean, _apiRefreshIntervalSeconds?: number): number {
    if (!useHub) {
        return 0;
    }

    return 5000;
}

function normalizeHubHost(cameraIp?: string): string {
    const cleanIp = cameraIp?.trim();
    if (!cleanIp) {
        return '';
    }

    if (/^https?:\/\//i.test(cleanIp)) {
        try {
            const url = new URL(cleanIp);
            return url.hostname;
        } catch {
            return cleanIp.replace(/^https?:\/\//i, '');
        }
    }

    return cleanIp;
}

export function buildHubStreamUrl(
    cameraIp: string,
    cameraChannel: number,
    streamType: HubStreamType = 'main',
): string {
    const cleanIp = normalizeHubHost(cameraIp);
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
