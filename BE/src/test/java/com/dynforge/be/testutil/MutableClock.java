package com.dynforge.be.testutil;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

public class MutableClock extends Clock {
    private Instant instant;
    private final ZoneId zone;

    public MutableClock(Instant initialInstant, ZoneId zone) {
        this.instant = initialInstant;
        this.zone = zone != null ? zone : ZoneId.of("UTC");
    }

    public MutableClock(Instant initialInstant) {
        this(initialInstant, ZoneId.of("UTC"));
    }

    public synchronized void setInstant(Instant instant) {
        this.instant = instant;
    }

    public synchronized void advance(Duration duration) {
        this.instant = this.instant.plus(duration);
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new MutableClock(this.instant, zone);
    }

    @Override
    public synchronized Instant instant() {
        return instant;
    }
}
