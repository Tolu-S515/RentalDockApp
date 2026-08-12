namespace RentalDock.Api.Entities;

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid RenterId { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public decimal RentalSubtotal { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public ApplicationUser Renter { get; set; } = null!;
    public ICollection<PaymentLog> PaymentLogs { get; set; } = [];
    public Review? Review { get; set; }
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Active,
    Completed,
    Cancelled,
    Rejected
}
