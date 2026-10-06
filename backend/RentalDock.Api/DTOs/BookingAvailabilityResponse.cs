using RentalDock.Api.Entities;

namespace RentalDock.Api.DTOs;

public record BookingAvailabilityResponse(
    DateTime StartDateTime,
    DateTime EndDateTime,
    DateTime BlockedUntil,
    BookingStatus Status);
