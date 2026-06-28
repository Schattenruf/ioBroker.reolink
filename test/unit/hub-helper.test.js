const { expect } = require('chai');
const {
    buildHubStreamUrl,
    extractMotionState,
    getHubStreamUrls,
    getMotionPollingIntervalMs,
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
});
