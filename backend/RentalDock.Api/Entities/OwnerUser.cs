namespace RentalDock.Api.Entities;

public class OwnerUser : ApplicationUser
{
    public override bool CanEditProduct(Product product)
    {
        // Owners can only edit their own products
        return product.OwnerId == this.Id;
    }

    public override bool CanDeleteProduct(Product product)
    {
        // Owners can only delete their own products
        return product.OwnerId == this.Id;
    }

    public override bool CanManageCategories()
    {
        // Owners cannot manage categories
        return false;
    }

    public override bool CanDeleteCategory()
    {
        // Owners cannot delete categories
        return false;
    }

    public override bool CanManageUsers()
    {
        // Owners cannot manage users
        return false;
    }

    public override bool CanDeleteUser(ApplicationUser user)
    {
        // Owners cannot delete users
        return false;
    }

    public override bool CanViewAllBookings()
    {
        // Owners can view bookings for their products (not all)
        return false;
    }

    public override bool CanApproveReviews()
    {
        // Owners cannot approve reviews
        return false;
    }

    public override string GetRoleName()
    {
        return "Owner";
    }
}
