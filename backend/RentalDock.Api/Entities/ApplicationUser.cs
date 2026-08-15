using Microsoft.AspNetCore.Identity;

namespace RentalDock.Api.Entities;

public abstract class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? ProfileImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> Products { get; set; } = [];

    public ICollection<Booking> Bookings { get; set; } = [];

    public ICollection<Review> Reviews { get; set; } = [];

    // Permission methods
    public abstract bool CanEditProduct(Product product);
    public abstract bool CanDeleteProduct(Product product);
    public abstract bool CanManageCategories();
    public abstract bool CanDeleteCategory();
    public abstract bool CanManageUsers();
    public abstract bool CanDeleteUser(ApplicationUser user);
    public abstract bool CanViewAllBookings();
    public abstract bool CanApproveReviews();
    public abstract string GetRoleName();
}
