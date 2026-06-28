const { expect } = require('chai');
const { buildHubStreamUrl, getHubStreamUrls } = require('../../build/hub-helper');

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
});
