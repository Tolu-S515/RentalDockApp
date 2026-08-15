namespace RentalDock.Api.Entities;

public class RenterUser : ApplicationUser
{
    public override bool CanEditProduct(Product product)
    {
        // Renters cannot edit any products
        return false;
    }

    public override bool CanDeleteProduct(Product product)
    {
        // Renters cannot delete any products
        return false;
    }

    public override bool CanManageCategories()
    {
        // Renters cannot manage categories
        return false;
    }

    public override bool CanDeleteCategory()
    {
        // Renters cannot delete categories
        return false;
    }

    public override bool CanManageUsers()
    {
        // Renters cannot manage users
        return false;
    }

    public override bool CanDeleteUser(ApplicationUser user)
    {
        // Renters cannot delete users
        return false;
    }

    public override bool CanViewAllBookings()
    {
        // Renters can only view their own bookings
        return false;
    }

    public override bool CanApproveReviews()
    {
        // Renters cannot approve reviews
        return false;
    }

    public override string GetRoleName()
    {
        return "Renter";
    }
}
