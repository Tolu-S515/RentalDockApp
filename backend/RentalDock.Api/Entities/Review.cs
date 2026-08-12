namespace RentalDock.Api.Entities;

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BookingId { get; set; }
    public Guid ProductId { get; set; }
    public Guid ReviewerId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Booking Booking { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ApplicationUser Reviewer { get; set; } = null!;
}
