using RentalDock.Api.Entities;

namespace RentalDock.Api.DTOs;

public sealed class UpdateBookingStatusRequest
{
    public BookingStatus Status { get; set; }
}
