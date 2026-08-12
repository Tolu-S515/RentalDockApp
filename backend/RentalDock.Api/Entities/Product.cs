namespace RentalDock.Api.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductCondition Condition { get; set; }
    public decimal Price { get; set; }
    public PricingPeriod PricingPeriod { get; set; }
    public decimal DepositAmount { get; set; }
    public string? ImageUrl { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser Owner { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
}

public enum ProductCondition
{
    New,
    LikeNew,
    Good,
    Fair

}

public enum PricingPeriod
{
    Hour,
    Day,
    Week,
    Month
}
