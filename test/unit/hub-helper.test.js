const { expect } = require('chai');
const {
    aggregateMotionStates,
    buildHubEventServiceUrl,
    buildHubStreamUrl,
    extractMotionState,
    getHubStreamUrls,
    getMotionPollingIntervalMs,
    shouldUseBatteryCamPath,
} = require('../../build/hub-helper');

describe('Hub helper', () => {
    it('should build a hub RTSP URL for the main stream', () => {
        const url = buildHubStreamUrl('192.168.1.50', 1, 'main');
        expect(url).to.equal('rtsp://192.168.1.50:554/h264Preview_01_main');
    });

    it('should build a hub RTSP URL for the sub stream', () => {
        const url = buildHubStreamUrl('192.168.1.50', 2, 'sub');
        expect(url).to.equal('rtsp://192.168.1.50:554/h264Preview_02_sub');
    });

    it('should use the active link when available', () => {
        const urls = getHubStreamUrls('192.168.1.50', 1, 'rtsp://192.168.1.50:554/h264Preview_01_main');
        expect(urls.mainStream).to.equal('rtsp://192.168.1.50:554/h264Preview_01_main');
        expect(urls.subStream).to.equal('rtsp://192.168.1.50:554/h264Preview_01_sub');
    });

    it('should use a fast polling interval for hub motion updates', () => {
        expect(getMotionPollingIntervalMs(true, 30)).to.equal(5000);
        expect(getMotionPollingIntervalMs(false, 30)).to.equal(0);
    });

    it('should extract motion from a hub-style payload', () => {
        const payload = {
            data: [
                { value: { channel: 0, state: 0 } },
                { value: { channel: 1, state: 'triggered' } },
            ],
        };

        expect(extractMotionState(payload, 1)).to.equal(true);
        expect(extractMotionState({ value: { channel: 0, state: 1 } }, 0)).to.equal(true);
        expect(extractMotionState({ value: { channel: 0, state: 0 } }, 0)).to.equal(false);
    });

    it('should use the user-provided host without a scheme for hub URLs', () => {
        expect(buildHubStreamUrl('https://192.168.1.50', 2, 'main')).to.equal('rtsp://192.168.1.50:554/h264Preview_02_main');
    });

    it('should route hub instances through the HTTP camera path', () => {
        expect(shouldUseBatteryCamPath(true, true)).to.equal(false);
        expect(shouldUseBatteryCamPath(true, false)).to.equal(true);
        expect(shouldUseBatteryCamPath(false, true)).to.equal(false);
    });

    it('should build an ONVIF event service URL for hub motion subscriptions', () => {
        expect(buildHubEventServiceUrl('192.168.1.50')).to.equal('http://192.168.1.50:8000/onvif/event_service');
        expect(buildHubEventServiceUrl('https://192.168.1.50')).to.equal('http://192.168.1.50:8000/onvif/event_service');
    });

    it('should aggregate child motion states into a parent motion state', () => {
        expect(aggregateMotionStates([false, false, 'triggered'])).to.equal(true);
        expect(aggregateMotionStates([false, false, 0])).to.equal(false);
    });

    it('should parse nested channel payloads for hub motion updates', () => {
        const payload = {
            data: [
                {
                    channel: 1,
                    value: {
                        state: 'triggered',
                    },
                },
            ],
        };

        expect(extractMotionState(payload, 1)).to.equal(true);
        expect(extractMotionState(payload, 2)).to.equal(false);
    });
});
