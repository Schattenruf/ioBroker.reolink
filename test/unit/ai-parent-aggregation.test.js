const { expect } = require('chai');
const { aggregateMotionStates } = require('../../build/hub-helper');

describe('AI → Parent Motion Aggregation', () => {
    it('sensor.people.state true should lead to parent motion true', () => {
        // Simulate existing parent states (sensor.motion, sensor.motion_triggered) false
        const parentStates = [false, false];
        const childState = true; // sensor.people.state

        // Aggregation logic used in onStateChange: parent = aggregated || child
        const aggregated = aggregateMotionStates(parentStates);
        const parentValue = aggregated || childState;

        expect(parentValue).to.equal(true);
    });

    it('no AI and no MD results in parent false', () => {
        const parentStates = [false, false];
        const childState = false;
        const aggregated = aggregateMotionStates(parentStates);
        const parentValue = aggregated || childState;
        expect(parentValue).to.equal(false);
    });

    it('aggregates heterogeneous values (string/number/boolean)', () => {
        const parentStates = [0, 'triggered'];
        expect(aggregateMotionStates(parentStates)).to.equal(true);
    });
});
