package com.prolearner.all.dto;

import java.util.List;

public record ShiftStrengthResponse(
        List<StrengthCount> firstShift,
        List<StrengthCount> secondShift,
        List<StrengthCount> thirdShift,
        List<StrengthCount> fourthShift
) {
}