package com.prolearner.all.dto;

import java.util.List;

public record OverallStrengthResponse(
        List<OveraallStrengthItem> room1,
        List<OveraallStrengthItem> room2,
        List<OveraallStrengthItem> room3,
        List<OveraallStrengthItem> nightShift
) {
}