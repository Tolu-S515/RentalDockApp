using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using RentalDock.Api.Entities;

namespace RentalDock.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PaymentLog> PaymentLogs => Set<PaymentLog>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ProfileImageUrl).HasMaxLength(2048);

            // Configure Table-Per-Hierarchy (TPH) inheritance
            entity.HasDiscriminator<string>("UserType")
                .HasValue<AdminUser>("AdminUser")
                .HasValue<OwnerUser>("OwnerUser")
                .HasValue<RenterUser>("RenterUser");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Location).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ImageUrl).HasMaxLength(2048);
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.Property(x => x.DepositAmount).HasPrecision(18, 2);
            entity.Property(x => x.Condition).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.PricingPeriod).HasConversion<string>().HasMaxLength(20);
            entity.HasOne(x => x.Owner).WithMany(x => x.Products)
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Category).WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(x => x.RentalSubtotal).HasPrecision(18, 2);
            entity.Property(x => x.DepositAmount).HasPrecision(18, 2);
            entity.Property(x => x.TotalAmount).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Bookings_DateRange", "\"EndDateTime\" > \"StartDateTime\""));
            entity.HasOne(x => x.Product).WithMany(x => x.Bookings)
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Renter).WithMany(x => x.Bookings)
                .HasForeignKey(x => x.RenterId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PaymentLog>(entity =>
        {
            entity.HasIndex(x => x.TransactionId).IsUnique();
            entity.Property(x => x.TransactionId).HasMaxLength(255);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.PaymentType).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(30);
            entity.HasOne(x => x.Booking).WithMany(x => x.PaymentLogs)
                .HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(x => x.BookingId).IsUnique();
            entity.Property(x => x.Comment).HasMaxLength(2000);
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Reviews_Rating", "\"Rating\" BETWEEN 1 AND 5"));
            entity.HasOne(x => x.Booking).WithOne(x => x.Review)
                .HasForeignKey<Review>(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Product).WithMany(x => x.Reviews)
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Reviewer).WithMany(x => x.Reviews)
                .HasForeignKey(x => x.ReviewerId).OnDelete(DeleteBehavior.Restrict);
        });

        // Seed example users for testing
        SeedUsers(modelBuilder);
    }

    private static void SeedUsers(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var ownerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        var renterId = Guid.Parse("00000000-0000-0000-0000-000000000003");

        // Example Admin User
        var adminUser = new AdminUser
        {
            Id = adminId,
            UserName = "admin",
            Email = "admin@rentaldock.com",
            EmailConfirmed = true,
            NormalizedUserName = "ADMIN",
            NormalizedEmail = "ADMIN@RENTALDOCK.COM",
            FirstName = "Admin",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PasswordHash = "AQAAAAIAAYagAAAAEF1234567890abcdefghijklmnopqrst" // Placeholder
        };

        // Example Owner User
        var ownerUser = new OwnerUser
        {
            Id = ownerId,
            UserName = "owner",
            Email = "owner@rentaldock.com",
            EmailConfirmed = true,
            NormalizedUserName = "OWNER",
            NormalizedEmail = "OWNER@RENTALDOCK.COM",
            FirstName = "John",
            LastName = "Owner",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PasswordHash = "AQAAAAIAAYagAAAAEF1234567890abcdefghijklmnopqrst" // Placeholder
        };

        // Example Renter User
        var renterUser = new RenterUser
        {
            Id = renterId,
            UserName = "renter",
            Email = "renter@rentaldock.com",
            EmailConfirmed = true,
            NormalizedUserName = "RENTER",
            NormalizedEmail = "RENTER@RENTALDOCK.COM",
            FirstName = "Jane",
            LastName = "Renter",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PasswordHash = "AQAAAAIAAYagAAAAEF1234567890abcdefghijklmnopqrst" // Placeholder
        };

        // Seed each derived type separately
        modelBuilder.Entity<AdminUser>().HasData(adminUser);
        modelBuilder.Entity<OwnerUser>().HasData(ownerUser);
        modelBuilder.Entity<RenterUser>().HasData(renterUser);
    }
}
