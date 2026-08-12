namespace RentalDock.Api.DTOs;
using RentalDock.Api.Entities;

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}