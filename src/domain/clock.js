// src/domain/clock.js

let forcedSystemTimeOffset = 0;

export const SystemClock = {
    // Returns the current system timestamp plus any artificial time travel offset
    now() {
        return new Date(Date.now() + forcedSystemTimeOffset);
    },

    // Let's you artificially shift time forward inside our test files (e.g., skip forward 3 days)
    travelForwardByMs(ms) {
        forcedSystemTimeOffset += ms;
        console.log(`⏳ System clock shifted forward by ${(ms / 1000 / 60).toFixed(2)} minutes.`);
    },

    // Reset clock back to true physical network calendar parameters
    reset() {
        forcedSystemTimeOffset = 0;
    }
};
