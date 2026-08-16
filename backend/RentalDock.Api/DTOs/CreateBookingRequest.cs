namespace RentalDock.Api.DTOs;

public sealed class CreateBookingRequest
{
    public Guid ProductId { get; set; }
    public DateTimeOffset StartDateTime { get; set; }
    public DateTimeOffset EndDateTime { get; set; }
}
