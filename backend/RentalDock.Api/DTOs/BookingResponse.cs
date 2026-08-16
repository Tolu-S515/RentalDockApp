using RentalDock.Api.Entities;

namespace RentalDock.Api.DTOs;

public sealed record BookingResponse(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string? ProductImageUrl,
    DateTime StartDateTime,
    DateTime EndDateTime,
    decimal RentalSubtotal,
    decimal DepositAmount,
    decimal TotalAmount,
    BookingStatus Status,
    DateTime CreatedAt);
