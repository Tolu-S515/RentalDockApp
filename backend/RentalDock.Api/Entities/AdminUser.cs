namespace RentalDock.Api.Entities;

public class AdminUser : ApplicationUser
{
    public override bool CanEditProduct(Product product)
    {
        // Admins can edit any product
        return true;
    }

    public override bool CanDeleteProduct(Product product)
    {
        // Admins can delete any product
        return true;
    }

    public override bool CanManageCategories()
    {
        // Admins can manage all categories
        return true;
    }

    public override bool CanDeleteCategory()
    {
        // Admins can delete categories
        return true;
    }

    public override bool CanManageUsers()
    {
        // Admins can manage users
        return true;
    }

    public override bool CanDeleteUser(ApplicationUser user)
    {
        // Admins can delete any user (except themselves)
        return user.Id != this.Id;
    }

    public override bool CanViewAllBookings()
    {
        // Admins can view all bookings
        return true;
    }

    public override bool CanApproveReviews()
    {
        // Admins can approve reviews
        return true;
    }

    public override string GetRoleName()
    {
        return "Admin";
    }
}
