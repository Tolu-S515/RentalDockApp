namespace RentalDock.Api.DTOs;
using RentalDock.Api.Entities;

public class AddProductRequest
{
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public ProductCondition Condition { get; set; }
    public decimal Price { get; set; }
    public PricingPeriod PricingPeriod { get; set; }
    public decimal DepositAmount { get; set; }
    public string? ImageUrl { get; set; }
    public string Location { get; set; } = string.Empty;
}
