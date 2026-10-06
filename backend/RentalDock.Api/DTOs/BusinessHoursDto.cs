namespace RentalDock.Api.DTOs;

public sealed record BusinessHoursDto(
    DayOfWeek DayOfWeek,
    bool IsClosed,
    TimeOnly OpenTime,
    TimeOnly CloseTime);
